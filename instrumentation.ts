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
  } catch (err) {
    console.error(
      "[instrumentation] DB init deferred to first request:",
      err instanceof Error ? err.message : err
    );
  }
}