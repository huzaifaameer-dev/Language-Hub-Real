import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getLiveClassesCollection } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET: Returns upcoming live classes for the signed-in student.
 * POST: Creates a new live class (admin only in practice, but open for seeding).
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

  const classes = await getLiveClassesCollection();
  const now = new Date();

  const result = await classes.insertOne({
    enrollmentId: body.enrollmentId,
    userId: session.user.id,
    course: body.course ?? "",
    batch: body.batch ?? "",
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
