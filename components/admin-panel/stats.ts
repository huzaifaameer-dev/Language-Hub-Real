import type {
  AdminApplication,
  AdminCounts,
  AdminEnrollment,
  AdminStats,
} from "./types";

/** Derive the ops dashboard stats from the in-memory lists. The heavy server
 *  computation was the source of double work (page SSR + `/api/admin/stats`).
 *  Everything except users/courses/notifications is reachable from the lists. */
export function deriveAdminStats(
  applications: AdminApplication[],
  enrollments: AdminEnrollment[],
  counts: AdminCounts
): AdminStats {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const day = startOfDay.getTime();
  const week = startOfWeek.getTime();
  const month = startOfMonth.getTime();

  let total = 0;
  let pending = 0;
  let approved = 0;
  let rejected = 0;
  let today = 0;
  let thisWeek = 0;
  let thisMonth = 0;

  for (const a of applications) {
    total += 1;
    const t = new Date(a.createdAt).getTime();
    if (t >= day) today += 1;
    if (t >= week) thisWeek += 1;
    if (t >= month) thisMonth += 1;
    if (a.status === "PENDING") pending += 1;
    else if (a.status === "APPROVED") approved += 1;
    else rejected += 1;
  }

  let enrPending = 0;
  let enrEnrolled = 0;
  let enrRejected = 0;
  for (const e of enrollments) {
    if (e.status === "PENDING") enrPending += 1;
    else if (e.status === "ENROLLED") enrEnrolled += 1;
    else enrRejected += 1;
  }

  return {
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
    users: counts.users,
    courses: counts.courses,
    notifications: counts.notifications,
    approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
  };
}