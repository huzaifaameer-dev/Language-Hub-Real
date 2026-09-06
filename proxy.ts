import { NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import { verifyClientId, newClientId, CLIENT_COOKIE_NAME } from "@/lib/client-id";
import {
  classifyThreat,
  shieldClientKey,
  strikeLimit,
  blockWindowMs,
  isBlocked,
  STOPPED,
  type ThreatKind,
} from "@/lib/security/shield";

// Edge-safe auth wrapper: decodes the JWT session cookie only.
const { auth } = NextAuth({ ...authConfig, trustHost: true });

const CLIENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** Mint the signed per-client identity cookie when absent/invalid. */
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

/* ===================== Fortress shield (edge, in-memory) ===================== */
// The shield front-ends EVERY request. Threats get an immediate, generic
// response (the attacker never reaches the real handler), a strike is
// registered, and repeated strikes escalate into a temporary block (tarpit).
// Events are fire-and-forget POSTed to /api/security/event for persistence +
// admin alerting. State lives on the runtime instance (globalThis), so blocks
// are instant; the /api/ratelimits + attack_events DB layer is the persistent
// backstop for restarts.
type ShieldState = { strikes: Map<string, { count: number; until: number }> };
const shieldGlobal = globalThis as unknown as { __lhShield?: ShieldState };
function shieldState(): ShieldState {
  if (!shieldGlobal.__lhShield) shieldGlobal.__lhShield = { strikes: new Map() };
  return shieldGlobal.__lhShield;
}

export default async function middleware(req: NextRequest): Promise<NextResponse> {
  const path = req.nextUrl.pathname;
  const query = req.nextUrl.searchParams.toString();

  /* ---------- Shield: classify + strike + block ---------- */
  const threat = classifyThreat({ path, query });
  if (threat) {
    const key = shieldClientKey({
      "x-forwarded-for": req.headers.get("x-forwarded-for"),
      "user-agent": req.headers.get("user-agent"),
    });
    const state = shieldState();
    const rec = state.strikes.get(key) ?? { count: 0, until: 0 };
    rec.count += 1;
    if (isBlocked(rec.count, rec.until, Date.now())) {
      // Already blocked → tarpit: generic 429, keep striking count capped.
      return NextResponse.json(
        { ok: false, message: "Too many requests." },
        { status: 429, headers: { "Retry-After": "300" } }
      );
    }
    if (rec.count >= strikeLimit()) {
      rec.until = Date.now() + blockWindowMs(rec.count);
    }
    state.strikes.set(key, rec);
    void logShieldEvent(threat, path, key, rec.until || undefined);

    const status = threat === "HONEYPOT" ? 403 : 400;
    return NextResponse.json(
      { ok: false, message: STOPPED[threat] },
      { status, headers: { "X-Shield": "true" } }
    );
  }

  /* ---------- Auth: never run Auth.js on its own routes (session 404 fix) ---------- */
  const isAuthApi = path.startsWith("/api/auth");
  let isAuthed = false;
  if (!isAuthApi) {
    // v5 auth() accepts a web Request and resolves the JWT session.
    const session = await (auth as unknown as (r: NextRequest) => Promise<{ user?: unknown } | null>)(
      req
    ).catch(() => null);
    isAuthed = !!session?.user;
  }

  let res: NextResponse;
  if (path.startsWith("/login") || path.startsWith("/signup")) {
    res = isAuthed
      ? NextResponse.redirect(new URL("/dashboard", req.nextUrl))
      : NextResponse.next();
  } else if (path.startsWith("/dashboard")) {
    res = isAuthed ? NextResponse.next() : NextResponse.redirect(new URL("/login", req.nextUrl));
  } else {
    res = NextResponse.next();
  }

  await ensureClientCookie(req, res);
  return res;
}

/** Fire-and-forget: persist an attack event + alert admins (server-side). */
async function logShieldEvent(kind: ThreatKind, path: string, key: string, blockedUntil?: number): Promise<void> {
  const token = process.env.SHIELD_TOKEN || process.env.AUTH_SECRET || "";
  const origin =
    process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000";
  void fetch(`${origin.replace(/\/+$/, "")}/api/security/event`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-shield-token": token },
    body: JSON.stringify({ kind, path: path.slice(0, 500), key: key.slice(0, 96), blockedUntil }),
  })
    .then(() => {})
    .catch(() => {});
}

export const config = {
  // Fortress front gate: every route except static assets flows through here.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|apple-icon.png|icon.png|icon-192.png|icon-512.png|logo-transparent.png|logo.jpg|manifest.webmanifest|sw.js|robots.txt|sitemap.xml).*)",
  ],
};