/**
 * Learner-side repository: admissions, enrolments, chapter progress, live
 * classes, certificates, notifications, referrals, demo bookings and feedback.
 *
 * Everything is parameterised SQL; multi-step writes run inside a transaction.
 */

import { one, q, tx } from "./pg";
import { newId, newRef } from "./id";

/* ───────────────────────────── registrations ──────────────────────────── */

export interface RegistrationRow {
  id: string;
  ref: string;
  user_id: string | null;
  course_key: string;
  course_slug: string;
  full_name: string;
  email: string;
  phone: string;
  dob: string | null;
  address: string | null;
  city: string | null;
  goal: string | null;
  preferred_time: string | null;
  message: string | null;
  details: Record<string, unknown> | string;
  send_copy: boolean;
  status: "NEW" | "CONTACTED" | "ENROLLED" | "REJECTED";
  ref_code: string | null;
  photo_path: string | null;
  receipt_path: string | null;
  pdf_path: string | null;
  admin_note: string | null;
  created_at: string | Date;
  updated_at: string | Date;
}

export async function createRegistration(input: {
  userId: string | null;
  courseKey: string;
  courseSlug: string;
  fullName: string;
  email: string;
  phone: string;
  dob?: string | null;
  address?: string | null;
  city?: string | null;
  goal?: string | null;
  preferredTime?: string | null;
  message?: string | null;
  details?: Record<string, unknown>;
  sendCopy?: boolean;
  refCode?: string | null;
  photoPath?: string | null;
  receiptPath?: string | null;
}): Promise<RegistrationRow> {
  const id = newId();
  const ref = newRef("REG");
  const row = await one<RegistrationRow>(
    `INSERT INTO registrations
       (id, ref, user_id, course_key, course_slug, full_name, email, phone,
        dob, address, city, goal, preferred_time, message, details, send_copy,
        ref_code, photo_path, receipt_path, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,$16,$17,$18,$19,'NEW')
     RETURNING *`,
    [
      id,
      ref,
      input.userId,
      input.courseKey,
      input.courseSlug,
      input.fullName,
      input.email.toLowerCase(),
      input.phone,
      input.dob ?? null,
      input.address ?? null,
      input.city ?? null,
      input.goal ?? null,
      input.preferredTime ?? null,
      input.message ?? null,
      JSON.stringify(input.details ?? {}),
      input.sendCopy ?? false,
      input.refCode ?? null,
      input.photoPath ?? null,
      input.receiptPath ?? null,
    ]
  );
  if (!row) throw new Error("Could not create registration.");

  if (input.userId) {
    await q(
      `INSERT INTO notifications (id, user_id, title, body, kind, link)
       VALUES ($1,$2,$3,$4,'success',$5)`,
      [
        newId(),
        input.userId,
        "Registration received",
        `We received your registration for ${input.courseSlug.replace(/-/g, " ")}. Our team replies within 24 hours.`,
        "/dashboard?tab=registrations",
      ]
    );
  }

  return row;
}

export async function listRegistrationsForUser(userId: string): Promise<RegistrationRow[]> {
  return q<RegistrationRow>(
    "SELECT * FROM registrations WHERE user_id = $1 ORDER BY created_at DESC",
    [userId]
  );
}

export async function getRegistration(id: string): Promise<RegistrationRow | null> {
  return one<RegistrationRow>("SELECT * FROM registrations WHERE id = $1 LIMIT 1", [id]);
}

export async function setRegistrationPdf(id: string, path: string): Promise<void> {
  await q("UPDATE registrations SET pdf_path = $1, updated_at = NOW() WHERE id = $2", [
    path,
    id,
  ]);
}

