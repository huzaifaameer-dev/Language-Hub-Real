import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-guard";
import { q, one } from "@/lib/server/pg";
import { newId } from "@/lib/server/id";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";
import { notifyAdmins } from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_KINDS = [
  "XSS",
  "SQLI",
  "NOSQLI",
  "PATH_TRAVERSAL",
  "RECON",
  "HONEYPOT",
] as const;

type AttackKind = (typeof ALLOWED_KINDS)[number];

/**
 * POST — internal shield sink. The edge proxy fire-and-forgets blocked attack
 * events here (shared token). GET — admin view of recent shield events.
 */
export async function POST(request: Request) {
  const token = process.env.SHIELD_TOKEN || process.env.AUTH_SECRET || "";
  const header = request.headers.get("x-shield-token") ?? "";
  if (!token || header !== token) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const rl = await rateLimitDb(
    await clientKey(request, "shield-event"),
    500,
    60 * 60 * 1000
  );
  if (!rl.ok) return NextResponse.json({ ok: true }, { status: 429 });

  const body = (await request.json().catch(() => null)) as {
    kind?: string;
    path?: string;
    key?: string;
    blockedUntil?: number;
  } | null;

  if (!body || !ALLOWED_KINDS.includes(body.kind as AttackKind)) {
    return NextResponse.json({ ok: true });
  }

  try {
    const key = (body.key ?? "unknown").slice(0, 96);
    await q(
      `INSERT INTO attack_events (id, key, kind, path, blocked_until)
       VALUES ($1,$2,$3,$4,$5)`,
      [
        newId(),
        key,
        body.kind,
        (body.path ?? "").slice(0, 500),
        body.blockedUntil ? new Date(body.blockedUntil).toISOString() : null,
      ]
    );

    // Alert admins at most a few times per client per hour (throttled).
    const alert = await rateLimitDb(`shield-alert:${key}`, 4, 60 * 60 * 1000);
    if (alert.ok) {
      await notifyAdmins({
        kind: "security",
        title: "Security shield blocked an attack",
        message: `${body.kind} — ${(body.path ?? "").slice(0, 120)}${body.blockedUntil ? " · client blocked" : ""}`,
        href: "/admin-panel?tab=security",
      });
    }
  } catch {
    // Persistence is best-effort; the block already happened at the edge.
  }

  return NextResponse.json({ ok: true });
}

/** GET — recent shield events (admin only). */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const [events, total] = await Promise.all([
    q<{
      id: string;
      key: string;
      kind: string;
      path: string;
      blocked_until: string | Date | null;
      created_at: string | Date;
    }>(
      `SELECT id, key, kind, path, blocked_until, created_at
         FROM attack_events ORDER BY created_at DESC LIMIT 40`
    ),
    one<{ n: number }>("SELECT COUNT(*)::INT AS n FROM attack_events"),
  ]);

  return NextResponse.json({
    events: events.map((e) => ({
      id: e.id,
      key: e.key,
      kind: e.kind,
      path: e.path,
      blockedUntil: e.blocked_until ? new Date(e.blocked_until).toISOString() : null,
      createdAt: new Date(e.created_at).toISOString(),
    })),
    total: total?.n ?? 0,
  });
}
