/**
 * Lightweight anti-bot protection for public, unauthenticated endpoints.
 *
 * Uses a honeypot: automated submissions tend to auto-fill every
 * "registration-looking" field they find. If any hidden honeypot field is
 * present and non-empty, or carries an implausible value, we treat the
 * submission as automated and reject it.
 *
 * The check is ADDITIVE — legitimate clients that omit the fields (or send an
 * empty string) pass through untouched, so existing forms keep working without
 * changes. Bots that fill these fields are fail-closed.
 */

const HONEYPOT_KEYS = ["website", "company", "fax", "homepage"] as const;

/** Reject when a body contains a non-empty honeypot field. */
export function isBotSubmission(body: Record<string, unknown>): boolean {
  for (const key of HONEYPOT_KEYS) {
    const value = body[key];
    if (Array.isArray(value) && value.length > 0) return true;
    if (typeof value === "string" && value.trim().length > 0) return true;
    if (typeof value === "number" && Number.isFinite(value)) return true;
  }
  return false;
}

/**
 * Guard helper for route handlers. Returns an error message when the body is a
 * bot submission (only for objects with a plausible signature), or null when
 * the check is not applicable (e.g. non-object or undefined).
 */
export function botGuardError(body: unknown): string | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  if (isBotSubmission(body as Record<string, unknown>)) {
    return "Submission rejected.";
  }
  return null;
}
