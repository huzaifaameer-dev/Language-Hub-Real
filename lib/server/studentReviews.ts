/**
 * Student-submitted reviews (`/student-reviews`).
 *
 * A submission is private until an admin publishes it. Publishing writes the
 * review into both public pools in one transaction:
 *
 *   • `reviews`      → the homepage review wall and /success-stories stats
 *   • `testimonials` → the /success-stories grid + live enrolment banner
 *
 * The original submission (with the full-size photo) stays in `student_reviews`
 * so nothing is ever lost, and the public rows point at
 * `/api/student-reviews/<id>/photo` instead of duplicating the image.
 */

import { getPg } from "@/lib/pg/client";
import { newId } from "./id";
import { one, q, tx, type TxClient } from "./pg";

export type StudentReviewStatus = "NEW" | "PUBLISHED" | "ARCHIVED";

export interface StudentReviewRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  course: string;
  batch: string;
  teacher: string;
  headline: string;
  body: string;
  outcome: string;
  rating: number;
  photo: string | null;
  consent: boolean;
  status: StudentReviewStatus;
  published_slug: string | null;
  testimonial_id: string | null;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface StudentReview {
  id: string;
  name: string;
  email: string;
  phone: string;
  course: string;
  batch: string;
  teacher: string;
  headline: string;
  body: string;
  outcome: string;
  rating: number;
  photoUrl: string | null;
  consent: boolean;
  status: StudentReviewStatus;
  publishedSlug: string | null;
  testimonialId: string | null;
  createdAt: string;
  updatedAt: string;
}

const iso = (value: string | Date) => new Date(value).toISOString();

