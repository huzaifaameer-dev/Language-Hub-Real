import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
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
import { DashboardWorkspace } from "@/components/dashboard/DashboardWorkspace";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard · Language Hub",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Falls back to the signed JWT when this Vercel instance's local PGlite does
  // not have the user row (created on another instance) — prevents the
  // /dashboard → /login → /dashboard redirect loop.
  const user = await currentUser();
  if (!user) redirect("/login");

  // The owner works from the control suite; learners use this workspace.
  if (user.role === "ADMIN") redirect("/admin-panel");

  const [enrollments, progress, classes, certificates, registrations, notifications, unread] =
    await Promise.all([
      listEnrollments(user.id),
      getProgressForUser(user.id),
      listUpcomingClasses(user.id),
      listCertificates(user.id),
      listRegistrationsForUser(user.id),
      listNotifications(user.id, 10),
      unreadNotificationCount(user.id),
    ]);

  const chaptersTotal = progress.reduce((n, p) => n + p.chapters.length, 0);
  const chaptersDone = progress.reduce(
    (n, p) => n + p.chapters.filter((c) => c.completed).length,
    0
  );

  return (
    <DashboardWorkspace
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone ?? "",
        image: user.image,
        referralCode: user.referral_code,
        createdAt: new Date(user.created_at).toISOString(),
      }}
      stats={{
        courses: enrollments.filter((e) => e.status === "ACTIVE").length,
        chaptersDone,
        chaptersTotal,
        percent: chaptersTotal ? Math.round((chaptersDone / chaptersTotal) * 100) : 0,
        certificates: certificates.length,
        unread,
      }}
      enrollments={enrollments.map((e) => ({
        id: e.id,
        course: e.course_name,
        courseSlug: e.course_slug,
        batch: e.batch,
        instructor: e.instructor,
        status: e.status,
        enrolledAt: new Date(e.enrolled_at).toISOString(),
        percent: progress.find((p) => p.courseSlug === e.course_slug)?.percent ?? 0,
      }))}
      progress={progress.map((p) => ({
        enrollmentId: p.enrollmentId,
        course: p.course,
        courseSlug: p.courseSlug,
        batch: p.batch,
        chapters: p.chapters.map((c) => ({
          id: c.id,
          title: c.title,
          completed: c.completed,
        })),
        attendance: p.attendance,
        percent: p.percent,
      }))}
      upcomingClasses={classes}
      certificates={certificates.map((c) => ({
        id: c.id,
        certificateId: c.certificate_id,
        course: c.course,
        batch: c.batch,
        issuedAt: new Date(c.issued_at).toISOString(),
        completionPercent: c.completion_percent,
      }))}
      registrations={registrations.map((r) => ({
        id: r.id,
        ref: r.ref,
        courseSlug: r.course_slug,
        status: r.status,
        createdAt: new Date(r.created_at).toISOString(),
      }))}
      notifications={notifications.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        kind: n.kind,
        link: n.link,
        read: Boolean(n.read),
        createdAt: new Date(n.created_at).toISOString(),
      }))}
    />
  );
}
