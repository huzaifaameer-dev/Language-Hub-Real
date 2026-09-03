import { NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import { verifyClientId, newClientId, CLIENT_COOKIE_NAME } from "@/lib/client-id";

// Edge-safe auth wrapper: decodes the JWT session cookie only.
const { auth } = NextAuth({ ...authConfig, trustHost: true });

const CLIENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** Mint the signed per-client identity cookie when absent/invalid. This anchors
 *  anonymous rate limits (register, forgot, report, demo-bookings, admin login)
 *  so rotating the User-Agent cannot reset the bucket. */
async function ensureClientCookie(req: NextRequest, res: NextResponse): Promise<void> {
  const existing = req.cookies.get(CLIENT_COOKIE_NAME)?.value;
  if (existing && (await verifyClientId(existing))) return;
  const id = await newClientId();
  res.cookies.set(CLIENT_COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: CLIENT_COOKIE_MAX_AGE,
    path: "/",
  });
}

export default auth(async (req) => {
  const session = req.auth;
  const path = req.nextUrl.pathname;

  const isAuthed = !!session?.user;

  let res: NextResponse;

  // Open auth pages only for guests.
  if (path.startsWith("/login") || path.startsWith("/signup")) {
    res = isAuthed
      ? NextResponse.redirect(new URL("/dashboard", req.nextUrl))
      : NextResponse.next();
  } else if (path.startsWith("/dashboard")) {
    // Dashboard is for authenticated users (web clients only).
    // The admin panel is fully decoupled: it has its own session cookie and is
    // open at the edge — the panel page decides gate vs. dashboard server-side.
    res = isAuthed
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/login", req.nextUrl));
  } else {
    res = NextResponse.next();
  }

  await ensureClientCookie(req, res);
  return res;
});

export const config = {
  matcher: [
    "/login/:path*",
    "/signup/:path*",
    "/dashboard/:path*",
    // Anonymous endpoints whose rate limits are keyed on client identity:
    "/api/register/:path*",
    "/api/auth/:path*",
    "/api/report/:path*",
    "/api/demo-bookings/:path*",
    "/api/admin/login/:path*",
  ],
};