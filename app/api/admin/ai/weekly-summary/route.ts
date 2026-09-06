import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-guard";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";
import { runWeeklySummary } from "@/lib/ai/weekly";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST — runs the weekly "teacher assistant" agent: the model uses function
 * calling to pull real enrollment/revenue/lead/engagement data, writes the
 * performance summary, and the report is persisted. Admin-only.
 */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const rl = await rateLimitDb(await clientKey(request, "weekly-summary"), 6, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ message: "Too many requests." }, { status: 429 });
  }

  let days = 7;
  try {
    const body = (await request.json()) as { days?: unknown };
    if (typeof body.days === "number" && body.days >= 1 && body.days <= 30) {
      days = body.days;
    }
  } catch {
    // default 7 days
  }

  try {
    const report = await runWeeklySummary(days, admin.email ?? admin.id);
    return NextResponse.json({ report });
  } catch {
    return NextResponse.json(
      { message: "Could not generate the weekly report. Try again." },
      { status: 500 }
    );
  }
}