import { NextResponse } from "next/server";

import { currentUser } from "@/lib/server/session";
import {
  getProgressForUser,
  listCertificates,
  listEnrollments,
  listNotifications,
  listRegistrationsForUser,
  listUpcomingClasses,
  unreadNotificationCount,
} from "@/lib/server/learner";

export const dynamic = "force-dynamic";

/**
 * Single round-trip payload for the learner dashboard: profile, enrolments,
 * chapter progress, upcoming live classes, certificates, registrations and
 * notifications. The UI renders from one fetch (no request waterfall).
 */
export async function GET() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  const [enrollments, progress, classes, certificates, registrations, notifications, unread] =
    await Promise.all([
      listEnrollments(user.id),
      getProgressForUser(user.id),
      listUpcomingClasses(user.id),
      listCertificates(user.id),
      listRegistrationsForUser(user.id),
      listNotifications(user.id, 12),
      unreadNotificationCount(user.id),
    ]);

  const chaptersTotal = progress.reduce((n, p) => n + p.chapters.length, 0);
  const chaptersDone = progress.reduce(
    (n, p) => n + p.chapters.filter((c) => c.completed).length,
    0
  );

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
      role: user.role,
      image: user.image,
      referralCode: user.referral_code,
      createdAt: new Date(user.created_at).toISOString(),
    },
    stats: {
      courses: enrollments.filter((e) => e.status === "ACTIVE").length,
      chaptersDone,
      chaptersTotal,
      percent: chaptersTotal ? Math.round((chaptersDone / chaptersTotal) * 100) : 0,
      certificates: certificates.length,
      unread,
    },
    enrollments: enrollments.map((e) => ({
      id: e.id,
      course: e.course_name,
      courseSlug: e.course_slug,
      batch: e.batch,
      instructor: e.instructor,
      status: e.status,
      enrolledAt: new Date(e.enrolled_at).toISOString(),
      percent: progress.find((p) => p.courseSlug === e.course_slug)?.percent ?? 0,
    })),
    progress,
    upcomingClasses: classes,
    certificates: certificates.map((c) => ({
      id: c.id,
      certificateId: c.certificate_id,
      studentName: c.student_name,
      course: c.course,
      batch: c.batch,
      issuedAt: new Date(c.issued_at).toISOString(),
      completionPercent: c.completion_percent,
      signedBy: c.signed_by,
    })),
    registrations: registrations.map((r) => ({
      id: r.id,
      ref: r.ref,
      courseKey: r.course_key,
      courseSlug: r.course_slug,
      fullName: r.full_name,
      phone: r.phone,
      status: r.status,
      createdAt: new Date(r.created_at).toISOString(),
    })),
    notifications: notifications.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      kind: n.kind,
      link: n.link,
      read: Boolean(n.read),
      createdAt: new Date(n.created_at).toISOString(),
    })),
  });
}
