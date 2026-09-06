import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-guard";
import { listWeeklyReports } from "@/lib/ai/weekly";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET — recent AI-generated weekly reports (admin panel history). */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  const reports = await listWeeklyReports(12);
  return NextResponse.json({ reports });
}