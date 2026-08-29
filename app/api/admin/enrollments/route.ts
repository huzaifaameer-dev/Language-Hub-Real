import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { requireAdmin, isValidObjectId } from "@/lib/admin-guard";
import { ensureIndexesAndAdmin, getEnrollmentsCollection } from "@/lib/db";
import { publishEvent } from "@/lib/realtime";
import { notify } from "@/lib/notifications";
import { z } from "zod";

const PatchSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["ENROLL", "REJECT"]),
  message: z.string().max(600).optional().default(""),
});

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  await ensureIndexesAndAdmin();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status")?.toUpperCase();

  const enrollments = await getEnrollmentsCollection();
  const docs = await enrollments
    .find(status === "PENDING" || status === "ENROLLED" || status === "REJECTED" ? { status } : {})
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  const list = docs.map((d) => ({
    id: String(d._id),
    userId: d.userId,
    applicationId: d.applicationId,
    name: d.name,
    email: d.email,
    subjects: d.subjects,
    batch: d.batch,
    plan: d.plan,
    status: d.status,
    adminMessage: d.adminMessage,
    createdAt: d.createdAt.toISOString(),
  }));

  return NextResponse.json({ enrollments: list });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 }
    );
  }

  const { id, action, message } = parsed.data;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ message: "Invalid record id." }, { status: 400 });
  }

  await ensureIndexesAndAdmin();
  const enrollments = await getEnrollmentsCollection();

  const target = await enrollments.findOne(
    { _id: new ObjectId(id) },
    { projection: { userId: 1 } }
  );

  const status = action === "ENROLL" ? "ENROLLED" : "REJECTED";
  const result = await enrollments.updateOne(
    { _id: new ObjectId(id) },
    { $set: { status, adminMessage: message || null, updatedAt: new Date() } }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ message: "Record not found." }, { status: 404 });
  }

  publishEvent({
    table: "enrollments",
    userId: target?.userId as string | undefined,
    at: Date.now(),
  });

  if (target?.userId) {
    await notify(String(target.userId), {
      kind: "enrollment",
      title: status === "ENROLLED" ? "Enrollment confirmed" : "Enrollment declined",
      message:
        message ||
        (status === "ENROLLED"
          ? "Your seat is locked in. Your bookshelf is ready."
          : "Your enrollment request was declined."),
      href: "/dashboard",
    });
  }

  return NextResponse.json({ ok: true, status });
}