export async function setRegistrationStatus(
  id: string,
  status: RegistrationRow["status"],
  adminNote?: string | null
): Promise<void> {
  await tx(async (client) => {
    const row = await client.query<{ user_id: string | null; course_slug: string }>(
      "SELECT user_id, course_slug FROM registrations WHERE id = $1 LIMIT 1",
      [id]
    );
    await client.query(
      `UPDATE registrations SET status = $1, admin_note = COALESCE($2, admin_note), updated_at = NOW()
        WHERE id = $3`,
      [status, adminNote ?? null, id]
    );
    const reg = row.rows[0];
    if (reg?.user_id) {
      const label =
        status === "ENROLLED"
          ? "You're enrolled"
          : status === "CONTACTED"
            ? "We contacted you"
            : status === "REJECTED"
              ? "Registration update"
              : "Registration received";
      await client.query(
        `INSERT INTO notifications (id, user_id, title, body, kind, link)
         VALUES ($1,$2,$3,$4,'info','/dashboard?tab=registrations')`,
        [
          newId(),
          reg.user_id,
          label,
          status === "ENROLLED"
            ? `Welcome aboard — your seat for ${reg.course_slug.replace(/-/g, " ")} is confirmed.`
            : `Your registration status is now ${status.toLowerCase()}.`,
        ]
      );
    }
  });
}

