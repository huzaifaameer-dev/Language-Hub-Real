import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getAssignmentsCollection } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET: Returns assignments for the signed-in student.
 * POST: Creates a new assignment submission or adds to an existing one.
 */

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  const assignments = await getAssignmentsCollection();
  const records = await assignments
    .find({ userId: session.user.id })
    .sort({ updatedAt: -1 })
    .toArray();

  return NextResponse.json({
    assignments: records.map((r) => ({
      id: String(r._id),
      course: r.course,
      title: r.title,
      description: r.description,
      studentAnswer: r.studentAnswer,
      status: r.status,
      grade: r.grade,
      feedbackCount: r.feedbackThread.length,
      lastFeedback: r.feedbackThread.length > 0
        ? r.feedbackThread[r.feedbackThread.length - 1]
        : null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({})) as {
    enrollmentId?: string;
    assignmentId?: string;
    action?: "submit" | "update" | "reply";
    title?: string;
    description?: string;
    studentAnswer?: string;
    message?: string;
  };

  if (!body.enrollmentId || !body.action) {
    return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
  }

  const assignments = await getAssignmentsCollection();
  const now = new Date();

  if (body.action === "submit" && body.title && body.studentAnswer) {
    const result = await assignments.insertOne({
      userId: session.user.id,
      enrollmentId: body.enrollmentId,
      course: "",
      title: body.title,
      description: body.description ?? "",
      studentAnswer: body.studentAnswer,
      status: "SUBMITTED",
      feedbackThread: [],
      createdAt: now,
      updatedAt: now,
    });
    return NextResponse.json({ id: String(result.insertedId), ok: true }, { status: 201 });
  }

  if (body.action === "reply" && body.assignmentId && body.message) {
    const assignment = await assignments.findOne({
      _id: new ObjectId(body.assignmentId),
      userId: session.user.id,
    });
    if (!assignment) {
      return NextResponse.json({ message: "Assignment not found." }, { status: 404 });
    }

    const thread = [...assignment.feedbackThread, {
      sender: "student" as const,
      message: body.message,
      createdAt: now,
    }];

    await assignments.updateOne(
      { _id: assignment._id },
      { $set: { feedbackThread: thread, updatedAt: now } }
    );

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ message: "Invalid action." }, { status: 400 });
}
