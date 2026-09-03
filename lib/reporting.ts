/**
 * Error reporting.
 *
 * Client errors (window errors / unhandled rejections, via /api/report) plus
 * server errors (route handlers and instrumentation hooks) are persisted to the
 * `errors` Mongo collection for dashboards. When an alert webhook is configured
 * (`ERROR_ALERT_WEBHOOK_URL` — a Discord/Slack/Telegram bot URL), errors are
 * also pushed there so an operator is paged instead of only seeing them later.
 *
 * Never throws: reporting must never take the app down when Mongo or the
 * webhook is unreachable.
 */

export interface ReportErrorInput {
  level: "error" | "warning";
  scope: string;
  message: string;
  stack?: string | null;
  url?: string | null;
  tag?: string | null;
  /** Route/method for server errors, e.g. "POST /api/enrollments". */
  detail?: string | null;
}

/** Persist a captured client/server error to the `errors` collection. */
export async function reportError(input: ReportErrorInput): Promise<void> {
  try {
    const { getDb } = await import("@/lib/db");
    const db = await getDb();
    await db.collection("errors").insertOne({
      ...input,
      createdAt: new Date(),
    });
  } catch {
    // observational only
  }

  // Fire-and-forget the alert webhook (throttled inside).
  void alertForError(input);
}

/* ---------------------------------------------------------------------------
 * Alert webhook
 * ------------------------------------------------------------------------- */

let lastAlert = 0;
let alertBurst = 0;

/**
 * Push an error to the configured alert webhook, throttled so a busy app
 * cannot hammer an external channel. Errors are the most important events, so
 * we page for `error` level only and silently drop `warning` from alerts.
 */
async function alertForError(input: ReportErrorInput): Promise<void> {
  const url = (process.env.ERROR_ALERT_WEBHOOK_URL ?? "").trim();
  if (!url || input.level !== "error") return;

  const now = Date.now();
  if (now - lastAlert < 30_000) {
    alertBurst += 1;
    if (alertBurst > 5) return; // drop during a burst to protect the channel
  } else {
    alertBurst = 0;
  }
  lastAlert = now;

  const host = (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXTAUTH_URL ?? "app")
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");

  const payload = {
    text: `*[Language Hub] ${input.scope} error*\n${input.message.slice(0, 2000)}\n\`${host}\``,
    ...(input.detail ? { detail: input.detail } : {}),
  };

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // don't await long; alerting is best-effort
      signal: AbortSignal.timeout(4000),
      body: JSON.stringify(payload),
    });
  } catch {
    // observational only
  }
}
