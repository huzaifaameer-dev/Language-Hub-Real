/**
 * Runs once per server instance before it starts serving, so indexes and the
 * seed data are ready ahead of the first request instead of on the hot path.
 * Errors here are deferred to the first request (ensureInit retries), never
 * fatal. Edge runtimes must not touch the Mongo layer.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { ensureInit } = await import("@/lib/db");
    await ensureInit();
    console.log("[instrumentation] DB indexes + seeds verified at startup");

    // Self-hosted email automation tick. When no external cron is available,
    // run the automation engine on an in-process interval. This is a
    // best-effort safety net; a real cron (Vercel Cron / GitHub Actions) is the
    // recommended production path so emails survive instance restarts.
    if (process.env.ENABLE_AUTOMATION_INTERVAL === "true") {
      const intervalMs = Number(process.env.AUTOMATION_INTERVAL_MS ?? 30 * 60 * 1000);
      const baseUrl =
        process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000";
      const secret = process.env.AUTOMATION_SECRET ?? "";

      const tick = async () => {
        try {
          const url = secret
            ? `${baseUrl.replace(/\/+$/, "")}/api/automations?secret=${encodeURIComponent(secret)}`
            : `${baseUrl.replace(/\/+$/, "")}/api/automations`;
          await fetch(url, { cache: "no-store" });
        } catch (err) {
          console.error("[automations] tick failed:", err instanceof Error ? err.message : err);
        }
      };

      // Fire shortly after boot, then on the configured interval.
      setTimeout(tick, 1000 * 20);
      setInterval(tick, intervalMs);
      console.log(`[automations] in-process cron enabled (every ${Math.round(intervalMs / 60000)}m)`);
    }

    // ---- Autonomous AI admin: ALWAYS ON while the server runs ----
    // The agent behaves like a human worker: it watches the business queues
    // (applications, enrollments, payment proofs, demo bookings, blog) and
    // clears them continuously — no manual "Run" needed. Set
    // AI_AGENT_ENABLED=0 to pause, or AI_AGENT_INTERVAL_MS to tune the cadence.
    const agentMs = Number(process.env.AI_AGENT_INTERVAL_MS ?? 10 * 60 * 1000);
    const agentTick = async () => {
      try {
        const { runAgentRound } = await import("@/lib/ai/agent/engine");
        const r = await runAgentRound(25);
        if (r.disabled) return;
        if (r.processed > 0 || r.failed > 0) {
          console.log(
            `[ai-agent] round: ${r.processed} job(s) → ${r.ok} done · ${r.held} clarify · ${r.skipped} skipped · ${r.failed} failed`
          );
        }
      } catch (err) {
        console.error("[ai-agent] tick failed:", err instanceof Error ? err.message : err);
      }
    };
    setTimeout(agentTick, 1000 * 15);
    setInterval(agentTick, agentMs);
    console.log(`[ai-agent] autonomous admin running (every ${Math.round(agentMs / 60000)}m)`);
  } catch (err) {
    console.error(
      "[instrumentation] DB init deferred to first request:",
      err instanceof Error ? err.message : err
    );
  }
}

/**
 * Server-side error hook (Next 15.3+/16). Every unhandled error thrown while a
 * route renders or a handler runs lands here, so we can persist it and page the
 * alert webhook instead of only logging to the console. Edge-safe: node-only.
 */
export async function onRequestError(
  err: unknown,
  request: { method?: string; url?: string } | undefined,
  context?: {
    routePath?: string;
    routeType?: string;
    routerKind?: string;
    revalidateReason?: string;
  }
): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { reportError } = await import("@/lib/reporting");
  const route = context?.routePath ?? request?.url ?? "unknown-route";
  const method = (request?.method ?? "").toUpperCase();

  await reportError({
    level: "error",
    scope: "server",
    message: (err instanceof Error ? err.message : String(err ?? "Server error")).slice(0, 2000),
    stack: err instanceof Error ? (err.stack?.slice(0, 8000) ?? null) : null,
    url: route,
    tag: context?.routeType ?? "route",
    detail: method ? `${method} ${route}` : route,
  });
}