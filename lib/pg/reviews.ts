import { createHash } from "node:crypto";
import { getPg } from "@/lib/pg/client";

export interface Review {
  id: string;
  slug: string;
  name: string;
  role: string;
  course: string;
  headline: string;
  body: string;
  rating: number;
  outcome: string;
  avatar: string | null;
  batch: string;
  verified: boolean;
  featured: boolean;
  helpful: number;
  createdAt: string;
}

export interface ReviewStats {
  total: number;
  average: number;
  fiveStar: number;
  fourStar: number;
  lowStar: number;
  verified: number;
  recommendPercent: number;
}

interface ReviewDbRow {
  id: string;
  slug: string;
  student_name: string;
  role: string;
  course: string;
  headline: string;
  body: string;
  rating: number;
  outcome: string;
  avatar_url: string | null;
  batch: string;
  verified: boolean;
  featured: boolean;
  helpful_count: number;
  created_at: Date | string;
}

function toReview(row: ReviewDbRow): Review {
  return {
    id: String(row.id),
    slug: row.slug,
    name: row.student_name,
    role: row.role,
    course: row.course,
    headline: row.headline,
    body: row.body,
    rating: Number(row.rating),
    outcome: row.outcome,
    avatar: row.avatar_url,
    batch: row.batch,
    verified: Boolean(row.verified),
    featured: Boolean(row.featured),
    helpful: Number(row.helpful_count),
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  };
}

/** Published reviews, featured first. `limit` caps the payload for the API. */
export async function listReviews(limit = 48): Promise<Review[]> {
  const db = await getPg();
  const { rows } = await db.query<ReviewDbRow>(
    `SELECT id, slug, student_name, role, course, headline, body, rating,
            outcome, avatar_url, batch, verified, featured, helpful_count, created_at
       FROM reviews
      WHERE published = TRUE
      ORDER BY featured DESC, sort_order ASC, created_at DESC
      LIMIT $1`,
    [Math.max(1, Math.min(limit, 200))]
  );
  return rows.map(toReview);
}

export async function getReviewStats(): Promise<ReviewStats> {
  const db = await getPg();
  const { rows } = await db.query<{
    total: number;
    average: number;
    five_star: number;
    four_star: number;
    low_star: number;
    verified: number;
  }>("SELECT * FROM review_stats");

  const row = rows[0];
  const total = row?.total ?? 0;
  const five = row?.five_star ?? 0;
  const four = row?.four_star ?? 0;
  const low = row?.low_star ?? 0;
  const recommendPercent =
    total > 0 ? Math.round(((five + four) / total) * 100) : 0;

  return {
    total,
    average: Number(row?.average ?? 0),
    fiveStar: five,
    fourStar: four,
    lowStar: low,
    verified: row?.verified ?? 0,
    recommendPercent,
  };
}

/** Full-text search across published reviews (PostgreSQL GIN index). */
export async function searchReviews(term: string, limit = 24): Promise<Review[]> {
  const query = term.trim();
  if (!query) return listReviews(limit);
  const db = await getPg();
  const { rows } = await db.query<ReviewDbRow>(
    `SELECT id, slug, student_name, role, course, headline, body, rating,
            outcome, avatar_url, batch, verified, featured, helpful_count, created_at
       FROM reviews
      WHERE published = TRUE
        AND search_vector @@ websearch_to_tsquery('english', $1)
      ORDER BY ts_rank(search_vector, websearch_to_tsquery('english', $1)) DESC,
               helpful_count DESC
      LIMIT $2`,
    [query, Math.max(1, Math.min(limit, 100))]
  );
  return rows.map(toReview);
}

/** Stable, non-reversible visitor key (no raw IP or cookie persisted). */
export function visitorHash(seed: string): string {
  // Never fall back to a repo-known constant: with a public salt anyone could
  // recompute a visitor's fingerprint and stuff the ballot. Reuse the app
  // secret when the dedicated salt is not configured.
  const salt =
    process.env.LANGUAGE_HUB_HASH_SALT ??
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "language-hub-reviews";
  return createHash("sha256").update(`${salt}:${seed}`).digest("hex");
}

/**
 * Record a "helpful" vote. The composite primary key makes this idempotent —
 * a repeat vote returns the current count instead of double-counting.
 */
export async function markHelpful(slug: string, seed: string): Promise<number | null> {
  const db = await getPg();
  const found = await db.query<{ id: string; helpful_count: number }>(
    "SELECT id, helpful_count FROM reviews WHERE slug = $1 AND published = TRUE",
    [slug]
  );
  const review = found.rows[0];
  if (!review) return null;

  await db.query(
    `INSERT INTO review_helpful (review_id, visitor_hash)
     VALUES ($1, $2)
     ON CONFLICT (review_id, visitor_hash) DO NOTHING`,
    [review.id, visitorHash(seed)]
  );

  const after = await db.query<{ helpful_count: number }>(
    "SELECT helpful_count FROM reviews WHERE id = $1",
    [review.id]
  );
  return after.rows[0]?.helpful_count ?? review.helpful_count;
}

/** Course-level breakdown for the rating panel. */
export async function reviewsByCourse(): Promise<
  Array<{ course: string; count: number; average: number }>
> {
  const db = await getPg();
  const { rows } = await db.query<{ course: string; count: number; average: number }>(
    `SELECT course, COUNT(*)::INT AS count, ROUND(AVG(rating)::NUMERIC, 2)::FLOAT8 AS average
       FROM reviews
      WHERE published = TRUE
      GROUP BY course
      ORDER BY count DESC, course ASC`
  );
  return rows;
}