export async function listRegistrationsAdmin(input: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ rows: RegistrationRow[]; total: number }> {
  const status = input.status && input.status !== "ALL" ? input.status : null;
  const search = (input.search ?? "").trim().toLowerCase();
  const like = `%${search}%`;
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 100);
  const offset = Math.max(input.offset ?? 0, 0);

  const where = `
    WHERE ($1::text IS NULL OR status = $1::text)
      AND ($2 = '' OR LOWER(full_name) LIKE $2 OR LOWER(email) LIKE $2 OR LOWER(ref) LIKE $2)
  `;
  const params = [status, like];

  const rows = await q<RegistrationRow>(
    `SELECT * FROM registrations ${where} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
    params
  );
  const total = await one<{ n: number }>(
    `SELECT COUNT(*)::INT AS n FROM registrations ${where}`,
    params
  );
  return { rows, total: total?.n ?? 0 };
}

export async function countRegistrationsByStatus(): Promise<Record<string, number>> {
  const rows = await q<{ status: string; n: number }>(
    "SELECT status, COUNT(*)::INT AS n FROM registrations GROUP BY status"
  );
  const out: Record<string, number> = { NEW: 0, CONTACTED: 0, ENROLLED: 0, REJECTED: 0 };
  for (const row of rows) out[row.status] = Number(row.n);
  return out;
}

/* ─────────────────────────────── enrolment ────────────────────────────── */

export interface EnrollmentRow {
  id: string;
  user_id: string;
  course_slug: string;
  course_name: string;
  batch: string;
  instructor: string;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
  enrolled_at: string | Date;
}

export async function listEnrollments(userId: string): Promise<EnrollmentRow[]> {
  return q<EnrollmentRow>(
    `SELECT e.*, c.name AS course_name
       FROM enrollments e
       JOIN courses c ON c.slug = e.course_slug
      WHERE e.user_id = $1
      ORDER BY (e.status = 'ACTIVE') DESC, e.enrolled_at DESC`,
    [userId]
  );
}

export async function enrollUser(input: {
  userId: string;
  courseSlug: string;
  batch?: string;
  instructor?: string;
}): Promise<EnrollmentRow> {
  await q(
    `INSERT INTO enrollments (id, user_id, course_slug, batch, instructor, status)
     VALUES ($1,$2,$3,$4,$5,'ACTIVE')
     ON CONFLICT (user_id, course_slug) WHERE status = 'ACTIVE'
     DO UPDATE SET batch = EXCLUDED.batch, instructor = EXCLUDED.instructor, updated_at = NOW()`,
    [newId(), input.userId, input.courseSlug, input.batch ?? "", input.instructor ?? ""]
  );
  const row = await one<EnrollmentRow>(
    `SELECT e.*, c.name AS course_name
       FROM enrollments e JOIN courses c ON c.slug = e.course_slug
      WHERE e.user_id = $1 AND e.course_slug = $2 AND e.status = 'ACTIVE'
      LIMIT 1`,
    [input.userId, input.courseSlug]
  );
  if (!row) throw new Error("Could not enrol user.");
  return row;
}

/* ─────────────────────────────── progress ─────────────────────────────── */

export interface ChapterProgressView {
  id: string;
  title: string;
  completed: boolean;
  completedAt: string | null;
}

export interface ProgressView {
  enrollmentId: string;
  course: string;
  courseSlug: string;
  batch: string;
  chapters: ChapterProgressView[];
  attendance: Array<{ date: string; attended: boolean; topic: string }>;
  lastChapter: string | null;
  updatedAt: string;
  percent: number;
}

export async function getProgressForUser(userId: string): Promise<ProgressView[]> {
  const enrollments = await listEnrollments(userId);
  const views: ProgressView[] = [];

  for (const e of enrollments) {
    const chapters = await q<{
      id: string;
      title: string;
      completed: boolean;
      completed_at: string | Date | null;
    }>(
      `SELECT ch.id, ch.title, COALESCE(cp.completed, FALSE) AS completed, cp.completed_at
         FROM chapters ch
         LEFT JOIN chapter_progress cp ON cp.chapter_id = ch.id AND cp.user_id = $1
        WHERE ch.course_slug = $2
        ORDER BY ch.sort_order, ch.title`,
      [userId, e.course_slug]
    );

    const attendance = await q<{
      scheduled_at: string | Date;
      title: string;
      attended: boolean;
    }>(
      `SELECT lc.scheduled_at, lc.title, COALESCE(a.attended, FALSE) AS attended
         FROM live_classes lc
         LEFT JOIN attendance a ON a.class_id = lc.id AND a.user_id = $1
        WHERE lc.course_slug = $2 AND lc.scheduled_at <= NOW()
        ORDER BY lc.scheduled_at DESC
        LIMIT 12`,
      [userId, e.course_slug]
    );

    const done = chapters.filter((c) => c.completed).length;
    const percent = chapters.length ? Math.round((done / chapters.length) * 100) : 0;
    const next = chapters.find((c) => !c.completed);

    views.push({
      enrollmentId: e.id,
      course: e.course_name,
      courseSlug: e.course_slug,
      batch: e.batch,
      chapters: chapters.map((c) => ({
        id: c.id,
        title: c.title,
        completed: Boolean(c.completed),
        completedAt: c.completed_at ? new Date(c.completed_at).toISOString() : null,
      })),
      attendance: attendance.map((a) => ({
        date: new Date(a.scheduled_at).toISOString(),
        attended: Boolean(a.attended),
        topic: a.title,
      })),
      lastChapter: next?.title ?? null,
      updatedAt: new Date().toISOString(),
      percent,
    });
  }

  return views;
}

export async function toggleChapter(
  userId: string,
  chapterId: string
): Promise<{ completed: boolean }> {
  return tx(async (client) => {
    const current = await client.query<{ completed: boolean }>(
      "SELECT completed FROM chapter_progress WHERE user_id = $1 AND chapter_id = $2 LIMIT 1",
      [userId, chapterId]
    );
    const next = !Boolean(current.rows[0]?.completed);
    await client.query(
      `INSERT INTO chapter_progress (id, user_id, chapter_id, completed, completed_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,NOW())
       ON CONFLICT (user_id, chapter_id)
       DO UPDATE SET completed = $4, completed_at = $5, updated_at = NOW()`,
      [newId(), userId, chapterId, next, next ? new Date().toISOString() : null]
    );
    return { completed: next };
  });
}

export async function overallProgress(userId: string): Promise<number> {
  const row = await one<{ done: number; total: number }>(
    `SELECT
       COUNT(*) FILTER (WHERE cp.completed)::INT AS done,
       COUNT(*)::INT AS total
     FROM enrollments e
     JOIN chapters ch ON ch.course_slug = e.course_slug
     LEFT JOIN chapter_progress cp ON cp.chapter_id = ch.id AND cp.user_id = e.user_id
     WHERE e.user_id = $1 AND e.status = 'ACTIVE'`,
    [userId]
  );
  if (!row || row.total === 0) return 0;
  return Math.round((row.done / row.total) * 100);
}

/* ───────────────────────────── live classes ───────────────────────────── */

export interface LiveClassView {
  id: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingLink: string;
  platform: string;
  instructor: string;
  course: string;
  batch: string;
}

function toClassView(row: {
  id: string;
  title: string;
  scheduled_at: string | Date;
  duration_minutes: number;
  meeting_link: string;
  platform: string;
  instructor: string;
  course_name: string | null;
  batch: string;
}): LiveClassView {
  return {
    id: row.id,
    title: row.title,
    scheduledAt: new Date(row.scheduled_at).toISOString(),
    durationMinutes: Number(row.duration_minutes),
    meetingLink: row.meeting_link,
    platform: row.platform,
    instructor: row.instructor,
    course: row.course_name ?? "",
    batch: row.batch,
  };
}

export async function listUpcomingClasses(userId: string): Promise<LiveClassView[]> {
  const enrollments = await listEnrollments(userId);
  const slugs = enrollments.filter((e) => e.status === "ACTIVE").map((e) => e.course_slug);

  const rows = await q<{
    id: string;
    title: string;
    scheduled_at: string | Date;
    duration_minutes: number;
    meeting_link: string;
    platform: string;
    instructor: string;
    course_name: string | null;
    batch: string;
  }>(
    `SELECT lc.*, c.name AS course_name
       FROM live_classes lc
       LEFT JOIN courses c ON c.slug = lc.course_slug
      WHERE lc.scheduled_at >= NOW()
        AND ($1::text[] IS NULL OR lc.course_slug = ANY($1::text[]))
      ORDER BY lc.scheduled_at ASC
      LIMIT 20`,
    [slugs.length ? slugs : null]
  );

  return rows.map(toClassView);
}

export async function createLiveClass(input: {
  title: string;
  courseSlug: string;
  batch?: string;
  instructor?: string;
  scheduledAt: string;
  durationMinutes?: number;
  meetingLink?: string;
  platform?: string;
}): Promise<string> {
  const id = newId();
  await q(
    `INSERT INTO live_classes
       (id, title, course_slug, batch, instructor, scheduled_at, duration_minutes, meeting_link, platform)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      id,
      input.title,
      input.courseSlug,
      input.batch ?? "",
      input.instructor ?? "",
      input.scheduledAt,
      input.durationMinutes ?? 60,
      input.meetingLink ?? "",
      input.platform ?? "Zoom",
    ]
  );
  return id;
}

