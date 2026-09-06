/** Pure helpers for learner-engagement automations (streaks / nudges). */

export interface EnrolledLike {
  userId: string;
  email: string;
  name: string;
  subjects?: string[];
  batch: string;
  updatedAt: Date;
}

export interface ProgressLike {
  userId: string;
  enrollmentId: string;
  updatedAt: Date;
  lastChapter?: string | null;
}

export const STALE_HOURS = 3 * 24; // 3 days in activity = stale
export const WEEK_MS = 7 * 24 * 3600 * 1000;

/** ISO week key (yyyy-Www) used to dedup weekly nudges with automation_sends. */
export function weekKey(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const firstDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDay + 3);
  const week = 1 + Math.round((d.getTime() - firstThursday.getTime()) / WEEK_MS);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Enrolled students with no progress update inside the stale window. */
export function staleLearners(
  enrolled: EnrolledLike[],
  progress: ProgressLike[],
  now: Date,
  staleHours = STALE_HOURS
): Array<{ student: EnrolledLike; progress?: ProgressLike }> {
  const cutoff = now.getTime() - staleHours * 3600 * 1000;
  const byUser = new Map(progress.map((p) => [p.userId, p]));
  return enrolled
    .filter((e) => {
      const p = byUser.get(e.userId);
      // No progress record at all = brand new, skip. A stale record = nudge.
      if (!p) return false;
      return p.updatedAt.getTime() < cutoff;
    })
    .map((e) => ({ student: e, progress: byUser.get(e.userId) }));
}

/** Short, deterministic nudge copy per learner. */
export function nudgeCopy(student: { name: string; subjects?: string[]; batch: string }): string {
  const course = student.subjects?.[0] ?? "your course";
  return `Hi ${student.name}, your ${course} journey stopped a few days ago. One small lesson today keeps your streak alive — open the dashboard and continue where you left off.`;
}

/** Deterministic weekly digest copy per learner. */
export function digestCopy(student: { name: string; subjects?: string[] }): string {
  const course = student.subjects?.[0] ?? "your course";
  return `Hi ${student.name} — your weekly check-in for ${course}. Missed a class? Catch the recap in your dashboard, attempt your weekly mock, and reply here if you need help.`;
}