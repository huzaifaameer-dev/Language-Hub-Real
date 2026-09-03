import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getCertificatesCollection, getStudentProgressCollection, getEnrollmentsCollection } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET: Returns all certificates for the signed-in student.
 * POST: Issues a new certificate (auto-generates when course is completed).
 */

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  const certs = await getCertificatesCollection();
  const records = await certs
    .find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({
    certificates: records.map((r) => ({
      id: String(r._id),
      certificateId: r.certificateId,
      studentName: r.studentName,
      course: r.course,
      batch: r.batch,
      issuedAt: r.issuedAt,
      completionPercent: r.completionPercent,
      signedBy: r.signedBy,
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
  };

  if (!body.enrollmentId) {
    return NextResponse.json({ message: "Missing enrollmentId." }, { status: 400 });
  }

  const enrollments = await getEnrollmentsCollection();
  const enr = await enrollments.findOne({
    _id: new ObjectId(body.enrollmentId),
    userId: session.user.id,
    status: "ENROLLED",
  });
  if (!enr) {
    return NextResponse.json({ message: "Enrollment not found." }, { status: 404 });
  }

  // Check progress — certificate only if >= 80% complete
  const progressCol = await getStudentProgressCollection();
  const progress = await progressCol.findOne({
    userId: session.user.id,
    enrollmentId: body.enrollmentId,
  });

  let completionPercent = 0;
  if (progress && progress.chapters.length > 0) {
    const completed = progress.chapters.filter((c) => c.completed).length;
    completionPercent = Math.round((completed / progress.chapters.length) * 100);
  }

  if (completionPercent < 80) {
    return NextResponse.json(
      { message: `You need at least 80% completion to earn a certificate. Current: ${completionPercent}%` },
      { status: 400 }
    );
  }

  // Check if certificate already issued
  const certs = await getCertificatesCollection();
  const existing = await certs.findOne({
    userId: session.user.id,
    enrollmentId: body.enrollmentId,
  });
  if (existing) {
    return NextResponse.json({
      id: String(existing._id),
      certificateId: existing.certificateId,
      alreadyExists: true,
    });
  }

  // Generate unique certificate ID
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const certificateId = `LH-${timestamp}-${random}`;

  const now = new Date();
  const result = await certs.insertOne({
    userId: session.user.id,
    enrollmentId: body.enrollmentId,
    studentName: enr.name || session.user.name || "Student",
    course: enr.subjects?.[0] ?? "",
    batch: enr.batch,
    issuedAt: now.toISOString().split("T")[0],
    completionPercent,
    signedBy: "Javeria Malik",
    certificateId,
    createdAt: now,
  });

  return NextResponse.json({
    id: String(result.insertedId),
    certificateId,
    ok: true,
  }, { status: 201 });
}
