/**
 * Runs once per server instance before it serves traffic, so the PostgreSQL
 * schema and first-boot seed are ready ahead of the first request instead of on
 * the hot path. A failure here is deferred to the first request (getDb retries);
 * it is never fatal.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { getDb } = await import("@/lib/server/pg");
    await getDb();
    console.log("[instrumentation] PostgreSQL schema + seed ready");
  } catch (err) {
    console.error(
      "[instrumentation] database init deferred to first request:",
      err instanceof Error ? err.message : err
    );
  }
}

/**
 * Server-side error hook (Next 15.3+/16): every unhandled error thrown while a
 * route renders or a handler runs lands here, so it can be persisted and pushed
 * to the alert webhook. Edge-safe: node-only.
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
