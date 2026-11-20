import { NextResponse } from "next/server";

import { markHelpful } from "@/lib/pg/reviews";
import { clientKey, rateLimitDb } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/reviews/[slug]/helpful
 *
 * One vote per visitor. The identity comes from the signed client cookie /
 * trusted proxy IP (never a raw, spoofable header), is hashed before storage
 * and is rate limited so the ballot cannot be stuffed by rotating headers.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,80}$/i.test(slug)) {
    return NextResponse.json({ ok: false, error: "Review not found" }, { status: 404 });
  }

  const key = await clientKey(request, "helpful");
  const limit = await rateLimitDb(key, 30, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many votes. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter ?? 60) } }
    );
  }

  try {
    const total = await markHelpful(slug, key);
    if (total === null) {
      return NextResponse.json({ ok: false, error: "Review not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, helpful: total });
  } catch {
    // Never surface driver/SQL detail to the browser.
    return NextResponse.json({ ok: false, error: "Vote failed" }, { status: 500 });
  }
}