export async function listAllClasses(): Promise<LiveClassView[]> {
  const rows = await q<{
    id: string;
    title: string;
    scheduled_at: string | Date;
    duration_minutes: number;
    meeting_link: string;
    platform: string;
    instructor: string;
    course_name: string | null;
    batch: string;
  }>(
    `SELECT lc.*, c.name AS course_name
       FROM live_classes lc
       LEFT JOIN courses c ON c.slug = lc.course_slug
      ORDER BY lc.scheduled_at DESC
      LIMIT 100`
  );
  return rows.map(toClassView);
}

export async function deleteLiveClass(id: string): Promise<void> {
  await q("DELETE FROM live_classes WHERE id = $1", [id]);
}

/* ───────────────────────────── certificates ───────────────────────────── */

export interface CertificateRow {
  id: string;
  user_id: string;
  certificate_id: string;
  student_name: string;
  course: string;
  batch: string;
  issued_at: string | Date;
  completion_percent: number;
  signed_by: string;
}

export async function listCertificates(userId: string): Promise<CertificateRow[]> {
  return q<CertificateRow>(
    "SELECT * FROM certificates WHERE user_id = $1 ORDER BY issued_at DESC",
    [userId]
  );
}

export async function getCertificateByPublicId(
  certificateId: string
): Promise<CertificateRow | null> {
  return one<CertificateRow>(
    "SELECT * FROM certificates WHERE certificate_id = $1 LIMIT 1",
    [certificateId]
  );
}

