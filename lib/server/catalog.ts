/**
 * Catalogue + public content repository: courses, chapters, testimonials,
 * team profiles, platform settings and the site-wide live stats.
 */

import type { CourseBatch, CourseInfo, CourseModule } from "@/lib/course-data";
import { one, q } from "./pg";
import { newId } from "./id";

/* ─────────────────────────────── courses ──────────────────────────────── */

export interface CourseRow {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  duration: string;
  schedule: string;
  teacher: string;
  fee: number;
  accent_from: string;
  accent_to: string;
  icon: string;
  modules: CourseModule[] | string;
  outcomes: string[] | string;
  batches: CourseBatch[] | string;
  active: boolean;
  sort_order: number;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface CourseRecord {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  duration: string;
  schedule: string;
  teacher: string;
  fee: number;
  accentFrom: string;
  accentTo: string;
  icon: string;
  modules: CourseModule[];
  outcomes: string[];
  batches: CourseBatch[];
  active: boolean;
  sortOrder: number;
}

function json<T>(value: T[] | string | null | undefined, fallback: T[] = []): T[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export function toCourseRecord(row: CourseRow): CourseRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    duration: row.duration,
    schedule: row.schedule,
    teacher: row.teacher,
    fee: Number(row.fee),
    accentFrom: row.accent_from,
    accentTo: row.accent_to,
    icon: row.icon,
    modules: json<CourseModule>(row.modules),
    outcomes: json<string>(row.outcomes),
    batches: json<CourseBatch>(row.batches),
    active: Boolean(row.active),
    sortOrder: Number(row.sort_order),
  };
}

export function toCourseInfo(record: CourseRecord): CourseInfo {
  return {
    name: record.name,
    tagline: record.tagline,
    description: record.description,
    fee: record.fee,
    currency: "PKR",
    duration: record.duration,
    teacher: record.teacher,
    schedule: record.schedule,
    batches: record.batches,
    order: record.sortOrder,
    active: record.active,
    modules: record.modules,
    outcomes: record.outcomes,
  };
}

export async function listCourses(activeOnly = true): Promise<CourseRecord[]> {
  const rows = await q<CourseRow>(
    `SELECT * FROM courses ${activeOnly ? "WHERE active = TRUE" : ""} ORDER BY sort_order, name`
  );
  return rows.map(toCourseRecord);
}

export async function getCourse(slug: string): Promise<CourseRecord | null> {
  const row = await one<CourseRow>("SELECT * FROM courses WHERE slug = $1 LIMIT 1", [slug]);
  return row ? toCourseRecord(row) : null;
}

export async function updateCourse(
  slug: string,
  patch: Partial<{
    name: string;
    tagline: string;
    description: string;
    duration: string;
    schedule: string;
    fee: number;
    active: boolean;
    sortOrder: number;
  }>
): Promise<void> {  await q(
    `UPDATE courses SET
       name = COALESCE($1, name),
       tagline = COALESCE($2, tagline),
       description = COALESCE($3, description),
       duration = COALESCE($4, duration),
       schedule = COALESCE($5, schedule),
       fee = COALESCE($6, fee),
       active = COALESCE($7, active),
       sort_order = COALESCE($8, sort_order),
       updated_at = NOW()
     WHERE slug = $9`,
    [
      patch.name ?? null,
      patch.tagline ?? null,
      patch.description ?? null,
      patch.duration ?? null,
      patch.schedule ?? null,
      patch.fee ?? null,
      patch.active ?? null,
      patch.sortOrder ?? null,
      slug,
    ]
  );
}

export interface CreateCourseInput {
  name: string;
  slug?: string;
  tagline?: string;
  description?: string;
  duration?: string;
  schedule?: string;
  teacher?: string;
  fee?: number;
  accentFrom?: string;
  accentTo?: string;
  icon?: string;
  active?: boolean;
  sortOrder?: number;
}

function courseSlugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Adds a programme. The slug is derived from the name and kept unique. */
export async function createCourse(input: CreateCourseInput): Promise<string> {
  const base = courseSlugify(input.slug?.trim() || input.name) || `programme-${Date.now().toString(36)}`;
  const taken = await q<{ slug: string }>("SELECT slug FROM courses");
  const used = new Set(taken.map((row) => row.slug));
  let slug = base;
  let n = 2;
  while (used.has(slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }

  const id = newId();
  const nextOrder =
    input.sortOrder ??
    (await one<{ n: number }>("SELECT COALESCE(MAX(sort_order), 0)::INT + 1 AS n FROM courses"))?.n ??
    1;

  await q(
    `INSERT INTO courses
       (id, slug, name, tagline, description, duration, schedule, teacher, fee,
        accent_from, accent_to, icon, active, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    [
      id,
      slug,
      input.name.trim(),
      input.tagline?.trim() ?? "",
      input.description?.trim() ?? "",
      input.duration?.trim() ?? "",
      input.schedule?.trim() ?? "",
      input.teacher?.trim() || "Javaria Malik",
      Math.max(0, Math.round(input.fee ?? 0)),
      input.accentFrom ?? "#0a4e43",
      input.accentTo ?? "#14a08c",
      input.icon ?? "book",
      input.active ?? true,
      nextOrder,
    ]
  );

  return slug;
}

export async function deleteCourse(slug: string): Promise<void> {
  await q("DELETE FROM courses WHERE slug = $1", [slug]);
}

export interface ChapterRow {
  id: string;
  course_slug: string;
  title: string;
  sort_order: number;
}export async function listChapters(courseSlug: string): Promise<ChapterRow[]> {
  return q<ChapterRow>(
    "SELECT * FROM chapters WHERE course_slug = $1 ORDER BY sort_order, title",
    [courseSlug]
  );
}

/* ───────────────────────────── testimonials ───────────────────────────── */

export interface TestimonialRow {
  id: string;
  name: string;
  role: string;
  course: string;
  quote: string;
  outcome: string;
  rating: number;
  image: string | null;
  featured: boolean;
  active: boolean;
  sort_order: number;
  created_at: string | Date;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  course: string;
  quote: string;
  outcome: string;
  rating: number;
  image: string | null;
  featured: boolean;
  active: boolean;
  sortOrder: number;
}

function toTestimonial(row: TestimonialRow): Testimonial {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    course: row.course,
    quote: row.quote,
    outcome: row.outcome,
    rating: Number(row.rating),
    image: row.image,
    featured: Boolean(row.featured),
    active: Boolean(row.active),
    sortOrder: Number(row.sort_order),
  };
}

export async function listTestimonials(activeOnly = true): Promise<Testimonial[]> {
  const rows = await q<TestimonialRow>(
    `SELECT * FROM testimonials ${activeOnly ? "WHERE active = TRUE" : ""}
     ORDER BY featured DESC, sort_order, created_at DESC`
  );
  return rows.map(toTestimonial);
}

export async function createTestimonial(input: {
  name: string;
  role?: string;
  course?: string;
  quote: string;
  outcome?: string;
  rating?: number;
  featured?: boolean;
}): Promise<string> {
  const id = newId();
  await q(
    `INSERT INTO testimonials (id, name, role, course, quote, outcome, rating, featured)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      id,
      input.name,
      input.role ?? "",
      input.course ?? "",
      input.quote,
      input.outcome ?? "",
      input.rating ?? 5,
      input.featured ?? false,
    ]
  );
  return id;
}

export async function updateTestimonial(
  id: string,
  patch: Partial<{
    name: string;
    role: string;
    course: string;
    quote: string;
    outcome: string;
    rating: number;
    featured: boolean;
    active: boolean;
  }>
): Promise<void> {
  await q(
    `UPDATE testimonials SET
       name = COALESCE($1, name),
       role = COALESCE($2, role),
       course = COALESCE($3, course),
       quote = COALESCE($4, quote),
       outcome = COALESCE($5, outcome),
       rating = COALESCE($6, rating),
       featured = COALESCE($7, featured),
       active = COALESCE($8, active),
       updated_at = NOW()
     WHERE id = $9`,
    [
      patch.name ?? null,
      patch.role ?? null,
      patch.course ?? null,
      patch.quote ?? null,
      patch.outcome ?? null,
      patch.rating ?? null,
      patch.featured ?? null,
      patch.active ?? null,
      id,
    ]
  );
}

export async function deleteTestimonial(id: string): Promise<void> {
  await q("DELETE FROM testimonials WHERE id = $1", [id]);
}

/* ──────────────────────────────── team ────────────────────────────────── */

