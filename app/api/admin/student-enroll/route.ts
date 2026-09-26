import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { revalidateTag } from "next/cache";

import { requireAdmin, isValidObjectId } from "@/lib/admin-guard";
import {
  ensureIndexesAndAdmin,
  getDb,
  getEnrollmentsCollection,
  getUsersCollection,
  getCoursesCollection,
  getApplicationsCollection,
  logAdminAction,
} from "@/lib/db";
import { publishEvent } from "@/lib/realtime";
import { notify } from "@/lib/notifications";
import { sendDecisionEmail } from "@/lib/email";
import { sendWaText } from "@/lib/whatsapp";
import { formatPKR } from "@/lib/course-data";
import { z } from "zod";

export const dynamic = "force-dynamic";

const EnrollSchema = z.object({
  userId: z.string().min(1),
  course: z.string().min(1).max(120),
  batch: z.string().max(80).optional().default(""),
  message: z.string().max(600).optional().default(""),
});

/**
 * Admin enrolls a specific student into a specific course (contact-based flow).
 * Creates an ENROLLED enrollment directly, records the course fee as a PENDING
 * deposit, and sends the student a congratulation message on WhatsApp / email.
 */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const parsed = EnrollSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Validation failed." }, { status: 400 });
  }

  const { userId, course, batch, message } = parsed.data;
  if (!isValidObjectId(userId)) {
    return NextResponse.json({ message: "Invalid user id." }, { status: 400 });
  }

  await ensureIndexesAndAdmin();

  // Resolve the student account.
  const users = await getUsersCollection();
  const user = await users.findOne({ _id: new ObjectId(userId) });
  if (!user) return NextResponse.json({ message: "User not found." }, { status: 404 });

  // Resolve the course fee.
  const courses = await getCoursesCollection();
  const courseDoc = await courses.findOne({ name: course, active: true });
  if (!courseDoc) {
    return NextResponse.json({ message: "Course not found or inactive." }, { status: 404 });
  }
  const amount = Number(courseDoc.fee ?? 0);

  // Pick the student's latest approved application for this course (if any).
  const apps = await getApplicationsCollection();
  const approvedApp = await apps.findOne({
    userId,
    course,
    status: "APPROVED",
  });

  // Prevent duplicate active enrollment for the same course.
  const enrollments = await getEnrollmentsCollection();
  const dup = await enrollments.findOne({ userId, subjects: { $in: [course] }, status: { $in: ["ENROLLED"] } });
  if (dup) {
    return NextResponse.json({ message: `${course} is already enrolled for this student.` }, { status: 409 });
  }

  const now = new Date();
  const result = await enrollments.insertOne({
    userId,
    applicationId: approvedApp ? String(approvedApp._id) : "",
    name: user.name,
    email: user.email,
    subjects: [course],
    batch: batch || (courseDoc.batches?.[0]?.name ?? ""),
    plan: "",
    paymentMethod: null,
    paymentInstructions: null,
    paymentProof: null,
    status: "ENROLLED",
    adminMessage: message || null,
    createdAt: now,
    updatedAt: now,
  });

  // Record the course fee as a PENDING deposit so it appears in Payments.
  try {
    const db = await getDb();
    const already = await db.collection("payments").findOne({
      userId,
      note: { $regex: "auto:" + course.replace(/[^a-z0-9]+/gi, "-") + ":" },
      status: { $in: ["PENDING", "PAID"] },
    });
    if (!already && amount > 0) {
      await db.collection("payments").insertOne({
        enrollmentId: String(result.insertedId),
        userId,
        amount,
        currency: "PKR",
        provider: "manual",
        status: "PENDING",
        type: "DEPOSIT",
        method: "bank",
        note: `auto:${course.replace(/[^a-z0-9]+/gi, "-") || "course"}:${String(userId)}`,
        studentName: user.name,
        studentEmail: user.email,
        createdBy: `${admin.email ?? "admin"} / AI Agent`,
        createdAt: now,
        updatedAt: now,
      });
    }
  } catch {
    // ledger is best-effort
  }

  // Notify the student.
  publishEvent({ table: "enrollments", userId, at: Date.now() });
  void notify(String(userId), {
    kind: "enrollment",
    title: "You are enrolled 🎉",
    message: message || `Congratulations! You are now enrolled in ${course}. Welcome to Language Hub!`,
    href: "/dashboard",
  }).catch(() => {});

  if (user.email) {
    void sendDecisionEmail({
      to: user.email,
      name: user.name,
      kind: "enrollment",
      approved: true,
      subject: "You are enrolled 🎉",
      message: message || `Congratulations! You are now enrolled in ${course}. Welcome aboard!`,
      href: "/dashboard",
    }).catch(() => {});
  }

  const phone = (user as { phone?: string; whatsapp?: string }).phone || (user as { phone?: string; whatsapp?: string }).whatsapp;
  if (phone) {
    void sendWaText({
      to: phone,
      text: `🎉 Congratulations ${user.name}! You are now enrolled in ${course} at Language Hub${
        amount > 0 ? ` (fee: ${formatPKR(amount)})` : ""
      }. Our team will guide you through the next steps. Welcome aboard!`,
    }).catch(() => {});
  }

  revalidateTag("catalog", { expire: 0 });
  void logAdminAction({
    actor: admin.email ?? "admin",
    action: "ENROLL",
    targetType: "student",
    targetLabel: user.email,
    detail: `${course}`,
  });

  return NextResponse.json(
    { ok: true, enrollmentId: String(result.insertedId), course, status: "ENROLLED" },
    { status: 201 }
  );
}

/** List students with their contact info + existing enrollments for the UI. */
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  await ensureIndexesAndAdmin();
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 50) || 50);

  const users = await getUsersCollection();
  const enrollments = await getEnrollmentsCollection();

  const baseQuery: Record<string, unknown> = { role: { $ne: "ADMIN" } };
  if (q) {
    baseQuery.$or = [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ];
  }
  const userDocs = await users.find(baseQuery).sort({ createdAt: -1 }).limit(limit).toArray();
  const enrDocs = await enrollments
    .find({ userId: { $in: userDocs.map((u) => String(u._id)) }, status: "ENROLLED" })
    .project({ userId: 1, subjects: 1, batch: 1, createdAt: 1 })
    .toArray();

  const enrByUser = new Map<string, { subjects: string[]; batch: string; createdAt: string }[]>();
  for (const e of enrDocs) {
    const uid = String(e.userId);
    const arr = enrByUser.get(uid) ?? [];
    arr.push({
      subjects: e.subjects,
      batch: e.batch,
      createdAt: e.createdAt?.toISOString?.() ?? new Date().toISOString(),
    });
    enrByUser.set(uid, arr);
  }

  const list = userDocs.map((u) => ({
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role,
    image: u.image ?? null,
    emailVerified: u.emailVerified ? (u.emailVerified instanceof Date ? u.emailVerified : new Date(u.emailVerified)).toISOString() : null,
    phone: (u as { phone?: string; whatsapp?: string }).phone || (u as { phone?: string; whatsapp?: string }).whatsapp || null,
    createdAt: u.createdAt?.toISOString?.() ?? null,
    enrollments: enrByUser.get(String(u._id)) ?? [],
  }));

  return NextResponse.json({ students: list });
}