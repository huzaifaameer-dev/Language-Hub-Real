import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";
import { answerAdminQuery } from "@/lib/growth/nl-query";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST — answer a plain-English admin question with real metrics. */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const rl = await rateLimitDb(await clientKey(request, "nl-query"), 30, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ message: "Too many requests." }, { status: 429 });

  const body = (await request.json().catch(() => ({}))) as { query?: unknown; days?: unknown };
  const query = String(body.query ?? "").trim().slice(0, 500);
  if (!query) return NextResponse.json({ message: "Ask a question." }, { status: 400 });

  const days = typeof body.days === "number" && body.days >= 1 && body.days <= 90 ? body.days : 7;

  try {
    const result = await answerAdminQuery(query, days);
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ message: "Could not answer the question. Try again." }, { status: 500 });
  }
}