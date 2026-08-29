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
 * Simple in-memory sliding-window rate limiter keyed by string.
 * Good enough for a self-hosted app at this scale.
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

/** Pull a stable client identifier from a Request. */
export function clientKey(request: Request, suffix = ""): string {
  // First entry of x-forwarded-for is the real client when behind a proxy.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip")?.trim() ??
    request.headers.get("cf-connecting-ip")?.trim();
  if (ip) return `${ip}:${suffix}`;
  // No identity headers (plain dev/self-hosts): bound by user-agent family so
  // a flood from one client does not lock out every anonymous user on the box.
  const ua = request.headers.get("user-agent") ?? "";
  let h = 0;
  for (let i = 0; i < ua.length; i += 1) h = (h * 31 + ua.charCodeAt(i)) | 0;
  return `ua:${h.toString(16)}:${suffix}`;
}