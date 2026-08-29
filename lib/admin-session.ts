import crypto from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export const ADMIN_COOKIE = "hub_admin_token";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret(): Buffer {
  const value =
    process.env.NEXTAUTH_SECRET ??
    process.env.AUTH_SECRET ??
    "language-hub-dev-admin-secret";
  return Buffer.from(value);
}

const b64url = (data: Uint8Array) => Buffer.from(data).toString("base64url");

interface AdminTokenPayload {
  email: string;
  role: "ADMIN";
  iat: number;
  exp: number;
}

export function signAdminToken(email: string): string {
  const payload = b64url(
    Buffer.from(
      JSON.stringify({
        email,
        role: "ADMIN",
        iat: Date.now(),
        exp: Date.now() + MAX_AGE * 1000,
      } satisfies AdminTokenPayload)
    )
  );
  const signature = b64url(
    crypto.createHmac("sha256", secret()).update(payload).digest()
  );
  return `${payload}.${signature}`;
}

export function verifyAdminToken(
  token: string | undefined
): { email: string } | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = crypto.createHmac("sha256", secret()).update(payload).digest();
  const received = Buffer.from(signature, "base64url");
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    return null;
  }

  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as AdminTokenPayload;
    if (data.role === "ADMIN" && data.exp > Date.now() && data.email) {
      return { email: data.email };
    }
  } catch {
    // invalid payload
  }
  return null;
}

export async function getAdminSession(): Promise<{ email: string } | null> {
  const store = await cookies();
  return verifyAdminToken(store.get(ADMIN_COOKIE)?.value);
}

export function setAdminCookie(res: NextResponse, email: string): NextResponse {
  res.cookies.set(ADMIN_COOKIE, signAdminToken(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
  return res;
}

export function clearAdminCookie(res: NextResponse): NextResponse {
  res.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}