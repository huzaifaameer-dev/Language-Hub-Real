import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { getDb, getAuthTokensCollection, ensureIndexesAndAdmin, getReferralsCollection, getReferralRedeemsCollection } from "@/lib/db";
import { RegisterSchema, fieldErrors } from "@/lib/validate";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";
import { sendWelcomeEmail } from "@/lib/email";
import { generateToken, hashToken } from "@/lib/tokens";

export async function POST(request: Request) {
  const rl = await rateLimitDb(await clientKey(request, "register"), 10, 15 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { message: `Too many attempts. Try again in ${rl.retryAfter}s.` },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: fieldErrors(parsed) },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;
  const normalized = email.toLowerCase();
  const referralCode = (body as { referralCode?: unknown })?.referralCode
    ? String((body as { referralCode?: unknown })?.referralCode).trim().toUpperCase()
    : "";

  const db = await getDb();
  await ensureIndexesAndAdmin();
  const users = db.collection("users");

  const existing = await users.findOne({ email: normalized });
  if (existing) {
    // Anti-enumeration: respond identically to a successful signup so a caller
    // cannot use status codes/bodies to confirm whether an email is registered.
    // No new token, no email — the flow simply looks like "check your inbox".
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const hash = await bcrypt.hash(password, 12);
  let result: import("mongodb").InsertOneResult<Document>;
  try {
    result = await users.insertOne({
      name: name.trim(),
      email: normalized,
      password: hash,
      role: "USER",
      emailVerified: null,
      image: null,
      createdAt: new Date(),
    });
  } catch (err) {
    // The backend enforces a unique index on email. Two concurrent requests for
    // the same address can both pass the findOne guard above; the legitimate
    // loser surfaces here as E11000. Respond like the happy path instead.
    const code = (err as { code?: number })?.code;
    if (code === 11000) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }
    throw err;
  }

  const userId = String(result.insertedId);

  // Record a referral redemption if a valid code was supplied (best-effort).
  if (referralCode) {
    try {
      const referrals = await getReferralsCollection();
      const referral = await referrals.findOne({ code: referralCode });
      if (referral) {
        const redeems = await getReferralRedeemsCollection();
        await redeems.insertOne({
          referralCode: referral.code,
          ownerUserId: String(referral.userId ?? ""),
          redeemedByEmail: normalized,
          redeemedByUserId: userId,
          redeemedAt: new Date(),
        });
        await referrals.updateOne(
          { _id: referral._id },
          { $inc: { redemptions: 1 }, $set: { updatedAt: new Date() } }
        );
      }
    } catch {
      // Referral recording is advisory — never block signup on it.
    }
  }

  // Email-verification token (24h TTL). Verification is optional: it updates
  // emailVerified but does not gate sign-in.
  const verifyToken = generateToken();
  await (await getAuthTokensCollection()).insertOne({
    userId: String(result.insertedId),
    token: hashToken(verifyToken),
    purpose: "email-verify",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    usedAt: null,
  });

  // Fire-and-forget; sendEmail never throws and silently no-ops without SMTP.
  void sendWelcomeEmail({ to: normalized, name, verifyToken }).catch(() => {});

  // In dev without SMTP, return a usable verify link so flows stay testable.
  const devVerifyLink =
    process.env.NODE_ENV !== "production" && !process.env.SMTP_HOST
      ? `/verify-email?token=${verifyToken}`
      : null;

  return NextResponse.json(
    { id: String(result.insertedId), ok: true, devVerifyLink },
    { status: 201 }
  );
}