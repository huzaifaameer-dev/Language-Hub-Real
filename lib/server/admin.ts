/**
 * Admin-side repository helpers: platform metrics, audit trail and the
 * settings store used by the control suite.
 */

import { one, q } from "./pg";
import { newId } from "./id";

export interface Overview {
  users: number;
  newUsers7d: number;
  registrations: number;
  newRegistrations: number;
  demoBookings: number;
  newDemoBookings: number;
  feedback: number;
  newFeedback: number;
  enrollments: number;
  certificates: number;
  courses: number;
  testimonials: number;
  securityEvents: number;
  leads: number;
}

export async function getOverview(): Promise<Overview> {
  const row = await one<Record<string, number>>(
    `SELECT
       (SELECT COUNT(*)::INT FROM users WHERE role <> 'ADMIN')                       AS users,
       (SELECT COUNT(*)::INT FROM users WHERE role <> 'ADMIN'
          AND created_at >= NOW() - INTERVAL '7 days')                              AS new_users_7d,
       (SELECT COUNT(*)::INT FROM registrations)                                    AS registrations,
       (SELECT COUNT(*)::INT FROM registrations WHERE status = 'NEW')                AS new_registrations,
       (SELECT COUNT(*)::INT FROM demo_bookings)                                    AS demo_bookings,
       (SELECT COUNT(*)::INT FROM demo_bookings WHERE status = 'NEW')                AS new_demo_bookings,
       (SELECT COUNT(*)::INT FROM feedback)                                         AS feedback,
       (SELECT COUNT(*)::INT FROM feedback WHERE status = 'NEW')                     AS new_feedback,
       (SELECT COUNT(*)::INT FROM enrollments WHERE status = 'ACTIVE')                AS enrollments,
       (SELECT COUNT(*)::INT FROM certificates)                                     AS certificates,
       (SELECT COUNT(*)::INT FROM courses WHERE active = TRUE)                       AS courses,
       (SELECT COUNT(*)::INT FROM testimonials WHERE active = TRUE)                   AS testimonials,
       (SELECT COUNT(*)::INT FROM attack_events)                                     AS security_events,
       (SELECT COUNT(*)::INT FROM placement_test_leads)                              AS leads`
  );

  const n = (key: string) => Number(row?.[key] ?? 0);

  return {
    users: n("users"),
    newUsers7d: n("new_users_7d"),
    registrations: n("registrations"),
    newRegistrations: n("new_registrations"),
    demoBookings: n("demo_bookings"),
    newDemoBookings: n("new_demo_bookings"),
    feedback: n("feedback"),
    newFeedback: n("new_feedback"),
    enrollments: n("enrollments"),
    certificates: n("certificates"),
    courses: n("courses"),
    testimonials: n("testimonials"),
    securityEvents: n("security_events"),
    leads: n("leads"),
  };
}

/* ─────────────────────────────── audit trail ───────────────────────────── */

export async function audit(input: {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  meta?: Record<string, unknown>;
  ip?: string | null;
}): Promise<void> {
  try {
    await q(
      `INSERT INTO audit_logs (id, actor_id, actor_email, action, target_type, target_id, meta, ip)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8)`,
      [
        newId(),
        input.actorId ?? null,
        input.actorEmail ?? null,
        input.action,
        input.targetType ?? null,
        input.targetId ?? null,
        JSON.stringify(input.meta ?? {}),
        input.ip ?? null,
      ]
    );
  } catch {
    // Audit writes must never break the operation they describe.
  }
}

export interface AuditRow {
  id: string;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  meta: Record<string, unknown> | string;
  ip: string | null;
  created_at: string | Date;
}

export async function listAudit(limit = 40): Promise<AuditRow[]> {
  return q<AuditRow>(
    `SELECT id, actor_email, action, target_type, target_id, meta, ip, created_at
       FROM audit_logs ORDER BY created_at DESC LIMIT ${Math.min(Math.max(limit, 1), 200)}`
  );
}

/* ───────────────────────────────── settings ────────────────────────────── */

export async function loadSettings(): Promise<Record<string, unknown>> {
  const rows = await q<{ key: string; value: unknown }>(
    "SELECT key, value FROM settings ORDER BY key"
  );
  const out: Record<string, unknown> = {};
  for (const row of rows) {
    out[row.key] =
      typeof row.value === "string" ? safeJson(row.value) : row.value;
  }
  return out;
}

function safeJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export async function saveSetting(key: string, value: unknown): Promise<void> {
  await q(
    `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [key, JSON.stringify(value)]
  );
}

/* ──────────────────────────────── leads ────────────────────────────────── */

export interface LeadRow {
  id: string;
  name: string;
  email: string;
  score: number | null;
  total: number | null;
  level: string | null;
  recommended_course: string | null;
  created_at: string | Date;
}

export async function listLeads(limit = 100): Promise<LeadRow[]> {
  return q<LeadRow>(
    `SELECT * FROM placement_test_leads ORDER BY created_at DESC LIMIT ${Math.min(
      Math.max(limit, 1),
      200
    )}`
  );
}

/* ───────────────────────────── certificates ────────────────────────────── */

export async function listAllCertificates(limit = 100) {
  return q<{
    id: string;
    certificate_id: string;
    student_name: string;
    course: string;
    batch: string;
    issued_at: string | Date;
    completion_percent: number;
  }>(
    `SELECT id, certificate_id, student_name, course, batch, issued_at, completion_percent
       FROM certificates ORDER BY issued_at DESC LIMIT ${Math.min(Math.max(limit, 1), 200)}`
  );
}
