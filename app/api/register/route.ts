import { NextResponse, after } from "next/server";
import bcrypt from "bcryptjs";

import { RegisterSchema, fieldErrors } from "@/lib/validate";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";
import { sendWelcomeEmail } from "@/lib/email";
import { botGuardError } from "@/lib/bot-check";
import {
  createUser,
  findUserByEmail,
  issueToken,
  redeemReferral,
} from "@/lib/server/users";

/**
 * Creates a learner account in PostgreSQL.
 *
 * Anti-enumeration: an address that already exists gets exactly the same
 * 200 response as a fresh signup — no account is created, no token is issued
 * and no email is sent, so a caller cannot confirm which emails are registered.
 */
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

  const bot = botGuardError(body);
  if (bot) {
    return NextResponse.json({ message: bot }, { status: 400 });
  }

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: fieldErrors(parsed) },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;
  const normalized = email.trim().toLowerCase();
  const referralCode =
    typeof (body as { referralCode?: unknown })?.referralCode === "string"
      ? String((body as { referralCode?: unknown }).referralCode).trim().toUpperCase()
      : "";

  if (await findUserByEmail(normalized)) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  let created;
  try {
    created = await createUser({
      name,
      email: normalized,
      passwordHash,
      phone:
        typeof parsed.data.phone === "string" && parsed.data.phone
          ? parsed.data.phone.trim()
          : null,
    });
  } catch {
    // Two concurrent signups for the same address: the unique index rejects the
    // legitimate loser. Respond exactly like the happy path.
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // Referral redemption is advisory — never block signup on it.
  if (referralCode) {
    void redeemReferral(referralCode, created.id).catch(() => {});
  }

  // Optional email verification (24h). It never gates sign-in.
  const verifyToken = await issueToken(created.id, "VERIFY_EMAIL", 24 * 60);

  after(async () => {
    await sendWelcomeEmail({ to: normalized, name: created.name, verifyToken });
  });

  // With no SMTP configured locally, hand back a usable link so the flow
  // stays testable without a mail server.
  const devVerifyLink =
    process.env.NODE_ENV !== "production" && !process.env.SMTP_HOST
      ? `/verify-email?token=${verifyToken}`
      : null;

  return NextResponse.json(
    { id: created.id, ok: true, devVerifyLink },
    { status: 201 }
  );
}
