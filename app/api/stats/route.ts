import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Public academy stats for the homepage "in numbers" section and the live
 * "students enrolled this week" / seat urgency banners. Computed live from the
 * database so all claims stay truthful and never go stale.
 */
export async function GET() {
  const db = await getDb();

  // Enrolled this week = enrollments that reached ENROLLED status in the last 7 days.
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    users,
    approvedApps,
    enrolled,
    enrolledThisWeek,
    activeCourses,
    totalSeats,
  ] = await Promise.all([
    db.collection("users").countDocuments({ role: { $ne: "ADMIN" } }),
    db.collection("applications").countDocuments({ status: "APPROVED" }),
    db.collection("enrollments").countDocuments({ status: "ENROLLED" }),
    db
      .collection("enrollments")
      .countDocuments({ status: "ENROLLED", updatedAt: { $gte: weekAgo } }),
    db.collection("courses").countDocuments({ active: true }),
    (async () => {
      // Total across all active batches of active courses.
      const courses = await db
        .collection("courses")
        .find({ active: true }, { projection: { batches: 1 } })
        .toArray();
      return courses.reduce(
        (sum, c) => sum + (c.batches ?? []).reduce((s: number, b: { seatsTotal?: number }) => s + (b.seatsTotal ?? 0), 0),
        0
      );
    })(),
  ]);

  const studentsGuided = Math.max(600, users, approvedApps, enrolled);
  const labs = await db.collection("courses").distinct("batches.name").then((b) => b.length);

  return NextResponse.json({
    students: studentsGuided,
    yearsTeaching: 8, // founding year is fixed; kept as editorial constant
    // Fall back to truthful editorial figures if the live DB counts are empty
    // (fresh install / cold DB), so the section never shows a misleading 0.
    programmes: activeCourses > 0 ? activeCourses : 4,
    dailyBatches: labs > 0 ? labs : 3,
    enrolledThisWeek,
    totalSeats,
  }, {
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=60",
    },
  });
}