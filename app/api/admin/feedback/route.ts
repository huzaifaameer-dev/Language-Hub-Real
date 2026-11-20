import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-guard";
import { listFeedback } from "@/lib/server/learner";
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
    listFeedback({ status, limit, offset: (page - 1) * limit }),
    q<{ status: string; n: number }>(
      "SELECT status, COUNT(*)::INT AS n FROM feedback GROUP BY status"
    ),
  ]);

  const byStatus: Record<string, number> = { ALL: 0, NEW: 0, REVIEWED: 0, ARCHIVED: 0 };
  for (const c of counts) {
    byStatus[c.status] = Number(c.n);
    byStatus.ALL += Number(c.n);
  }

  return NextResponse.json({
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    counts: byStatus,
    feedback: rows.map((f) => ({
      id: f.id,
      userId: f.user_id,
      name: f.name,
      email: f.email,
      category: f.category,
      rating: Number(f.rating),
      subject: f.subject,
      message: f.message,
      contactOk: Boolean(f.contact_ok),
      status: f.status,
      createdAt: new Date(f.created_at).toISOString(),
    })),
  });
}
