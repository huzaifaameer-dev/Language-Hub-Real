import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-guard";
import { getOverview, listAudit } from "@/lib/server/admin";
import { q } from "@/lib/server/pg";

export const dynamic = "force-dynamic";

/** Everything the admin overview board needs in one round-trip. */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const [overview, registrations, demo, feedback, users, audit, courses, testimonials] =
    await Promise.all([
    getOverview(),
    q<{ id: string; ref: string; full_name: string; course_slug: string; status: string; created_at: string | Date }>(
      `SELECT id, ref, full_name, course_slug, status, created_at
         FROM registrations ORDER BY created_at DESC LIMIT 6`
    ),
    q<{ id: string; name: string; course_slug: string; preferred_date: string | null; status: string; created_at: string | Date }>(
      `SELECT id, name, course_slug, preferred_date, status, created_at
         FROM demo_bookings ORDER BY created_at DESC LIMIT 6`
    ),
    q<{ id: string; name: string; subject: string; rating: number; status: string; created_at: string | Date }>(
      `SELECT id, name, subject, rating, status, created_at
         FROM feedback ORDER BY created_at DESC LIMIT 6`
    ),
    q<{ id: string; name: string; email: string; role: string; created_at: string | Date }>(
      `SELECT id, name, email, role, created_at
         FROM users WHERE role <> 'ADMIN' ORDER BY created_at DESC LIMIT 6`
    ),
    listAudit(12),
    q<{ slug: string; name: string; icon: string; duration: string; fee: number; enrolled: number }>(
      `SELECT c.slug, c.name, c.icon, c.duration, c.fee,
              (SELECT COUNT(*)::INT FROM enrollments e
                WHERE e.course_slug = c.slug AND e.status IN ('ACTIVE','PAUSED')) AS enrolled
         FROM courses c
        WHERE c.active = TRUE
        ORDER BY c.sort_order, c.name
        LIMIT 4`
    ),
    q<{ id: string; name: string; role: string; course: string; quote: string; rating: number }>(
      `SELECT id, name, role, course, quote, rating
         FROM testimonials
        WHERE active = TRUE
        ORDER BY featured DESC, created_at DESC
        LIMIT 3`
    ),
  ]);

  const iso = (d: string | Date) => new Date(d).toISOString();

  return NextResponse.json({
    admin: { email: admin.email, name: admin.name },
    overview,
    registrations: registrations.map((r) => ({
      id: r.id,
      ref: r.ref,
      name: r.full_name,
      course: r.course_slug,
      status: r.status,
      createdAt: iso(r.created_at),
    })),
    demoBookings: demo.map((d) => ({
      id: d.id,
      name: d.name,
      course: d.course_slug,
      date: d.preferred_date,
      status: d.status,
      createdAt: iso(d.created_at),
    })),
    feedback: feedback.map((f) => ({
      id: f.id,
      name: f.name,
      subject: f.subject,
      rating: Number(f.rating),
      status: f.status,
      createdAt: iso(f.created_at),
    })),
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: iso(u.created_at),
    })),
    audit: audit.map((a) => ({
      id: a.id,
      actor: a.actor_email,
      action: a.action,
      target: a.target_type,
      createdAt: iso(a.created_at),
    })),
    courses: courses.map((c) => ({
      slug: c.slug,
      name: c.name,
      icon: c.icon,
      duration: c.duration,
      fee: Number(c.fee),
      enrolled: Number(c.enrolled),
    })),
    testimonials: testimonials.map((t) => ({
      id: t.id,
      name: t.name,
      role: t.role,
      course: t.course,
      quote: t.quote,
      rating: Number(t.rating),
    })),
  });
}
