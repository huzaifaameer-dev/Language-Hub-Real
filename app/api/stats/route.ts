import { NextResponse } from "next/server";

import { one, q } from "@/lib/server/pg";
import { getSiteStats } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

/**
 * Public academy figures for the homepage "in numbers" panel and the live
 * seat counters. Everything is a real COUNT/aggregate over the self-hosted
 * PostgreSQL database — nothing is inflated. The learner figure uses the
 * academy's configured baseline (Admin → Settings → Public figures) as a
 * floor, so the panel and the hero badge never disagree.
 */
export async function GET() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [site, users, enrolled, enrolledThisWeek, activeCourses, batchRows, seats] =
    await Promise.all([
      getSiteStats().catch(() => null),
      one<{ n: number }>(
        "SELECT COUNT(*)::INT AS n FROM users WHERE role <> 'ADMIN'"
      ),
      one<{ n: number }>("SELECT COUNT(*)::INT AS n FROM enrollments"),
      one<{ n: number }>(
        "SELECT COUNT(*)::INT AS n FROM enrollments WHERE created_at >= $1",
        [weekAgo]
      ),
      one<{ n: number }>(
        "SELECT COUNT(*)::INT AS n FROM courses WHERE active = TRUE"
      ),
      q<{ name: string }>(
        `SELECT DISTINCT b->>'name' AS name
           FROM courses c, jsonb_array_elements(c.batches) AS b
          WHERE c.active = TRUE AND COALESCE(b->>'name', '') <> ''`
      ),
      one<{ n: number }>(
        `SELECT COALESCE(SUM((b->>'seatsTotal')::INT), 0)::INT AS n
           FROM courses c, jsonb_array_elements(c.batches) AS b
          WHERE c.active = TRUE`
      ),
    ]);

  return NextResponse.json(
    {
      students: Math.max(users?.n ?? 0, site?.students ?? 0),
      programmes: activeCourses?.n ?? 0,
      dailyBatches: batchRows.length,
      enrolledThisWeek: enrolledThisWeek?.n ?? 0,
      totalSeats: seats?.n ?? 0,
      enrolled: enrolled?.n ?? 0,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=60",
      },
    }
  );
}

