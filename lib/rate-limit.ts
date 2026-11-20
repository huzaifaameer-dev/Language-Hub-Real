interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

function prune(now: number): void {
  for (const [key, b] of store) {
    if (b.resetAt <= now) store.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfter?: number;
}

/**
 * In-memory sliding-window rate limiter keyed by string. Kept as the fast path
 * and the fallback when the database is unreachable.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  prune(now);

  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  return { ok: true, remaining: limit - bucket.count };
}

/**
 * Database-backed rate limiter. State survives restarts and is shared across
 * processes/instances so bursts cannot be replayed by cycling the server.
 *
 * One atomic PostgreSQL upsert per call: if the window has expired the row is
 * reset to 1, otherwise the counter is incremented. Falls back to the
 * in-memory limiter if the database is unreachable so the API never hard-fails.
 */
export async function rateLimitDb(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  try {
    const { one } = await import("@/lib/server/pg");
    const seconds = Math.max(1, Math.ceil(windowMs / 1000));
    const row = await one<{ count: number; reset_at: string | Date }>(
      `INSERT INTO rate_limits (bucket, key, count, reset_at)
       VALUES ('api', $1, 1, NOW() + ($2 || ' seconds')::interval)
       ON CONFLICT (bucket, key) DO UPDATE SET
         count = CASE WHEN rate_limits.reset_at <= NOW() THEN 1 ELSE rate_limits.count + 1 END,
         reset_at = CASE WHEN rate_limits.reset_at <= NOW()
                         THEN NOW() + ($2 || ' seconds')::interval
                         ELSE rate_limits.reset_at END
       RETURNING count, reset_at`,
      [key, String(seconds)]
    );
    const count = Number(row?.count ?? 0);

    // Opportunistic cleanup of expired windows (never in the hot path's way).
    if (Math.random() < 0.02) {
      const { q } = await import("@/lib/server/pg");
      void q("DELETE FROM rate_limits WHERE reset_at < NOW() - INTERVAL '1 hour'").catch(
        () => {}
      );
    }

    if (count > limit) {
      const resetAt = row?.reset_at ? new Date(row.reset_at).getTime() : Date.now() + windowMs;
      return {
        ok: false,
        remaining: 0,
        retryAfter: Math.max(1, Math.ceil((resetAt - Date.now()) / 1000)),
      };
    }
    return { ok: true, remaining: Math.max(0, limit - count) };
  } catch {
    return rateLimit(key, limit, windowMs);
  }
}

/**
 * Pull a stable client identifier from a Request. Async because cookie
 * verification runs a Web Crypto HMAC.
 *
 * Priority:
 *   1. Trusted proxy IP (requires TRUST_PROXY=1 behind a real proxy).
 *   2. The signed `lh_client` cookie (minted by the middleware) — stable across
 *      UA rotation and survives NAT sharing, so rotating the User-Agent can no
 *      longer reset anonymous limit buckets.
 *   3. Fallback: a hash of the User-Agent + an in-memory random salt. This
 *      bounds damage when neither identity is available, but deployment should
 *      run a reverse proxy with TRUST_PROXY=1 for the authoritative client IP.
 */
let uaSalt = 0;
if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
  const buf = new Uint8Array(4);
  crypto.getRandomValues(buf);
  uaSalt = new DataView(buf.buffer).getUint32(0, true);
}

export async function clientKey(request: Request, suffix = ""): Promise<string> {
  // Only trust client hop headers (x-forwarded-for etc.) when BOTH an explicit
  // opt-in is set AND the deploy is actually behind that trusted proxy. On a
  // directly-reachable server the header is attacker-controlled — trusting it
  // would let anyone rotate their key and bypass every rate limit.
  const trustProxy =
    process.env.TRUST_PROXY === "1" || process.env.TRUST_PROXY === "true";

  if (trustProxy) {
    // First entry of x-forwarded-for is the real client when behind a proxy.
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip")?.trim() ??
      request.headers.get("cf-connecting-ip")?.trim();
    if (ip) return `${ip}:${suffix}`;
  }

  // Signed per-client cookie: real browsers carry it (minted by the middleware),
  // so a UA change no longer resets the bucket for them.
  try {
    const { verifyClientId, CLIENT_COOKIE_NAME } = await import("@/lib/client-id");
    const cookieHeader = request.headers.get("cookie");
    const cookie = cookieHeader
      ?.split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${CLIENT_COOKIE_NAME}=`));
    const id = cookie ? await verifyClientId(cookie.slice(CLIENT_COOKIE_NAME.length + 1)) : null;
    if (id) return `c:${id}:${suffix}`;
  } catch {
    // cookie layer is best-effort — fall through to the UA fallback
  }

  // No trusted identity: bound by user-agent family so a flood from one client
  // does not lock out every anonymous user on the box. Salted per-process so
  // bucket keys differ across restarts (old in-memory windows cannot be replayed).
  const ua = request.headers.get("user-agent") ?? "";
  let h = uaSalt;
  for (let i = 0; i < ua.length; i += 1) h = (h * 31 + ua.charCodeAt(i)) | 0;
  return `ua:${(h >>> 0).toString(16)}:${suffix}`;
}