function toReview(row: StudentReviewRow): StudentReview {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    course: row.course,
    batch: row.batch,
    teacher: row.teacher,
    headline: row.headline,
    body: row.body,
    outcome: row.outcome,
    rating: Number(row.rating),
    photoUrl: row.photo ? `/api/student-reviews/${row.id}/photo` : null,
    consent: Boolean(row.consent),
    status: row.status,
    publishedSlug: row.published_slug,
    testimonialId: row.testimonial_id,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

const SORTS: Record<string, string> = {
  ALL: "created_at DESC",
  NEW: "created_at DESC",
  PUBLISHED: "updated_at DESC",
  ARCHIVED: "created_at DESC",
};

export async function listStudentReviews(options: {
  status?: StudentReviewStatus | "ALL";
  page?: number;
  perPage?: number;
} = {}): Promise<{
  reviews: StudentReview[];
  total: number;
  page: number;
  pages: number;
}> {
  const status = options.status && options.status !== "ALL" ? options.status : null;
  const perPage = Math.max(1, Math.min(50, options.perPage ?? 12));
  const page = Math.max(1, options.page ?? 1);
  const offset = (page - 1) * perPage;

  const rows = await q<StudentReviewRow>(
    `SELECT * FROM student_reviews
      ${status ? "WHERE status = $1" : ""}
      ORDER BY ${SORTS[status ?? "ALL"]}
      LIMIT $${status ? 2 : 1} OFFSET $${status ? 3 : 2}`,
    status ? [status, perPage, offset] : [perPage, offset]
  );

  const totalRow = await one<{ n: number }>(
    status
      ? "SELECT COUNT(*)::INT AS n FROM student_reviews WHERE status = $1"
      : "SELECT COUNT(*)::INT AS n FROM student_reviews",
    status ? [status] : []
  );
  const total = Number(totalRow?.n ?? 0);

  return {
    reviews: rows.map(toReview),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function studentReviewCounts(): Promise<Record<"ALL" | StudentReviewStatus, number>> {
  const rows = await q<{ status: StudentReviewStatus; n: number }>(
    "SELECT status, COUNT(*)::INT AS n FROM student_reviews GROUP BY status"
  );
  const counts: Record<"ALL" | StudentReviewStatus, number> = {
    ALL: 0,
    NEW: 0,
    PUBLISHED: 0,
    ARCHIVED: 0,
  };
  for (const row of rows) {
    counts[row.status] = Number(row.n);
    counts.ALL += Number(row.n);
  }
  return counts;
}

export async function getStudentReview(id: string): Promise<StudentReview | null> {
  const row = await one<StudentReviewRow>("SELECT * FROM student_reviews WHERE id = $1", [id]);
  return row ? toReview(row) : null;
}

export async function createStudentReview(input: {
  name: string;
  email?: string | null;
  phone?: string | null;
  course: string;
  batch?: string | null;
  teacher?: string | null;
  headline: string;
  body: string;
  outcome?: string | null;
  rating: number;
  photo: string;
}): Promise<string> {
  const id = newId();
  await q(
    `INSERT INTO student_reviews
       (id, name, email, phone, course, batch, teacher, headline, body, outcome,
        rating, photo, consent, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,TRUE,'NEW')`,
    [
      id,
      input.name,
      input.email ?? "",
      input.phone ?? "",
      input.course,
      input.batch ?? "",
      input.teacher ?? "",
      input.headline,
      input.body,
      input.outcome ?? "",
      input.rating,
      input.photo,
    ]
  );
  return id;
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function uniqueSlug(client: TxClient, row: StudentReviewRow): Promise<string> {
  const base = `${slugify(row.name) || "student"}-${slugify(row.course).slice(0, 24) || "review"}`;
  let slug = base;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const found = await client.query<{ ok: number }>(
      "SELECT 1::INT AS ok FROM reviews WHERE slug = $1 LIMIT 1",
      [slug]
    );
    if (found.rows.length === 0) return slug;
    slug = `${base}-${attempt + 2}`;
  }
  return `${base}-${row.id.slice(0, 8)}`;
}

export interface PublishResult {
  slug: string;
  testimonialId: string;
}

/**
 * Publish a submitted review to the public website. Idempotent: publishing an
 * already-published review returns the existing public ids untouched.
 */
export async function publishStudentReview(id: string): Promise<PublishResult> {
  // The public review engine owns the `reviews` table — make sure it is booted
  // before this transaction writes to it (cold serverless instances).
  await getPg();

  return tx(async (client) => {
    const { rows } = await client.query<StudentReviewRow>(
      "SELECT * FROM student_reviews WHERE id = $1 FOR UPDATE",
      [id]
    );
    const row = rows[0];
    if (!row) throw new Error("Review not found.");

    if (row.status === "PUBLISHED" && row.published_slug && row.testimonial_id) {
      return { slug: row.published_slug, testimonialId: row.testimonial_id };
    }

    const photoUrl = row.photo ? `/api/student-reviews/${row.id}/photo` : null;
    const slug = row.published_slug ?? (await uniqueSlug(client, row));

    await client.query(
      `INSERT INTO reviews
         (slug, student_name, role, course, headline, body, rating, outcome,
          avatar_url, batch, verified, featured, published, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE,FALSE,TRUE,0)
       ON CONFLICT (slug) DO UPDATE SET
         student_name = EXCLUDED.student_name,
         course       = EXCLUDED.course,
         headline     = EXCLUDED.headline,
         body         = EXCLUDED.body,
         rating       = EXCLUDED.rating,
         outcome      = EXCLUDED.outcome,
         avatar_url   = EXCLUDED.avatar_url,
         batch        = EXCLUDED.batch,
         published    = TRUE,
         updated_at   = NOW()`,
      [
        slug,
        row.name,
        row.batch || row.teacher || "Language Hub student",
        row.course,
        row.headline,
        row.body,
        Number(row.rating),
        row.outcome,
        photoUrl,
        row.batch,
      ]
    );

    const testimonialId = row.testimonial_id ?? newId();
    await client.query(
      `INSERT INTO testimonials
         (id, name, role, course, quote, outcome, rating, image, featured, active, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,FALSE,TRUE,0)
       ON CONFLICT (id) DO UPDATE SET
         name       = EXCLUDED.name,
         role       = EXCLUDED.role,
         course     = EXCLUDED.course,
         quote      = EXCLUDED.quote,
         outcome    = EXCLUDED.outcome,
         rating     = EXCLUDED.rating,
         image      = EXCLUDED.image,
         active     = TRUE,
         updated_at = NOW()`,
      [
        testimonialId,
        row.name,
        row.batch || "Language Hub student",
        row.course,
        row.body,
        row.outcome,
        Number(row.rating),
        photoUrl,
      ]
    );

    await client.query(
      `UPDATE student_reviews
          SET status = 'PUBLISHED',
              published_slug = $1,
              testimonial_id = $2,
              updated_at = NOW()
        WHERE id = $3`,
      [slug, testimonialId, id]
    );

    return { slug, testimonialId };
  });
}

/** Remove a published review from the public website (keeps the submission). */
export async function unpublishStudentReview(id: string): Promise<void> {
  await getPg();

  await tx(async (client) => {
    const { rows } = await client.query<StudentReviewRow>(
      "SELECT * FROM student_reviews WHERE id = $1 FOR UPDATE",
      [id]
    );
    const row = rows[0];
    if (!row) throw new Error("Review not found.");

    if (row.published_slug) {
      await client.query("DELETE FROM reviews WHERE slug = $1", [row.published_slug]);
    }
    if (row.testimonial_id) {
      await client.query("DELETE FROM testimonials WHERE id = $1", [row.testimonial_id]);
    }
    await client.query(
      `UPDATE student_reviews
          SET status = 'NEW',
              published_slug = NULL,
              testimonial_id = NULL,
              updated_at = NOW()
        WHERE id = $1`,
      [id]
    );
  });
}

export async function archiveStudentReview(id: string): Promise<void> {
  const row = await one<StudentReviewRow>("SELECT * FROM student_reviews WHERE id = $1", [id]);
  if (!row) throw new Error("Review not found.");
  if (row.status === "PUBLISHED") await unpublishStudentReview(id);
  await q(
    "UPDATE student_reviews SET status = 'ARCHIVED', updated_at = NOW() WHERE id = $1",
    [id]
  );
}

export async function restoreStudentReview(id: string): Promise<void> {
  await q("UPDATE student_reviews SET status = 'NEW', updated_at = NOW() WHERE id = $1", [id]);
}

/** Delete a submission for good (and its public copies, if any). */
export async function deleteStudentReview(id: string): Promise<void> {
  const row = await one<StudentReviewRow>("SELECT * FROM student_reviews WHERE id = $1", [id]);
  if (!row) return;
  if (row.status === "PUBLISHED" || row.published_slug || row.testimonial_id) {
    await unpublishStudentReview(id).catch(() => null);
  }
  await q("DELETE FROM student_reviews WHERE id = $1", [id]);
}

/** Every submission, oldest first — used by the CSV / PDF exports. */
export async function allStudentReviews(): Promise<StudentReview[]> {
  const rows = await q<StudentReviewRow>(
    "SELECT * FROM student_reviews ORDER BY created_at ASC"
  );
  return rows.map(toReview);
}

/** Raw photo + status for the public photo endpoint. */
export async function getStudentReviewPhoto(
  id: string
): Promise<{ photo: string; status: StudentReviewStatus } | null> {
  const row = await one<{ photo: string | null; status: StudentReviewStatus }>(
    "SELECT photo, status FROM student_reviews WHERE id = $1",
    [id]
  );
  if (!row?.photo) return null;
  return { photo: row.photo, status: row.status };
}

/** id → photo data-URI, for the CSV / PDF exports (never sent to the list UI). */
export async function studentReviewPhotos(): Promise<Map<string, string>> {
  const rows = await q<{ id: string; photo: string | null }>(
    "SELECT id, photo FROM student_reviews WHERE photo IS NOT NULL"
  );
  const map = new Map<string, string>();
  for (const row of rows) {
    if (row.photo) map.set(row.id, row.photo);
  }
  return map;
}
