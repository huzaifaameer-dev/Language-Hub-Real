import { NextResponse } from "next/server";
import { z } from "zod";

import { getDb, ensureIndexesAndAdmin, getAuthTokensCollection } from "@/lib/db";
import { sendResetEmail, emailConfigured } from "@/lib/email";
import { generateToken, hashToken } from "@/lib/tokens";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";

const RESET_TTL_MS = 30 * 60 * 1000; // 30 minutes

const ForgotSchema = z.object({
  email: z.email("Enter a valid email address.").max(120).trim(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const parsed = ForgotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: { email: ["Enter a valid email address."] } },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase();
  const rl = await rateLimitDb(await clientKey(request, `forgot:${email}`), 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { message: "Too many requests. Try again in about an hour." },
      { status: 429 }
    );
  }

  const db = await getDb();
  await ensureIndexesAndAdmin();
  const user = await db.collection("users").findOne({ email });

  // Always respond identically whether or not the account exists (no user
  // enumeration): same status and the same body shape. We deliberately do NOT
  // surface `delivered`/`devLink`/HMAC differences that would leak whether the
  // email is registered.
  const genericBody = () =>
    NextResponse.json({
      ok: true,
      smtpConfigured: emailConfigured(),
    });

  if (!user) {
    return genericBody();
  }

  const userId = String(user._id);
  const tokens = await getAuthTokensCollection();
  await tokens.deleteMany({ userId, purpose: "password-reset", usedAt: null });

  const token = generateToken();
  await tokens.insertOne({
    userId,
    token: hashToken(token),
    purpose: "password-reset",
    expiresAt: new Date(Date.now() + RESET_TTL_MS),
    createdAt: new Date(),
    usedAt: null,
  });

  await sendResetEmail({ to: email, name: user.name, token });

  return genericBody();
}