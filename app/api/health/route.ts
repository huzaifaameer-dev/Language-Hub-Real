import { NextResponse } from "next/server";

import { one } from "@/lib/server/pg";

export const dynamic = "force-dynamic";

/** Liveness + database probe for uptime monitors and Vercel checks. */
export async function GET() {
  let dbUp = false;
  try {
    // Cold starts (schema bootstrap on a fresh database, Neon compute resume)
    // can take a few seconds; a 2s cutoff reported a false "down" on the very
    // first request, so allow the driver's own 8s connect timeout to win.
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 10_000)
    );
    const ping = one<{ ok: number }>("SELECT 1::INT AS ok");
    const row = await Promise.race([ping, timeout]);
    dbUp = row?.ok === 1;
  } catch {
    dbUp = false;
  }

  return NextResponse.json(
    // Deliberately minimal: a public probe only needs liveness, not build,
    // host or uptime fingerprinting detail.
    { status: dbUp ? "ok" : "degraded", db: dbUp ? "up" : "down" },
    { status: dbUp ? 200 : 503 }
  );
}