export interface TeamRow {
  id: string;
  name: string;
  role: string;
  headline: string | null;
  credentials: string[] | string;
  bio: string;
  focus: string[] | string;
  image: string | null;
  ceo: boolean;
  active: boolean;
  sort_order: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  headline: string | null;
  credentials: string[];
  bio: string;
  focus: string[];
  image: string | null;
  ceo: boolean;
  active: boolean;
}

export async function listTeam(activeOnly = true): Promise<TeamMember[]> {
  const rows = await q<TeamRow>(
    `SELECT * FROM team_members ${activeOnly ? "WHERE active = TRUE" : ""}
     ORDER BY ceo DESC, sort_order, name`
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    role: row.role,
    headline: row.headline,
    credentials: json<string>(row.credentials),
    bio: row.bio,
    focus: json<string>(row.focus),
    image: row.image,
    ceo: Boolean(row.ceo),
    active: Boolean(row.active),
  }));
}

/* ─────────────────────────────── settings ─────────────────────────────── */

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await one<{ value: T | string }>("SELECT value FROM settings WHERE key = $1", [
    key,
  ]);
  if (!row) return fallback;
  if (typeof row.value === "string") {
    try {
      return JSON.parse(row.value) as T;
    } catch {
      return fallback;
    }
  }
  return row.value as T;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await q(
    `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [key, JSON.stringify(value)]
  );
}

export interface SiteStats {
  students: number;
  programmes: number;
  dailyBatches: number;
}

export async function getSiteStats(): Promise<SiteStats> {
  const [base, courses, batches] = await Promise.all([
    getSetting<{ learners?: number }>("site.stats", { learners: 1000 }),
    one<{ n: number }>("SELECT COUNT(*)::INT AS n FROM courses WHERE active = TRUE"),
    one<{ n: number }>("SELECT COALESCE(SUM(jsonb_array_length(batches)), 0)::INT AS n FROM courses WHERE active = TRUE"),
  ]);

  return {
    students: Math.max(Number(base.learners ?? 1000), 1000),
    programmes: courses?.n ?? 4,
    dailyBatches: Math.max(3, Math.min(12, Math.round((batches?.n ?? 12) / 4))),
  };
}

/* ─────────────────────────── public catalogue ─────────────────────────── */

export interface PublicCourse extends CourseInfo {
  slug: string;
  accentFrom: string;
  accentTo: string;
  icon: string;
  seatsTotal: number;
  seatsUsed: number;
  seatsLeft: number;
  batchSeats: Array<{
    name: string;
    time: string;
    seatsTotal: number;
    seatsUsed: number;
    seatsLeft: number;
    full: boolean;
  }>;
}

/**
 * Courses for the public site + course pages, with live seat usage computed
 * from active enrolments (course slug + batch name). Every figure is a real
 * aggregate over PostgreSQL.
 */
export async function publicCourses(): Promise<PublicCourse[]> {
  const courses = await listCourses(true);
  const usage = await q<{ course_slug: string; batch: string; n: number }>(
    `SELECT course_slug, batch, COUNT(*)::INT AS n
       FROM enrollments
      WHERE status IN ('ACTIVE', 'PAUSED')
      GROUP BY course_slug, batch`
  );

  const used = new Map<string, number>();
  for (const row of usage) {
    used.set(`${row.course_slug}::${row.batch}`, Number(row.n));
  }

  return courses.map((course) => {
    const info = toCourseInfo(course);
    const batchSeats = info.batches.map((b) => {
      const seatsUsed = used.get(`${course.slug}::${b.name}`) ?? 0;
      return {
        name: b.name,
        time: b.time,
        seatsTotal: b.seatsTotal,
        seatsUsed,
        seatsLeft: Math.max(0, b.seatsTotal - seatsUsed),
        full: seatsUsed >= b.seatsTotal,
      };
    });
    const seatsTotal = batchSeats.reduce((s, b) => s + b.seatsTotal, 0);
    const seatsUsed = batchSeats.reduce((s, b) => s + b.seatsUsed, 0);

    return {
      ...info,
      slug: course.slug,
      accentFrom: course.accentFrom,
      accentTo: course.accentTo,
      icon: course.icon,
      seatsTotal,
      seatsUsed,
      seatsLeft: Math.max(0, seatsTotal - seatsUsed),
      batchSeats,
    };
  });
}
