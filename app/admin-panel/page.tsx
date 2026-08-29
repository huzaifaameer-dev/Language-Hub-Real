export const dynamic = "force-dynamic";

import { requireAdmin } from "@/lib/admin-guard";
import {
  ensureIndexesAndAdmin,
  getApplicationsCollection,
  getEnrollmentsCollection,
} from "@/lib/db";
import { AdminGate } from "@/components/admin-panel/AdminGate";
import { AdminPanel } from "@/components/admin-panel/AdminPanel";
import type {
  AdminApplication,
  AdminEnrollment,
  AdminStats,
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

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let total = 0;
  let pending = 0;
  let approved = 0;
  let rejected = 0;
  let today = 0;
  let thisWeek = 0;
  let thisMonth = 0;

  for (const a of appDocs) {
    total += 1;
    const t = new Date(a.createdAt).getTime();
    if (t >= startOfDay.getTime()) today += 1;
    if (t >= startOfWeek.getTime()) thisWeek += 1;
    if (t >= startOfMonth.getTime()) thisMonth += 1;
    if (a.status === "PENDING") pending += 1;
    else if (a.status === "APPROVED") approved += 1;
    else rejected += 1;
  }

  let enrPending = 0;
  let enrEnrolled = 0;
  let enrRejected = 0;
  for (const e of enrDocs) {
    if (e.status === "PENDING") enrPending += 1;
    else if (e.status === "ENROLLED") enrEnrolled += 1;
    else enrRejected += 1;
  }

  const stats: AdminStats = {
    total,
    pending,
    approved,
    rejected,
    enrPending,
    enrEnrolled,
    enrRejected,
    today,
    thisWeek,
    thisMonth,
    approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
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
      stats={stats}
      applications={applicationList}
      enrollments={enrollmentList}
    />
  );
}