export async function listAllCertificates(limit = 100): Promise<CertificateRow[]> {
  return q<CertificateRow>(
    `SELECT * FROM certificates ORDER BY issued_at DESC LIMIT ${Math.min(Math.max(limit, 1), 200)}`
  );
}

export async function issueCertificate(
  userId: string
): Promise<{ ok: true; certificate: CertificateRow } | { ok: false; message: string }> {
  const enrollments = await listEnrollments(userId);
  const active = enrollments.find((e) => e.status === "ACTIVE");
  if (!active) return { ok: false, message: "Enrol in a course first." };

  const progress = await getProgressForUser(userId);
  const view = progress.find((p) => p.courseSlug === active.course_slug);
  if (!view || view.percent < 80) {
    return { ok: false, message: "Complete at least 80% of the chapters first." };
  }

  const existing = await one<CertificateRow>(
    "SELECT * FROM certificates WHERE user_id = $1 AND course = $2 LIMIT 1",
    [userId, active.course_name]
  );
  if (existing) return { ok: true, certificate: existing };

  const user = await one<{ name: string }>("SELECT name FROM users WHERE id = $1", [userId]);
  const year = new Date().getFullYear();
  const certificateId = `LH-${year}-${newRef("C").split("-")[1]}`;
  const row = await one<CertificateRow>(
    `INSERT INTO certificates
       (id, user_id, certificate_id, student_name, course, batch, completion_percent, signed_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'Javaria Malik')
     RETURNING *`,
    [
      newId(),
      userId,
      certificateId,
      user?.name ?? "Language Hub Student",
      active.course_name,
      active.batch,
      view.percent,
    ]
  );
  if (!row) return { ok: false, message: "Could not issue certificate." };

  await q(
    `INSERT INTO notifications (id, user_id, title, body, kind, link)
     VALUES ($1,$2,'Certificate issued','Your certificate is ready to download and share.','success', $3)`,
    [newId(), userId, `/result/${certificateId}`]
  );

  return { ok: true, certificate: row };
}

/* ──────────────────────────── notifications ───────────────────────────── */

export interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  body: string;
  kind: string;
  link: string | null;
  read: boolean;
  created_at: string | Date;
}

export async function listNotifications(userId: string, limit = 30): Promise<NotificationRow[]> {
  return q<NotificationRow>(
    `SELECT * FROM notifications WHERE user_id = $1
      ORDER BY read ASC, created_at DESC LIMIT ${Math.min(Math.max(limit, 1), 100)}`,
    [userId]
  );
}

export async function markNotificationsRead(userId: string): Promise<void> {
  await q("UPDATE notifications SET read = TRUE WHERE user_id = $1 AND read = FALSE", [userId]);
}

export async function unreadNotificationCount(userId: string): Promise<number> {
  const row = await one<{ n: number }>(
    "SELECT COUNT(*)::INT AS n FROM notifications WHERE user_id = $1 AND read = FALSE",
    [userId]
  );
  return row?.n ?? 0;
}

