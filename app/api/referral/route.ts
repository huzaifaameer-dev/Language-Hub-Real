import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getReferralForUser } from "@/lib/server/users";
import { appBaseUrl } from "@/lib/base-url";

export const dynamic = "force-dynamic";

/**
 * GET: the signed-in learner's referral code (created on first read) plus a
 * ready-to-share link. POST: acknowledge a share (funnel tracking).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  const referral = await getReferralForUser(session.user.id);
  if (!referral) {
    return NextResponse.json({ message: "Session expired." }, { status: 401 });
  }

  const shareUrl = `${appBaseUrl()}/signup?ref=${referral.code}`;

  return NextResponse.json({
    code: referral.code,
    discountPercent: referral.discount_percent,
    redemptions: referral.redemptions,
    shareUrl,
    shareText: `Join me at Language Hub and get ${referral.discount_percent}% off! Use my code: ${referral.code} — ${shareUrl}`,
  });
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }
  await getReferralForUser(session.user.id);
  return NextResponse.json({ ok: true });
}
