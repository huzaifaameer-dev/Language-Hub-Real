import { NextResponse } from "next/server";
import {
  ensureIndexesAndAdmin,
  getCoursesCollection,
  getEnrollmentsCollection,
} from "@/lib/db";
import {
  batchUsageMap,
  courseSeatSummary,
  seatViews,
} from "@/lib/course-stats";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureIndexesAndAdmin();

  const [coursesCol, enrollmentsCol] = await Promise.all([
    getCoursesCollection(),
    getEnrollmentsCollection(),
  ]);

  const [courseDocs, enrolledDocs] = await Promise.all([
    coursesCol.find({ active: true }).sort({ order: 1 }).toArray(),
    enrollmentsCol
      .find({ status: "ENROLLED" })
      .project({ batch: 1 })
      .toArray(),
  ]);

  const used = batchUsageMap(enrolledDocs as { batch: string }[]);

  const payload = courseDocs.map((c) => {
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
  });

  return NextResponse.json(
    { courses: payload },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}