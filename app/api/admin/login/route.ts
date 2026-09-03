import { NextResponse } from "next/server";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { ensureIndexesAndAdmin, getDb } from "@/lib/db";
import { setAdminCookie } from "@/lib/admin-session";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";

const LoginBody = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
  accessCode: z.string().min(1).max(100),
});

const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

// Same-shape bcrypt hash used when the email has no admin account, so the
// verification below still runs a bcrypt round (timing equalization —
// attackers cannot tell "no account" from "wrong password").
const DUMMY_PASSWORD_HASH = "$2b$12$CbtOjVWLrcVQn7uzBxYyBOMOo2g.2rW0baLiNMjJZXdneII6wlz.i";

// Constant-time comparison so the access code cannot be fingerprinted by
// timing side-channels (the plain `===` is not constant-time).
function timingSafeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

/** Generic failure response — identical shape in every failure branch so no
 *  caller can distinguish "no such admin", "wrong password", or "locked". */
function invalidCredentials(): NextResponse {
  return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
}

export async function POST(request: Request) {
  await ensureIndexesAndAdmin();

  // Per-client throttle in addition to the per-account lockout: even if the
  // attacker rotates emails, a single client cannot hammer this endpoint.
  const rl = await rateLimitDb(await clientKey(request, "admin-login"), 10, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { message: "Too many attempts. Try again shortly." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const parsed = LoginBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Validation failed." }, { status: 400 });
  }

  const { email, password, accessCode } = parsed.data;

  const db = await getDb();
  const users = db.collection("users");
  const user = await users.findOne({ email: email.toLowerCase() });

  // Unknown email, non-admin, or missing hash: still pay a bcrypt cost so the
  // timing signature is identical to a real admin credential check.
  if (!user?.password || (user.role as string) !== "ADMIN") {
    await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
    return invalidCredentials();
  }

  const locks = user as unknown as {
    _id: import("mongodb").ObjectId;
    failedAttempts?: number;
    lockUntil?: number | null;
  };

  if (locks.lockUntil && locks.lockUntil > Date.now()) {
    // Same generic body — never disclose lock state or that this account exists.
    await bcrypt.compare(password, user.password as string);
    return invalidCredentials();
  }

  const passwordOk = await bcrypt.compare(password, user.password as string);
  // Fail closed: when ADMIN_ACCESS_CODE is not configured the login must not
  // silently pass with an empty/arbitrary code.
  const secret = process.env.ADMIN_ACCESS_CODE;
  const codeOk = !!secret && timingSafeEqual(accessCode, secret);

  if (!passwordOk || !codeOk) {
    const failed = (locks.failedAttempts ?? 0) + 1;
    await users.updateOne(
      { _id: locks._id },
      {
        $set: {
          failedAttempts: failed,
          lockUntil: failed >= MAX_ATTEMPTS ? Date.now() + LOCK_MS : null,
        },
      }
    );
    return invalidCredentials();
  }

  await users.updateOne(
    { _id: locks._id },
    { $set: { failedAttempts: 0, lockUntil: null } }
  );

  return setAdminCookie(NextResponse.json({ ok: true }), (user.email as string).toLowerCase());
}