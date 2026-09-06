import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getDb } from "@/lib/db";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";
import { notifyAdmins } from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_KINDS = ["XSS", "SQLI", "NOSQLI", "PATH_TRAVERSAL", "RECON", "HONEYPOT"] as const;

/**
 * POST — internal shield sink. The edge proxy fire-and-forgets attack events
 * here (guarded by a shared token) so they are persisted + surface to admins.
 * GET  — admin view of recent shield events.
 */
export async function POST(request: Request) {
  const token = process.env.SHIELD_TOKEN || process.env.AUTH_SECRET || "";
  const header = request.headers.get("x-shield-token") ?? "";
  if (!token || header !== token) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const rl = await rateLimitDb(await clientKey(request, "shield-event"), 500, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ ok: true }, { status: 429 });

  const body = (await request.json().catch(() => null)) as {
    kind?: string;
    path?: string;
    key?: string;
    blockedUntil?: number;
  } | null;
  if (!body || !ALLOWED_KINDS.includes(body.kind as (typeof ALLOWED_KINDS)[number])) {
    return NextResponse.json({ ok: true });
  }

  try {
    const db = await getDb();
    await db.collection("attack_events").insertOne({
      key: (body.key ?? "unknown").slice(0, 96),
      kind: body.kind,
      path: (body.path ?? "").slice(0, 500),
      blockedUntil: body.blockedUntil ? new Date(body.blockedUntil) : null,
      createdAt: new Date(),
    });

    // Alert admins at most a few times per client per hour (throttled).
    const alert = await rateLimitDb(`shield-alert:${body.key ?? "unknown"}`, 4, 60 * 60 * 1000);
    if (alert.ok) {
      await notifyAdmins({
        kind: "security",
        title: "Security shield blocked an attack",
        message: `${body.kind} — ${(body.path ?? "").slice(0, 120)}${body.blockedUntil ? " · client blocked" : ""}`,
        href: "/admin-panel",
      });
    }
  } catch {
    // Event persistence is best-effort; blocking already happened at the edge.
  }

  return NextResponse.json({ ok: true });
}

/** GET — recent shield events (admin). */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const db = await getDb();
  const events = await db
    .collection("attack_events")
    .find({})
    .sort({ createdAt: -1 })
    .limit(40)
    .toArray();

  return NextResponse.json({
    events: events.map((e) => ({
      id: String(e._id),
      key: e.key,
      kind: e.kind,
      path: e.path,
      blockedUntil: e.blockedUntil?.toISOString() ?? null,
      createdAt: e.createdAt.toISOString(),
    })),
    total: await db.collection("attack_events").countDocuments({}),
  });
}