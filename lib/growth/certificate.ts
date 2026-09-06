/** Pure certificate helpers shared by the dashboard route, the automation
 * engine and the public share page. */

export interface ProgressLike {
  chapters?: Array<{ completed: boolean }>;
}

/** Fraction of chapters completed (0 if none / empty). */
export function completionPercent(progress: ProgressLike | null | undefined): number {
  if (!progress || !progress.chapters || progress.chapters.length === 0) return 0;
  const done = progress.chapters.filter((c) => c.completed).length;
  return Math.round((done / progress.chapters.length) * 100);
}

/** Certificate threshold (>= 80% completion). */
export function shouldIssueCertificate(percent: number): boolean {
  return percent >= 80;
}

/** Compact, unique, human-readable certificate id like LH-K7F2X-A9B1. */
export function makeCertificateId(): string {
  const t = Date.now().toString(36).toUpperCase().slice(-5);
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LH-${t}-${r}`;
}

/** ISO date (yyyy-mm-dd) used as the visible issue date. */
export function issueDate(): string {
  return new Date().toISOString().split("T")[0];
}