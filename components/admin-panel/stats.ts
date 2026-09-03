import type {
  AdminApplication,
  AdminCounts,
  AdminEnrollment,
  AdminStats,
} from "./types";

/** Derive the ops dashboard stats. Lifetime cardinalities come from the
 *  full-table server counts (the 200-row lists would undercount past 200
 *  records); trailing-window buckets (today / thisWeek / thisMonth) come from
 *  the lists, which are sorted newest-first. Everything except those buckets
 *  is reachable without double-computing on the server refresh path. */
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

  let today = 0;
  let thisWeek = 0;
  let thisMonth = 0;

  for (const a of applications) {
    const t = new Date(a.createdAt).getTime();
    if (t >= day) today += 1;
    if (t >= week) thisWeek += 1;
    if (t >= month) thisMonth += 1;
  }

  return {
    total: counts.appsTotal,
    pending: counts.appsPending,
    approved: counts.appsApproved,
    rejected: counts.appsRejected,
    enrPending: counts.enrsPending + counts.enrsAwaiting + counts.enrsProof,
    enrEnrolled: counts.enrsEnrolled,
    enrRejected: counts.enrsRejected,
    paymentsTotal: counts.paymentsTotal ?? 0,
    today,
    thisWeek,
    thisMonth,
    users: counts.users,
    courses: counts.courses,
    notifications: counts.notifications,
    approvalRate: counts.appsTotal > 0 ? Math.round((counts.appsApproved / counts.appsTotal) * 100) : 0,
  };
}