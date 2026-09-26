/**
 * Fortress shield — active-defence engine (pure, testable).
 *
 * Detects common attack signatures (XSS / SQLi / path traversal / NoSQLi /
 * probe-recon), escorts honeypot paths, and keeps a strike ledger so repeated
 * probes escalate into a temporary block (tarpit). Pure logic lives here; the
 * middlewaste (proxy.ts) applies it and the /api/security/event route persists
 * evidence + alerts admins.
 */

export type ThreatKind =
  | "XSS"
  | "SQLI"
  | "PATH_TRAVERSAL"
  | "NOSQLI"
  | "RECON"
  | "HONEYPOT";

export const HONEYPOT_PATHS = [
  "/.env",
  "/.git/config",
  "/.git/HEAD",
  "/.htaccess",
  "/wp-login.php",
  "/wp-admin",
  "/phpmyadmin",
  "/phpMyAdmin",
  "/server-status",
  "/server-info",
  "/config.php",
  "/phpinfo.php",
  "/xmlrpc.php",
  "/admin/config",
  "/actuator",
  "/actuator/health",
  "/env",
];

// Signatures borrowed from public WAF/scan catalogs (ZAP/nikto-ish). Values are
// lowercased probes; only the *presence* of a probe matters, never a real CVE.
const XSS_RE = /(<script|<img\s+onerror|\bonerror\s*=|javascript:alert|\balert\s*\(|<iframe)/i;
const SQLI_RE = /(\bunion\s+select\b|\bor\s*['"]?1['"]?\s*=\s*['"]?1['"]?|\b1['"]?\s*=\s*['"]?1\b|'\s*--\s|;\s*drop\s+table|information_schema|sqlmap|\bwaitfor\s+delay\b)/i;
const NOSQLI_RE = /(\$(ne|gt|gte|lt|lte|nin|where|regex|exists))\s*[:=\]]|\b_ne\b/i;
const PATH_RE = /(\.\.\/|\.\.%2f|\.\.\\|%2e%2e|%00|etc\/passwd|\.md5|\.sql|\.bak|\.tar\.gz)/i;
// Scanner fingerprints only — NOT common benign params the app itself uses
// (`id=`, `q=`, `page=`, `tag=`, `action=`, `file=`, `path=`, `admin`, …).
// Flagging those false-positives dozens of legitimate requests (e.g. the admin
// news DELETE `?id=<ObjectId>`) and tar-pits real users. Real probe payloads on
// the benign params are still caught by the SQLI / XSS / PATH / NOSQLI rules.
const RECON_RE = /(^|[?&])(debug|test|cmd|shell|source|exec|eval|trace|verbose|backup|dump|xdebug|docroot|phpinfo)(=|$)/i;

export interface WebRequestLike {
  path: string;
  query?: string;
}

/** Classify a URL into a threat kind, or null when benign. */
export function classifyThreat(req: WebRequestLike): ThreatKind | null {
  const path = decodeURIComponent(req.path).toLowerCase();
  const query = decodeURIComponent(req.query ?? "").toLowerCase();

  if (HONEYPOT_PATHS.some((h) => req.path.toLowerCase().startsWith(h.toLowerCase()))) {
    return "HONEYPOT";
  }
  if (XSS_RE.test(query) || XSS_RE.test(path)) return "XSS";
  if (SQLI_RE.test(query) || SQLI_RE.test(path)) return "SQLI";
  if (NOSQLI_RE.test(query) || NOSQLI_RE.test(path)) return "NOSQLI";
  if (PATH_RE.test(path) || PATH_RE.test(query)) return "PATH_TRAVERSAL";
  if (RECON_RE.test(query) && query.length >= 4) return "RECON";
  return null;
}

export const STOPPED = Object.freeze({
  XSS: "Bad request rejected by security shield.",
  SQLI: "Bad request rejected by security shield.",
  NOSQLI: "Bad request rejected by security shield.",
  PATH_TRAVERSAL: "Bad request rejected by security shield.",
  RECON: "Request rejected by automated-recon guard.",
  HONEYPOT: "Forbidden — endpoint does not exist.",
} satisfies Record<ThreatKind, string>);

/** Strike threshold before a client is temporarily blocked (tarpit). */
export function strikeLimit(): number {
  const n = Number(process.env.SHIELD_STRIKE_LIMIT ?? 5);
  return Number.isFinite(n) && n >= 2 ? Math.round(n) : 5;
}

/** Exponential backoff window for a strike count (ms). */
export function blockWindowMs(strikes: number): number {
  const base = Number(process.env.SHIELD_BLOCK_MS ?? 10 * 60 * 1000);
  const clamp = (v: number) => Math.round(Math.min(60 * 60 * 1000, Math.max(30 * 1000, v)));
  return clamp(base * Math.pow(2, Math.max(0, Math.floor(strikes / strikeLimit()) - 1)));
}

export function isBlocked(strikes: number, until: number | undefined, now = Date.now()): boolean {
  return strikes >= strikeLimit() && !!until && until > now;
}

/** Stable per-client key from a request headers (recto UA hash fallback). */
export function shieldClientKey(headers: Record<string, string | null | undefined>): string {
  const ip = headers["x-forwarded-for"]?.split(",")[0]?.trim();
  if (ip) return `ip:${ip}`;
  const ua = headers["user-agent"] ?? "";
  let h = 0;
  for (let i = 0; i < ua.length; i += 1) h = (h * 31 + ua.charCodeAt(i)) | 0;
  return `ua:${(h >>> 0).toString(16)}`;
}