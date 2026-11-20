import { NextResponse } from "next/server";
import { listReviews, getReviewStats, reviewsByCourse } from "@/lib/pg/reviews";

/** Node runtime: the embedded PostgreSQL engine needs the filesystem. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? 48);

  try {
    const [reviews, stats, byCourse] = await Promise.all([
      listReviews(Number.isFinite(limit) ? limit : 48),
      getReviewStats(),
      reviewsByCourse(),
    ]);

    return NextResponse.json(
      { reviews, stats, byCourse, source: "postgresql" },
      {
        headers: {
          "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        reviews: [],
        stats: null,
        byCourse: [],
        error: error instanceof Error ? error.message : "review engine unavailable",
      },
      { status: 503 }
    );
  }
}
