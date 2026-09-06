/** Pure waitlist helpers for the seat-release automation. */

export interface WaitlistApp {
  _id?: unknown;
  userId: string;
  email: string;
  name: string;
  course: string;
  status: string;
  createdAt: Date;
  /** ISO timestamp set when this applicant was notified of a freed seat. */
  waitlistHoldUntil?: Date | null;
}

export interface VacantBatch {
  course: string;
  batch: string;
  /** Live seats still open for this batch right now. */
  seatsLeft: number;
}

const HOLD_MS = 24 * 3600 * 1000;

/** Apps holding a seat offer for this course that have not yet claimed it. */
export function onHoldApps(apps: WaitlistApp[], now: Date): WaitlistApp[] {
  return apps.filter(
    (a) => a.waitlistHoldUntil && a.waitlistHoldUntil.getTime() > now.getTime()
  );
}

/** Apps whose hold has expired and can be quietly cleared. */
export function expiredHolds(apps: WaitlistApp[], now: Date): WaitlistApp[] {
  return apps.filter(
    (a) => a.waitlistHoldUntil && a.waitlistHoldUntil.getTime() <= now.getTime()
  );
}

/** PENDING applicants for a course who have never been notified of a freed seat. */
export function freshWaitlistCandidates(apps: WaitlistApp[]): WaitlistApp[] {
  return apps.filter(
    (a) => a.status === "PENDING" && !a.waitlistHoldUntil
  );
}

/** The 24-hour hold deadline for a brand-new freed-seat offer. */
export function holdDeadline(now: Date): Date {
  return new Date(now.getTime() + HOLD_MS);
}

/**
 * Match pending waitlist applicants to batches that currently have open seats.
 * Yields one offer per applicant (ordered by oldest application first).
 */
export function offersFromVacancies(
  apps: WaitlistApp[],
  vacancies: VacantBatch[]
): Array<{ app: WaitlistApp; batch: VacantBatch }> {
  const newestFirst = [...apps].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const offers: Array<{ app: WaitlistApp; batch: VacantBatch }> = [];
  for (const app of newestFirst) {
    const match = vacancies.find(
      (v) => v.course === app.course && v.seatsLeft > 0
    );
    if (match) {
      offers.push({ app, batch: match });
      match.seatsLeft -= 1;
    }
  }
  return offers;
}