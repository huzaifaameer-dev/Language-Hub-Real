import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { auth } from "@/auth";
import {
  getReferralsCollection,
  getUsersCollection,
  generateReferralCode,
} from "@/lib/db";
import { appBaseUrl } from "@/lib/base-url";

export const dynamic = "force-dynamic";

/**
 * GET:  Return the signed-in user's referral code (creating one if needed).
 * POST: Acknowledge a share (best-effort funnel tracking).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  const referrals = await getReferralsCollection();
  let referral = await referrals.findOne({ userId: session.user.id });

  if (!referral) {
    let name: string | undefined;
    if (ObjectId.isValid(session.user.id)) {
      const users = await getUsersCollection();
      const user = await users.findOne({ _id: new ObjectId(session.user.id) });
      name = (user && (user as { name?: string }).name) || undefined;
    }
    const code = generateReferralCode(session.user.id, name);
    const now = new Date();
    await referrals
      .insertOne({
        userId: session.user.id,
        code,
        discountPercent: 10,
        redemptions: 0,
        createdAt: now,
      })
      .catch(() => {}); // unique-index race — re-read below
    referral = (await referrals.findOne({ userId: session.user.id })) ?? {
      _id: undefined,
      userId: session.user.id,
      code,
      discountPercent: 10,
      redemptions: 0,
      createdAt: now,
    } as NonNullable<typeof referral>;
  }

  const baseUrl = appBaseUrl();
  const shareUrl = `${baseUrl}/signup?ref=${referral!.code}`;

  return NextResponse.json({
    code: referral!.code,
    discountPercent: referral!.discountPercent,
    redemptions: referral!.redemptions,
    shareUrl,
    shareText: `Join me at Language Hub and get 10% off! Use my code: ${referral!.code} → ${shareUrl}`,
  });
}

/** POST: acknowledge a share (best-effort). */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }
  const referrals = await getReferralsCollection();
  await referrals.findOne({ userId: session.user.id });
  return NextResponse.json({ ok: true });
}
