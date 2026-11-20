import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-guard";
import { q } from "@/lib/server/pg";

export const dynamic = "force-dynamic";

type AdminTab = "registrations" | "demo" | "blog" | "feedback" | "student-reviews";

type Item = {
  id: string;
  kind: "registration" | "demo" | "comment" | "feedback" | "review";
  title: string;
  detail: string;
  tab: AdminTab;
  createdAt: string;
};

const iso = (value: string | Date) => new Date(value).toISOString();

/**
 * One-stop inbox for the admin header: everything that still needs a human,
 * with a per-section count. Every query is capped — the bell never becomes a
 * second dashboard.
 */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  try {
    const [registrations, demos, comments, feedback, reviews] = await Promise.all([
      q<{ id: string; name: string; detail: string; created_at: string | Date; total: number }>(
        `SELECT id, full_name AS name, course_slug AS detail, created_at,
                COUNT(*) OVER()::INT AS total
           FROM registrations
          WHERE status = 'NEW'
          ORDER BY created_at DESC
          LIMIT 5`
      ),
      q<{ id: string; name: string; detail: string; created_at: string | Date; total: number }>(
        `SELECT id, name, course_slug AS detail, created_at,
                COUNT(*) OVER()::INT AS total
           FROM demo_bookings
          WHERE status = 'NEW'
          ORDER BY created_at DESC
          LIMIT 5`
      ),
      q<{
        id: string;
        name: string;
        detail: string;
        created_at: string | Date;
        total: number;
      }>(
        `SELECT c.id, c.name, p.title AS detail, c.created_at,
                COUNT(*) OVER()::INT AS total
           FROM blog_comments c
           JOIN blog_posts p ON p.id = c.post_id
          WHERE c.approved = FALSE
          ORDER BY c.created_at DESC
          LIMIT 5`
      ),
      q<{ id: string; name: string; detail: string; created_at: string | Date; total: number }>(
        `SELECT id, COALESCE(NULLIF(name, ''), 'Anonymous') AS name,
                COALESCE(NULLIF(subject, ''), category) AS detail, created_at,
                COUNT(*) OVER()::INT AS total
           FROM feedback
          WHERE status = 'NEW'
          ORDER BY created_at DESC
          LIMIT 5`
      ),
      q<{ id: string; name: string; detail: string; created_at: string | Date; total: number }>(
        `SELECT id, name, course AS detail, created_at,
                COUNT(*) OVER()::INT AS total
           FROM student_reviews
          WHERE status = 'NEW'
          ORDER BY created_at DESC
          LIMIT 5`
      ),
    ]);

    const counts = {
      registrations: Number(registrations[0]?.total ?? 0),
      demos: Number(demos[0]?.total ?? 0),
      comments: Number(comments[0]?.total ?? 0),
      feedback: Number(feedback[0]?.total ?? 0),
      studentReviews: Number(reviews[0]?.total ?? 0),
    };

    const items: Item[] = [
      ...registrations.map((r) => ({
        id: `reg-${r.id}`,
        kind: "registration" as const,
        title: `${r.name || "New applicant"} applied`,
        detail: r.detail || "Course enquiry",
        tab: "registrations" as const,
        createdAt: iso(r.created_at),
      })),
      ...demos.map((d) => ({
        id: `demo-${d.id}`,
        kind: "demo" as const,
        title: `${d.name || "A visitor"} booked a demo`,
        detail: d.detail || "Demo class request",
        tab: "demo" as const,
        createdAt: iso(d.created_at),
      })),
      ...comments.map((c) => ({
        id: `comment-${c.id}`,
        kind: "comment" as const,
        title: `${c.name} commented`,
        detail: c.detail || "Journal post",
        tab: "blog" as const,
        createdAt: iso(c.created_at),
      })),
      ...feedback.map((f) => ({
        id: `feedback-${f.id}`,
        kind: "feedback" as const,
        title: `${f.name} sent feedback`,
        detail: f.detail || "General feedback",
        tab: "feedback" as const,
        createdAt: iso(f.created_at),
      })),
      ...reviews.map((r) => ({
        id: `review-${r.id}`,
        kind: "review" as const,
        title: `${r.name} shared a review`,
        detail: r.detail || "Student review",
        tab: "student-reviews" as const,
        createdAt: iso(r.created_at),
      })),
    ]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 10);

    return NextResponse.json({
      total:
        counts.registrations +
        counts.demos +
        counts.comments +
        counts.feedback +
        counts.studentReviews,
      counts,
      items,
    });
  } catch {
    return NextResponse.json({ total: 0, counts: {}, items: [] });
  }
}
