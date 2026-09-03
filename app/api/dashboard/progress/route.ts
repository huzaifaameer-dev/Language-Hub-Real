import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getStudentProgressCollection, getEnrollmentsCollection, getCoursesCollection } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET: Returns the student's progress data for all enrolled courses.
 * POST: Updates progress (toggle chapter, mark attendance, set lastChapter).
 */

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  const progress = await getStudentProgressCollection();
  const records = await progress
    .find({ userId: session.user.id })
    .sort({ updatedAt: -1 })
    .toArray();

  return NextResponse.json({ progress: records.map((r) => ({
    id: String(r._id),
    enrollmentId: r.enrollmentId,
    course: r.course,
    chapters: r.chapters,
    attendance: r.attendance,
    lastChapter: r.lastChapter,
    updatedAt: r.updatedAt.toISOString(),
  }))});
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({})) as {
    enrollmentId?: string;
    action?: "toggle_chapter" | "mark_attendance" | "set_last_chapter" | "init";
    chapterTitle?: string;
    date?: string;
    attended?: boolean;
    topic?: string;
  };

  if (!body.enrollmentId || !body.action) {
    return NextResponse.json({ message: "Missing enrollmentId or action." }, { status: 400 });
  }

  const enrollments = await getEnrollmentsCollection();
  const enr = await enrollments.findOne({
    _id: new ObjectId(body.enrollmentId),
    userId: session.user.id,
    status: "ENROLLED",
  });
  if (!enr) {
    return NextResponse.json({ message: "No active enrollment found." }, { status: 404 });
  }

  const progressCol = await getStudentProgressCollection();
  const courses = await getCoursesCollection();
  const courseDoc = await courses.findOne({ name: enr.subjects?.[0] });
  const courseName = enr.subjects?.[0] ?? "";

  // Initialize progress if it doesn't exist
  let record = await progressCol.findOne({ userId: session.user.id, enrollmentId: body.enrollmentId });

  if (!record || body.action === "init") {
    // Build chapter list from course modules
    const modules = courseDoc?.modules ?? [];
    const chapters = modules.flatMap((m) =>
      m.topics.map((t) => ({
        title: t,
        completed: false,
        completedAt: null as Date | null,
      }))
    );

    if (!record) {
      const now = new Date();
      await progressCol.insertOne({
        userId: session.user.id,
        enrollmentId: body.enrollmentId,
        course: courseName,
        chapters,
        attendance: [],
        lastChapter: null,
        createdAt: now,
        updatedAt: now,
      });
      record = await progressCol.findOne({ userId: session.user.id, enrollmentId: body.enrollmentId });
    }
  }

  if (!record) {
    return NextResponse.json({ message: "Could not initialise progress." }, { status: 500 });
  }

  const now = new Date();

  if (body.action === "toggle_chapter" && body.chapterTitle) {
    const idx = record.chapters.findIndex((c) => c.title === body.chapterTitle);
    if (idx >= 0) {
      const updated = [...record.chapters];
      updated[idx] = {
        ...updated[idx],
        completed: !updated[idx].completed,
        completedAt: !updated[idx].completed ? now : null,
      };
      await progressCol.updateOne(
        { _id: record._id },
        { $set: { chapters: updated, lastChapter: body.chapterTitle, updatedAt: now } }
      );
    }
  } else if (body.action === "mark_attendance" && body.date) {
    const attendance = [...record.attendance];
    const existing = attendance.findIndex((a) => a.date === body.date);
    if (existing >= 0) {
      attendance[existing] = { ...attendance[existing], attended: body.attended ?? true, topic: body.topic };
    } else {
      attendance.push({ date: body.date, attended: body.attended ?? true, topic: body.topic });
    }
    await progressCol.updateOne(
      { _id: record._id },
      { $set: { attendance, updatedAt: now } }
    );
  } else if (body.action === "set_last_chapter" && body.chapterTitle) {
    await progressCol.updateOne(
      { _id: record._id },
      { $set: { lastChapter: body.chapterTitle, updatedAt: now } }
    );
  }

  const updated = await progressCol.findOne({ _id: record._id });
  return NextResponse.json({ ok: true, progress: updated ? {
    id: String(updated._id),
    enrollmentId: updated.enrollmentId,
    course: updated.course,
    chapters: updated.chapters,
    attendance: updated.attendance,
    lastChapter: updated.lastChapter,
    updatedAt: updated.updatedAt.toISOString(),
  } : null });
}