export async function createNotification(input: {
  userId: string;
  title: string;
  body?: string;
  kind?: string;
  link?: string | null;
}): Promise<void> {
  await q(
    `INSERT INTO notifications (id, user_id, title, body, kind, link)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [
      newId(),
      input.userId,
      input.title,
      input.body ?? "",
      input.kind ?? "info",
      input.link ?? null,
    ]
  );
}

/* ───────────────────────────── demo bookings ──────────────────────────── */

export interface DemoBookingRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  course_slug: string;
  preferred_date: string | null;
  preferred_time: string | null;
  message: string | null;
  status: "NEW" | "SCHEDULED" | "DONE" | "CANCELLED";
  created_at: string | Date;
  updated_at: string | Date;
}

export async function createDemoBooking(input: {
  name: string;
  email: string;
  phone?: string | null;
  courseSlug?: string;
  preferredDate?: string | null;
  preferredTime?: string | null;
  message?: string | null;
}): Promise<DemoBookingRow> {
  const row = await one<DemoBookingRow>(
    `INSERT INTO demo_bookings
       (id, name, email, phone, course_slug, preferred_date, preferred_time, message, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'NEW')
     RETURNING *`,
    [
      newId(),
      input.name,
      input.email.toLowerCase(),
      input.phone ?? null,
      input.courseSlug ?? "",
      input.preferredDate ?? null,
      input.preferredTime ?? null,
      input.message ?? null,
    ]
  );
  if (!row) throw new Error("Could not create demo booking.");
  return row;
}

export async function listDemoBookings(input: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ rows: DemoBookingRow[]; total: number }> {
  const status = input.status && input.status !== "ALL" ? input.status : null;
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 100);
  const offset = Math.max(input.offset ?? 0, 0);
  const where = `WHERE ($1::text IS NULL OR status = $1::text)`;
  const rows = await q<DemoBookingRow>(
    `SELECT * FROM demo_bookings ${where} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
    [status]
  );
  const total = await one<{ n: number }>(
    `SELECT COUNT(*)::INT AS n FROM demo_bookings ${where}`,
    [status]
  );
  return { rows, total: total?.n ?? 0 };
}

export async function setDemoBookingStatus(
  id: string,
  status: DemoBookingRow["status"]
): Promise<void> {
  await q("UPDATE demo_bookings SET status = $1, updated_at = NOW() WHERE id = $2", [status, id]);
}

/* ─────────────────────────────── feedback ─────────────────────────────── */

export interface FeedbackRow {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  category: string;
  rating: number;
  subject: string;
  message: string;
  contact_ok: boolean;
  status: "NEW" | "REVIEWED" | "ARCHIVED";
  created_at: string | Date;
}

export async function createFeedback(input: {
  userId?: string | null;
  name: string;
  email?: string | null;
  category?: string;
  rating: number;
  subject: string;
  message: string;
  contactOk?: boolean;
}): Promise<FeedbackRow> {
  const row = await one<FeedbackRow>(
    `INSERT INTO feedback (id, user_id, name, email, category, rating, subject, message, contact_ok, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'NEW')
     RETURNING *`,
    [
      newId(),
      input.userId ?? null,
      input.name,
      input.email ?? "",
      input.category ?? "general",
      input.rating,
      input.subject,
      input.message,
      input.contactOk ?? false,
    ]
  );
  if (!row) throw new Error("Could not save feedback.");
  return row;
}

export async function listFeedback(input: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ rows: FeedbackRow[]; total: number }> {
  const status = input.status && input.status !== "ALL" ? input.status : null;
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 100);
  const offset = Math.max(input.offset ?? 0, 0);
  const where = `WHERE ($1::text IS NULL OR status = $1::text)`;
  const rows = await q<FeedbackRow>(
    `SELECT * FROM feedback ${where} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
    [status]
  );
  const total = await one<{ n: number }>(
    `SELECT COUNT(*)::INT AS n FROM feedback ${where}`,
    [status]
  );
  return { rows, total: total?.n ?? 0 };
}

export async function setFeedbackStatus(id: string, status: FeedbackRow["status"]): Promise<void> {
  await q("UPDATE feedback SET status = $1, updated_at = NOW() WHERE id = $2", [status, id]);
}
