import { NextResponse } from "next/server";

import { referralByCode } from "@/lib/server/users";
import { one } from "@/lib/server/pg";
import { clientKey, rateLimitDb } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Public: validate a referral code before signup. If an email is supplied, a
 * code already redeemed for that address is reported as used.
 */
export async function POST(request: Request) {
  // Codes are short, so an unlimited endpoint would let a script enumerate
  // every live referral. Bound the guesses per client.
  const rl = await rateLimitDb(await clientKey(request, "referral-redeem"), 20, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { message: "Too many attempts. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } }
    );
  }

  const body = (await request.json().catch(() => null)) as {
    code?: string;
    email?: string;
  } | null;

  const code = (body?.code ?? "").trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ message: "Enter a referral code." }, { status: 400 });
  }

  const referral = await referralByCode(code);
  if (!referral) {
    return NextResponse.json(
      { message: "That referral code isn't valid." },
      { status: 404 }
    );
  }

  const email = (body?.email ?? "").trim().toLowerCase();
  if (email) {
    const existing = await one<{ id: string }>(
      `SELECT rr.id
         FROM referral_redemptions rr
         JOIN users u ON u.id = rr.used_by_user_id
        WHERE rr.referral_id = $1 AND LOWER(u.email) = $2
        LIMIT 1`,
      [referral.id, email]
    );
    if (existing) {
      return NextResponse.json(
        { message: "This referral code was already used for that email." },
        { status: 409 }
      );
    }
  }

  return NextResponse.json({
    valid: true,
    code: referral.code,
    discountPercent: referral.discount_percent,
  });
}
