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
  } catch (err) {
    console.error(
      "[instrumentation] DB init deferred to first request:",
      err instanceof Error ? err.message : err
    );
  }
}