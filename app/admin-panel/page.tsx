export const dynamic = "force-dynamic";

import { requireAdmin } from "@/lib/admin-guard";
import {
  ensureIndexesAndAdmin,
  getApplicationsCollection,
  getEnrollmentsCollection,
  getUsersCollection,
  getCoursesCollection,
  getNotificationsCollection,
} from "@/lib/db";
import { AdminGate } from "@/components/admin-panel/AdminGate";
import { AdminPanel } from "@/components/admin-panel/AdminPanel";
import type {
  AdminApplication,
  AdminCounts,
  AdminEnrollment,
} from "@/components/admin-panel/types";

export default async function AdminPanelPage() {
  const admin = await requireAdmin();
  if (!admin) {
    return <AdminGate />;
  }

  await ensureIndexesAndAdmin();

  const applications = await getApplicationsCollection();
  const enrollments = await getEnrollmentsCollection();

  const [appDocs, enrDocs] = await Promise.all([
    applications.find({}).sort({ createdAt: -1 }).limit(200).toArray(),
    enrollments.find({}).sort({ createdAt: -1 }).limit(200).toArray(),
  ]);

  const [usersCol, coursesCol, notificationsCol] = await Promise.all([
    getUsersCollection(),
    getCoursesCollection(),
    getNotificationsCollection(),
  ]);
  const [userCount, courseCount, notificationCount] = await Promise.all([
    usersCol.countDocuments({ role: { $ne: "ADMIN" } }),
    coursesCol.countDocuments({ active: true }),
    notificationsCol.countDocuments({}),
  ]);

  const counts: AdminCounts = {
    users: userCount,
    courses: courseCount,
    notifications: notificationCount,
  };

  const applicationList: AdminApplication[] = appDocs.map((d) => ({
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

  const enrollmentList: AdminEnrollment[] = enrDocs.map((d) => ({
    id: String(d._id),
    name: d.name,
    email: d.email,
    subjects: d.subjects,
    batch: d.batch,
    plan: d.plan,
    status: d.status,
    adminMessage: d.adminMessage,
    createdAt: d.createdAt.toISOString(),
  }));

  return (
    <AdminPanel
      adminEmail={admin.email ?? ""}
      counts={counts}
      applications={applicationList}
      enrollments={enrollmentList}
    />
  );
}