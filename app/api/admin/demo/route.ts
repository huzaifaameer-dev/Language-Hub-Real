import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-guard";
import { listDemoBookings } from "@/lib/server/learner";
import { q } from "@/lib/server/pg";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "ALL";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
  const limit = 20;

  const [{ rows, total }, counts] = await Promise.all([
    listDemoBookings({ status, limit, offset: (page - 1) * limit }),
    q<{ status: string; n: number }>(
      "SELECT status, COUNT(*)::INT AS n FROM demo_bookings GROUP BY status"
    ),
  ]);

  const byStatus: Record<string, number> = { ALL: 0 };
  for (const c of counts) {
    byStatus[c.status] = Number(c.n);
    byStatus.ALL += Number(c.n);
  }

  return NextResponse.json({
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    counts: byStatus,
    bookings: rows.map((b) => ({
      id: b.id,
      name: b.name,
      email: b.email,
      phone: b.phone,
      course: b.course_slug,
      preferredDate: b.preferred_date,
      preferredTime: b.preferred_time,
      message: b.message,
      status: b.status,
      createdAt: new Date(b.created_at).toISOString(),
    })),
  });
}
