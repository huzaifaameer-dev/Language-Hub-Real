import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-guard";
import { listLeads } from "@/lib/server/admin";

export const dynamic = "force-dynamic";

/** Placement-test leads captured on the public site. */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const rows = await listLeads(200);
  return NextResponse.json({
    total: rows.length,
    leads: rows.map((l) => ({
      id: l.id,
      name: l.name,
      email: l.email,
      score: l.score,
      total: l.total,
      level: l.level,
      recommendedCourse: l.recommended_course,
      createdAt: new Date(l.created_at).toISOString(),
    })),
  });
}
