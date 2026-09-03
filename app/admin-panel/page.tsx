export const dynamic = "force-dynamic";

import { requireAdmin } from "@/lib/admin-guard";
import {
  ensureIndexesAndAdmin,
  getApplicationsCollection,
  getEnrollmentsCollection,
  getUsersCollection,
  getCoursesCollection,
  getNotificationsCollection,
  getPaymentsCollection,
} from "@/lib/db";
import { AdminGate } from "@/components/admin-panel/AdminGate";
import { AdminPanel } from "@/components/admin-panel/AdminPanel";
import type {
  AdminApplication,
  AdminCounts,
  AdminEnrollment,
  AdminUser,
} from "@/components/admin-panel/types";

export default async function AdminPanelPage() {
  const admin = await requireAdmin();
  if (!admin) {
    return <AdminGate />;
  }

  await ensureIndexesAndAdmin();

  const applications = await getApplicationsCollection();
  const enrollments = await getEnrollmentsCollection();

  // One $group pipeline per collection replaces 9 round-tripping countDocuments
  // calls — single pass groups all statuses at once.
  const [appDocs, enrDocs, appCounts, enrCounts] = await Promise.all([
    applications.find({}).sort({ createdAt: -1 }).limit(200).toArray(),
    enrollments.find({}).sort({ createdAt: -1 }).limit(200).toArray(),
    applications
      .aggregate<{ _id: string | null; n: number }>([{ $group: { _id: "$status", n: { $sum: 1 } } }])
      .toArray(),
    enrollments
      .aggregate<{ _id: string | null; n: number }>([{ $group: { _id: "$status", n: { $sum: 1 } } }])
      .toArray(),
  ]);

  // Pivot the grouped rows into fixed positional counts.
  const appByStatus = Object.fromEntries(
    appCounts.filter((r) => r._id).map((r) => [r._id as string, r.n])
  );
  const enrByStatus = Object.fromEntries(
    enrCounts.filter((r) => r._id).map((r) => [r._id as string, r.n])
  );
  const appStatusTotal = appCounts.reduce((s, r) => s + r.n, 0);

  const [usersCol, coursesCol, notificationsCol, paymentsCol] = await Promise.all([
    getUsersCollection(),
    getCoursesCollection(),
    getNotificationsCollection(),
    getPaymentsCollection(),
  ]);
  const [userCount, courseCount, notificationCount, paymentsTotal, userDocs] = await Promise.all([
    usersCol.countDocuments({ role: { $ne: "ADMIN" } }),
    coursesCol.countDocuments({ active: true }),
    notificationsCol.countDocuments({}),
    paymentsCol.countDocuments({}),
    usersCol
      .find({ role: { $ne: "ADMIN" } })
      .sort({ createdAt: -1 })
      .limit(300)
      .toArray(),
  ]);

  const counts: AdminCounts = {
    users: userCount,
    courses: courseCount,
    notifications: notificationCount,
    paymentsTotal,
    appsTotal: appStatusTotal,
    appsPending: appByStatus.PENDING ?? 0,
    appsApproved: appByStatus.APPROVED ?? 0,
    appsRejected: appByStatus.REJECTED ?? 0,
    enrsPending: enrByStatus.PENDING ?? 0,
    enrsAwaiting: enrByStatus.AWAITING_PAYMENT ?? 0,
    enrsProof: enrByStatus.PROOF_SUBMITTED ?? 0,
    enrsEnrolled: enrByStatus.ENROLLED ?? 0,
    enrsRejected: enrByStatus.REJECTED ?? 0,
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
    paymentMethod: d.paymentMethod,
    paymentInstructions: d.paymentInstructions,
    paymentProof: d.paymentProof,
    status: d.status,
    adminMessage: d.adminMessage,
    createdAt: d.createdAt.toISOString(),
  }));

  const userList: AdminUser[] = userDocs.map((d) => {
    const raw = d as unknown as {
      name: string;
      email: string;
      image?: string | null;
      emailVerified?: Date | null;
      role?: string;
      createdAt: Date;
    };
    return {
      id: String(d._id),
      name: raw.name,
      email: raw.email,
      image: raw.image ?? null,
      emailVerified: raw.emailVerified ? raw.emailVerified.toISOString() : null,
      role: raw.role ?? "USER",
      createdAt: new Date(raw.createdAt).toISOString(),
    };
  });

  return (
    <AdminPanel
      adminEmail={admin.email ?? ""}
      counts={counts}
      applications={applicationList}
      enrollments={enrollmentList}
      users={userList}
    />
  );
}