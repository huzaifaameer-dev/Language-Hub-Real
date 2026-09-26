import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { auth } from "@/auth";
import { CONTACT } from "@/lib/content";
import {
  getApplicationsCollection,
  getEnrollmentsCollection,
  getUsersCollection,
  getStudentProgressCollection,
  getLiveClassesCollection,
  getCertificatesCollection,
  getAssignmentsCollection,
} from "@/lib/db";
import { getPublicCatalog } from "@/lib/course-stats";
import { stripeConfigured } from "@/lib/stripe";
import { konnectConfigured } from "@/lib/konnect";

export const dynamic = "force-dynamic";

/**
 * One-shot payload for the student dashboard: replaces four round-trips
 * (/api/me, /api/applications, /api/enrollments, /api/courses) with one.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }
  if (!ObjectId.isValid(session.user.id)) {
    return NextResponse.json({ message: "Invalid session." }, { status: 400 });
  }

  const user = await getUsersCollection().then((users) =>
    users.findOne({ _id: new ObjectId(session.user.id) })
  );
  if (!user) {
    return NextResponse.json({ message: "Session expired. Sign in again." }, { status: 401 });
  }

  const [applications, enrollments, catalog, progressRecords, liveClasses, certificates, assignments] = await Promise.all([
    (async () => {
      const col = await getApplicationsCollection();
      const docs = await col
        .find({ userId: session.user.id }, { projection: { userId: 0 } })
        .sort({ createdAt: -1 })
        .toArray();
      return docs.map((d) => ({
        id: String(d._id),
        name: d.name,
        email: d.email,
        place: d.place,
        bio: d.bio,
        course: d.course,
        message: d.message,
        status: d.status,
        adminMessage: d.adminMessage,
        createdAt: d.createdAt.toISOString(),
      }));
    })(),
    (async () => {
      const col = await getEnrollmentsCollection();
      const docs = await col
        .find({ userId: session.user.id }, { projection: { userId: 0 } })
        .sort({ createdAt: -1 })
        .toArray();
      return docs.map((d) => ({
        id: String(d._id),
        applicationId: d.applicationId,
        name: d.name,
        email: d.email,
        subjects: d.subjects,
        batch: d.batch,
        plan: d.plan,
        paymentMethod: d.paymentMethod,
        paymentInstructions: d.paymentInstructions,
        paymentProof: d.paymentProof,
        status: d.status,
        adminMessage: d.adminMessage,
        createdAt: d.createdAt.toISOString(),
      }));
    })(),
    getPublicCatalog(),
    (async () => {
      const col = await getStudentProgressCollection();
      return col.find({ userId: session.user.id }).toArray();
    })(),
    (async () => {
      const col = await getLiveClassesCollection();
      const now = new Date().toISOString();
      return col.find({ userId: session.user.id, scheduledAt: { $gte: now } }).sort({ scheduledAt: 1 }).limit(10).toArray();
    })(),
    (async () => {
      const col = await getCertificatesCollection();
      return col.find({ userId: session.user.id }).sort({ createdAt: -1 }).toArray();
    })(),
    (async () => {
      const col = await getAssignmentsCollection();
      return col.find({ userId: session.user.id }).sort({ updatedAt: -1 }).limit(20).toArray();
    })(),
  ]);

  // Support contact tile: only the env-provided studio WhatsApp is surfaced.
  // The admin's private email is never exposed to regular users.
  return NextResponse.json({
    onlinePayment: stripeConfigured(),
    konnectPayment: konnectConfigured(),
    user: {
      name: user.name,
      email: user.email,
      whatsapp: user.whatsapp ?? "",
      role: user.role ?? "USER",
      image: user.image ?? null,
      createdAt: user.createdAt?.toISOString?.() ?? null,
    },
    support: {
      whatsapp:
        (process.env.ACADEMY_WHATSAPP || process.env.NEXT_PUBLIC_ACADEMY_WHATSAPP || CONTACT.whatsapp)?.replace(/[^\d]/g, "") || null,
      email:
        process.env.ACADEMY_EMAIL || process.env.NEXT_PUBLIC_ACADEMY_EMAIL || (CONTACT.email || null),
    },
    applications,
    enrollments,
    courses: catalog.courses,
    progress: progressRecords.map((r) => ({
      id: String(r._id),
      enrollmentId: r.enrollmentId,
      course: r.course,
      chapters: r.chapters,
      attendance: r.attendance,
      lastChapter: r.lastChapter,
      updatedAt: r.updatedAt.toISOString(),
    })),
    upcomingClasses: liveClasses.map((c) => ({
      id: String(c._id),
      title: c.title,
      scheduledAt: c.scheduledAt,
      durationMinutes: c.durationMinutes,
      meetingLink: c.meetingLink,
      platform: c.platform,
      instructor: c.instructor,
      course: c.course,
      batch: c.batch,
    })),
    certificates: certificates.map((c) => ({
      id: String(c._id),
      certificateId: c.certificateId,
      studentName: c.studentName,
      course: c.course,
      batch: c.batch,
      issuedAt: c.issuedAt,
      completionPercent: c.completionPercent,
      signedBy: c.signedBy,
    })),
    assignments: assignments.map((a) => ({
      id: String(a._id),
      course: a.course,
      title: a.title,
      description: a.description,
      studentAnswer: a.studentAnswer,
      status: a.status,
      grade: a.grade,
      feedbackCount: a.feedbackThread.length,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    })),
  });
}