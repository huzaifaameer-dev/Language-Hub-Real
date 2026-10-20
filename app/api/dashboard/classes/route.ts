import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getLiveClassesCollection, getEnrollmentsCollection } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET: Returns upcoming live classes for the signed-in student.
 * POST: Creates a live class — staff only. Students must never be able to
 * schedule (or grant themselves access to) a class.
 */

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  const classes = await getLiveClassesCollection();
  const now = new Date().toISOString();

  const upcoming = await classes
    .find({ userId: session.user.id, scheduledAt: { $gte: now } })
    .sort({ scheduledAt: 1 })
    .limit(20)
    .toArray();

  const past = await classes
    .find({ userId: session.user.id, scheduledAt: { $lt: now } })
    .sort({ scheduledAt: -1 })
    .limit(10)
    .toArray();

  return NextResponse.json({
    upcoming: upcoming.map(formatClass),
    past: past.map(formatClass),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "TEACHER") {
    return NextResponse.json({ message: "Only staff can schedule classes." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({})) as {
    enrollmentId?: string;
    course?: string;
    batch?: string;
    title?: string;
    scheduledAt?: string;
    durationMinutes?: number;
    meetingLink?: string;
    platform?: string;
    instructor?: string;
  };

  if (!body.enrollmentId || !body.title || !body.scheduledAt || !body.meetingLink) {
    return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
  }
  if (!ObjectId.isValid(body.enrollmentId)) {
    return NextResponse.json({ message: "Invalid enrollmentId." }, { status: 400 });
  }

  // The class belongs to the enrolled student, not the staff member creating
  // it — GET filters by userId, so writing the actor's id would file the class
  // under the teacher and hide it from the student.
  const enr = await (await getEnrollmentsCollection()).findOne({ _id: new ObjectId(body.enrollmentId) });
  if (!enr) {
    return NextResponse.json({ message: "Enrollment not found." }, { status: 404 });
  }

  const classes = await getLiveClassesCollection();
  const now = new Date();

  const result = await classes.insertOne({
    enrollmentId: body.enrollmentId,
    userId: enr.userId,
    course: body.course ?? enr.subjects?.[0] ?? "",
    batch: body.batch ?? enr.batch ?? "",
    title: body.title,
    scheduledAt: body.scheduledAt,
    durationMinutes: body.durationMinutes ?? 60,
    meetingLink: body.meetingLink,
    platform: body.platform ?? "Zoom",
    instructor: body.instructor ?? "",
    createdAt: now,
  });

  return NextResponse.json({ id: String(result.insertedId), ok: true }, { status: 201 });
}

function formatClass(c: { _id?: unknown; title: string; scheduledAt: string; durationMinutes: number; meetingLink: string; platform: string; instructor: string; course: string; batch: string }) {
  return {
    id: String(c._id),
    title: c.title,
    scheduledAt: c.scheduledAt,
    durationMinutes: c.durationMinutes,
    meetingLink: c.meetingLink,
    platform: c.platform,
    instructor: c.instructor,
    course: c.course,
    batch: c.batch,
  };
}
