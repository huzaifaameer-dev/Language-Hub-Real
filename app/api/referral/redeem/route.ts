import { NextResponse } from "next/server";

import {
  getReferralsCollection,
  getReferralRedeemsCollection,
} from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Public: validate a referral discount code before/at signup.
 * Body: { code, email? }
 * Returns the discount if valid, or an error if unknown/duplicate per email.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    code?: string;
    email?: string;
  } | null;
  const code = (body?.code ?? "").trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ message: "Enter a referral code." }, { status: 400 });
  }

  const referrals = await getReferralsCollection();
  const referral = await referrals.findOne({ code });
  if (!referral) {
    return NextResponse.json({ message: "That referral code isn't valid." }, { status: 404 });
  }

  // If an email was supplied, prevent the same person redeeming repeatedly.
  const email = (body?.email ?? "").trim().toLowerCase();
  if (email) {
    const redeems = await getReferralRedeemsCollection();
    const existing = await redeems.findOne({ referralCode: code, redeemedByEmail: email });
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
    discountPercent: referral.discountPercent,
  });
}
