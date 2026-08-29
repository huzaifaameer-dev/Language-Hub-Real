import type { CourseBatch } from "@/lib/course-data";

/** Count ENROLLED enrollment docs per batch name. */
export function batchUsageMap(enrolled: Array<{ batch: string }>): Map<string, number> {
  const m = new Map<string, number>();
  for (const e of enrolled) {
    m.set(e.batch, (m.get(e.batch) ?? 0) + 1);
  }
  return m;
}

export interface SeatView {
  name: string;
  time: string;
  seatsTotal: number;
  seatsUsed: number;
  seatsLeft: number;
  full: boolean;
}

export function seatViews(batches: CourseBatch[], used: Map<string, number>): SeatView[] {
  return batches.map((b) => {
    const seatsUsed = used.get(b.name) ?? 0;
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

export interface CourseSeatSummary {
  seatsTotal: number;
  seatsUsed: number;
  seatsLeft: number;
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