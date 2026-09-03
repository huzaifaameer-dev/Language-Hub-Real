import { unstable_cache } from "next/cache";
import {
  ensureIndexesAndAdmin,
  getCoursesCollection,
  getEnrollmentsCollection,
} from "@/lib/db";
import type { CourseDoc } from "@/lib/db";
import {
  batchUsageFor,
  courseSeatSummary,
  seatsUsedFor,
  seatViews,
  type CourseBatch,
  type CourseSeatSummary,
  type EnrolledLike,
  type SeatGateResult,
  type SeatView,
} from "@/lib/seat-math";

export type {
  CourseBatch,
  CourseSeatSummary,
  EnrolledLike,
  SeatGateResult,
  SeatView,
};
export { batchUsageFor, courseSeatSummary, seatsUsedFor, seatViews };

/**
 * One authoritative seat gate for both enrollment requests and admin seat
 * confirmations. Verifies every selected subject is an active catalog course
 * that hosts the requested batch, then rejects the approval that would push
 * any of those batches past its capacity.
 */
export async function checkSeatAvailability(
  subjects: string[],
  batch: string
): Promise<SeatGateResult> {
  await ensureIndexesAndAdmin();
  const [coursesCol, enrollmentsCol] = await Promise.all([
    getCoursesCollection(),
    getEnrollmentsCollection(),
  ]);

  const [courseDocs, enrolledDocs] = await Promise.all([
    coursesCol.find({ active: true, name: { $in: subjects } }).toArray(),
    enrollmentsCol.find({ status: "ENROLLED" }).project({ batch: 1, subjects: 1 }).toArray(),
  ] as const);

  for (const subject of subjects) {
    const course = courseDocs.find((c) => c.name === subject);
    if (!course) {
      return {
        ok: false,
        code: "BATCH_UNKNOWN",
        message: `${subject} is not an active course right now.`,
      };
    }
    if (!(course.batches ?? []).some((b) => b.name === batch)) {
      return {
        ok: false,
        code: "BATCH_UNKNOWN",
        message: `${batch} is not a batch of ${course.name}.`,
      };
    }
  }

  const used = batchUsageFor(enrolledDocs as EnrolledLike[]);
  const full: string[] = [];
  for (const c of courseDocs) {
    const b = (c.batches ?? []).find((x) => x.name === batch);
    if (b && seatsUsedFor(used, c.name, batch) >= b.seatsTotal) {
      full.push(`${c.name} · ${b.name}`);
    }
  }
  if (full.length > 0) {
    return {
      ok: false,
      code: "BATCH_FULL",
      message: `That batch is full. Try another batch: ${full.join(", ")}`,
    };
  }
  return { ok: true };
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
      enrollmentsCol.find({ status: "ENROLLED" }).project({ batch: 1, subjects: 1 }).toArray(),
    ] as const);

    const used = batchUsageFor(enrolledDocs as EnrolledLike[]);

    const courses: PublicCatalogCourse[] = courseDocs.map(
      (c: CourseDoc & { _id: unknown }) => {
        const batches = seatViews(c.batches ?? [], used, c.name);
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