import { unstable_cache } from "next/cache";
import type { CourseBatch } from "@/lib/course-data";
import {
  ensureIndexesAndAdmin,
  getCoursesCollection,
  getEnrollmentsCollection,
} from "@/lib/db";
import type { CourseDoc } from "@/lib/db";

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

export interface PublicCatalogCourse {
  id: string;
  name: string;
  tagline: string;
  description: string;
  fee: number;
  currency: string;
  duration: string;
  teacher: string;
  schedule: string;
  batches: SeatView[];
  seatsTotal: number;
  seatsUsed: number;
  seatsLeft: number;
}

/** Read the active course catalog once per short window instead of per
 *  dashboard load; admin mutations revalidateTag("catalog") to keep the
 *  fetched seat counts fresh the moment a decision lands. */
export const getPublicCatalog = unstable_cache(
  async (): Promise<{ courses: PublicCatalogCourse[] }> => {
    await ensureIndexesAndAdmin();
    const [coursesCol, enrollmentsCol] = await Promise.all([
      getCoursesCollection(),
      getEnrollmentsCollection(),
    ]);

    const [courseDocs, enrolledDocs] = await Promise.all([
      coursesCol.find({ active: true }).sort({ order: 1 }).toArray(),
      enrollmentsCol.find({ status: "ENROLLED" }).project({ batch: 1 }).toArray(),
    ] as const);

    const used = batchUsageMap(enrolledDocs as { batch: string }[]);

    const courses: PublicCatalogCourse[] = courseDocs.map(
      (c: CourseDoc & { _id: unknown }) => {
        const batches = seatViews(c.batches ?? [], used);
        return {
          id: String(c._id),
          name: c.name,
          tagline: c.tagline,
          description: c.description,
          fee: c.fee,
          currency: c.currency,
          duration: c.duration,
          teacher: c.teacher,
          schedule: c.schedule,
          batches,
          ...courseSeatSummary(batches),
        };
      }
    );

    return { courses };
  },
  ["public-catalog"],
  { revalidate: 15, tags: ["catalog"] }
);