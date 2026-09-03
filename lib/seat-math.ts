import type { CourseBatch } from "@/lib/course-data";

export type { CourseBatch };

export interface EnrolledLike {
  batch: string;
  subjects?: string[];
}

export interface SeatView {
  name: string;
  time: string;
  seatsTotal: number;
  seatsUsed: number;
  seatsLeft: number;
  full: boolean;
}

export interface CourseSeatSummary {
  seatsTotal: number;
  seatsUsed: number;
  seatsLeft: number;
}

export type SeatGateResult =
  | { ok: true }
  | { ok: false; message: string; code: "BATCH_UNKNOWN" | "BATCH_FULL" };

/**
 * Seat usage scoped to (courseName, batchName): an ENROLLED record counts
 * against every subject it selects, so identically-named batches on different
 * courses never contaminate each other's capacity. Legacy records without a
 * subjects array are bucketed under "*" and count toward every course that
 * hosts a batch of that name.
 */
export function batchUsageFor(
  enrolled: EnrolledLike[]
): Map<string, Map<string, number>> {
  const m = new Map<string, Map<string, number>>();
  for (const e of enrolled) {
    const subjects = e.subjects && e.subjects.length > 0 ? e.subjects : ["*"];
    for (const subject of subjects) {
      let byBatch = m.get(subject);
      if (!byBatch) {
        byBatch = new Map<string, number>();
        m.set(subject, byBatch);
      }
      byBatch.set(e.batch, (byBatch.get(e.batch) ?? 0) + 1);
    }
  }
  return m;
}

/** Seats used for one course's batch, including legacy wildcard records. */
export function seatsUsedFor(
  used: Map<string, Map<string, number>>,
  course: string,
  batch: string
): number {
  return (used.get(course)?.get(batch) ?? 0) + (used.get("*")?.get(batch) ?? 0);
}

export function seatViews(
  batches: CourseBatch[],
  used: Map<string, Map<string, number>>,
  courseName: string
): SeatView[] {
  return batches.map((b) => {
    const seatsUsed = seatsUsedFor(used, courseName, b.name);
    return {
      name: b.name,
      time: b.time,
      seatsTotal: b.seatsTotal,
      seatsUsed,
      seatsLeft: Math.max(0, b.seatsTotal - seatsUsed),
      full: seatsUsed >= b.seatsTotal,
    };
  });
}

export function courseSeatSummary(views: SeatView[]): CourseSeatSummary {
  const seatsTotal = views.reduce((s, v) => s + v.seatsTotal, 0);
  const seatsUsed = views.reduce((s, v) => s + v.seatsUsed, 0);
  return {
    seatsTotal,
    seatsUsed,
    seatsLeft: Math.max(0, seatsTotal - seatsUsed),
  };
}