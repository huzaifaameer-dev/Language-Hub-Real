import { NextRequest, NextResponse } from "next/server";
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
// Every request flows through here. Attack probes are answered and burned
// immediately; repeat offenders get tarpitted. Auth is deliberately NOT decoded
// in middleware — dashboard/login/signup guard themselves server-side, so the
// middleware never depends on process env (which Turbopack-dev does not expose
// to middleware), eliminating "/login 307" loops and session-mismatch weirdness.
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

  // Auth is enforced by the pages themselves (dashboard/login/signup). Here we
  // only anchor anonymous rate limits with the identity cookie.
  const res = NextResponse.next();
  await ensureClientCookie(req, res);
  return res;
}

/** Fire-and-forget: persist an attack event + alert admins (server-side). */
async function logShieldEvent(kind: ThreatKind, path: string, key: string, blockedUntil?: number): Promise<void> {
  const token = process.env.SHIELD_TOKEN || process.env.AUTH_SECRET || "";
  const origin = process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000";
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