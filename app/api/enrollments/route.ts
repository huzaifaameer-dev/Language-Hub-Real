import { NextResponse } from "next/server";

import { auth } from "@/auth";
import {
  getApplicationsCollection,
  getEnrollmentsCollection,
  getCoursesCollection,
  ensureIndexesAndAdmin,
} from "@/lib/db";
import { publishEvent } from "@/lib/realtime";
import { EnrollmentSchema, fieldErrors } from "@/lib/validate";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";
import { notifyAdmins } from "@/lib/notifications";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  const rl = await rateLimitDb(clientKey(request, `enroll:${session.user.id}`), 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { message: "Too many submissions. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const parsed = EnrollmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: fieldErrors(parsed) },
      { status: 400 }
    );
  }

  await ensureIndexesAndAdmin();
  const applications = await getApplicationsCollection();
  const enrollments = await getEnrollmentsCollection();

  const approved = await applications
    .find(
      { userId: session.user.id, status: "APPROVED" },
      { projection: { _id: 1, name: 1, email: 1 } }
    )
    .sort({ createdAt: -1 })
    .toArray();

  if (approved.length === 0) {
    return NextResponse.json(
      { message: "Your application must be approved before enrolling." },
      { status: 403 }
    );
  }

  const existingEnrolled = await enrollments.findOne({
    userId: session.user.id,
    status: { $in: ["PENDING", "ENROLLED"] },
  });
  if (existingEnrolled) {
    return NextResponse.json(
      { message: "You already have an enrollment in progress." },
      { status: 409 }
    );
  }

const data = parsed.data;
  const now = new Date();

  // Seat gate: reject when any chosen subject's batch is already full in the
  // live catalog, so admin never over-subscribes a running batch.
  await ensureIndexesAndAdmin();
  const coursesCol = await getCoursesCollection();
  const [courseDocs, enrolledDocs] = await Promise.all([
    coursesCol.find({ active: true, name: { $in: data.subjects } }).toArray(),
    enrollments
      .find({ status: "ENROLLED" })
      .project({ batch: 1 })
      .toArray(),
  ]);
  const batchCount = new Map<string, number>();
  for (const e of enrolledDocs) batchCount.set(e.batch, (batchCount.get(e.batch) ?? 0) + 1);
  const full: string[] = [];
  for (const c of courseDocs) {
    const batch = (c.batches ?? []).find((b) => b.name === data.batch);
    if (batch && (batchCount.get(batch.name) ?? 0) >= batch.seatsTotal) {
      full.push(`${c.name} · ${batch.name}`);
    }
  }
  if (full.length > 0) {
    return NextResponse.json(
      {
        message: `That batch is full. Try another batch: ${full.join(", ")}`,
        code: "BATCH_FULL",
      },
      { status: 409 }
    );
  }

  const result = await enrollments.insertOne({
    userId: session.user.id,
    applicationId: String(approved[0]._id),
    name: (approved[0].name as string) ?? session.user.name ?? "Learner",
    email: (session.user.email ?? "").trim(),
    subjects: data.subjects,
    batch: data.batch,
    plan: data.plan || undefined,
    status: "PENDING",
    adminMessage: null,
    createdAt: now,
    updatedAt: now,
  });

  publishEvent({ table: "enrollments", userId: session.user.id, at: Date.now() });

  await notifyAdmins({
    kind: "enrollment",
    title: "New enrollment request",
    message: `${data.subjects.join(", ")} · Batch ${data.batch}`,
    href: "/admin-panel",
  });

  return NextResponse.json(
    { id: String(result.insertedId), ok: true, status: "PENDING" },
    { status: 201 }
  );
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  await ensureIndexesAndAdmin();
  const enrollments = await getEnrollmentsCollection();

  const docs = await enrollments
    .find({ userId: session.user.id }, { projection: { userId: 0 } })
    .sort({ createdAt: -1 })
    .toArray();

  const list = docs.map((d) => ({
    id: String(d._id),
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