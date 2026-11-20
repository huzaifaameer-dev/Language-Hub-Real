import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import {
  clearAdminCookie,
  getAdminSession,
  setAdminCookie,
} from "@/lib/admin-session";
import { findUserByEmail } from "@/lib/server/users";
import { audit } from "@/lib/server/admin";
import { safeEqual, sha256 } from "@/lib/server/id";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";
import { requireAdmin } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LoginSchema = z.object({
  email: z.email("Enter a valid email.").max(160),
  password: z.string().min(1, "Password is required.").max(200),
  accessCode: z.string().max(200).optional(),
});

/** Current admin session (used by the panel's client shell). */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ admin: null });
  return NextResponse.json({
    admin: { id: admin.id, email: admin.email, name: admin.name },
  });
}

/**
 * Admin sign-in: PostgreSQL role check + bcrypt password. When
 * ADMIN_ACCESS_CODE is configured it is required as a second factor. Every
 * attempt is rate limited per email and per client.
 */
export async function POST(request: Request) {
  const key = await clientKey(request, "admin-login");
  const rl = await rateLimitDb(key, 8, 15 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { message: `Too many attempts. Try again in ${rl.retryAfter ?? 60}s.` },
      { status: 429 }
    );
  }

  const parsed = LoginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Enter your email and password." },
      { status: 400 }
    );
  }

  const email = parsed.data.email.trim().toLowerCase();

  // Second, global bucket keyed by the account itself. The per-client limit
  // above stops one machine; this one stops a distributed password spray
  // across many IPs against the single admin address.
  const accountLimit = await rateLimitDb(
    `admin-login-account:${email}`,
    6,
    15 * 60 * 1000
  );
  if (!accountLimit.ok) {
    return NextResponse.json(
      { message: `Too many attempts. Try again in ${accountLimit.retryAfter ?? 60}s.` },
      { status: 429 }
    );
  }

  const user = await findUserByEmail(email);

  // Constant-ish work whether or not the account exists.
  const hash = user?.password_hash || "$2b$12$E/ImNZ3EGaUXzeLfM/jW8e3xTtchnWHhDKHYxkDfaGphYKHeg92My";
  const passwordOk = await bcrypt.compare(parsed.data.password, hash);

  if (!user || !passwordOk || user.role !== "ADMIN" || user.disabled) {
    await audit({
      actorEmail: email,
      action: "admin.login_failed",
      ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    });
    return NextResponse.json(
      { message: "Invalid credentials or this account is not an administrator." },
      { status: 401 }
    );
  }

  const requiredCode = (process.env.ADMIN_ACCESS_CODE ?? "").trim();
  if (requiredCode) {
    const supplied = (parsed.data.accessCode ?? "").trim();
    // Compare fixed-length digests so the response time never depends on the
    // supplied code's length (timingSafeEqual needs equal-length buffers).
    if (
      !supplied ||
      !safeEqual(sha256(supplied), sha256(requiredCode))
    ) {
      await audit({
        actorId: user.id,
        actorEmail: email,
        action: "admin.access_code_failed",
        ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      });
      return NextResponse.json({ message: "Invalid access code." }, { status: 401 });
    }
  }

  await audit({
    actorId: user.id,
    actorEmail: user.email,
    action: "admin.login",
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
  });

  const res = NextResponse.json({
    ok: true,
    admin: { id: user.id, email: user.email, name: user.name },
    requiresAccessCode: Boolean(requiredCode),
  });
  return setAdminCookie(res, user.email, Number(user.token_version ?? 0));
}

/** Sign out of the control suite only (the learner session is untouched). */
export async function DELETE() {
  const session = await getAdminSession();
  if (session?.email) {
    await audit({ actorEmail: session.email, action: "admin.logout" });
  }
  return clearAdminCookie(NextResponse.json({ ok: true }));
}
