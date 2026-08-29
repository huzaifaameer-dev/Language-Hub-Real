interface Bucket {
  count: number;
  resetAt: number;
}

interface RateLimitDoc {
  _id: string;
  count: number;
  resetAt: Date;
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

let ttlIndexReady: Promise<void> | null = null;

/** Loads the Mongo layer lazily so the in-memory path has no DB import. */
async function getRateLimitDb() {
  const { getDb } = await import("@/lib/db");
  return getDb();
}

/** Creates the TTL index once per process so old windows get purged by Mongo. */
function createTtlIndex(): Promise<void> {
  return getRateLimitDb().then(async (db) => {
    await db
      .collection<RateLimitDoc>("ratelimits")
      .createIndex({ resetAt: 1 }, { expireAfterSeconds: 1 });
  });
}

function ensureTtlIndex(): Promise<void> {
  const current = ttlIndexReady;
  if (current) return current;
  const created = createTtlIndex().catch((err: unknown) => {
    ttlIndexReady = null; // allow retry on the next call
    throw err;
  });
  ttlIndexReady = created;
  return created;
}

/**
 * Database-backed rate limiter. State survives restarts and is shared across
 * processes/instances so bursts cannot be replayed by cycling the server.
 * Atomic via `findOneAndUpdate` on the found bucket; falls back to the
 * in-memory limiter if the DB is unreachable so the API never hard-fails.
 */
export async function rateLimitDb(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  try {
    await ensureTtlIndex();
    const db = await getRateLimitDb();
    const col = db.collection<RateLimitDoc>("ratelimits");

    const now = Date.now();
    const doc = await col.findOne({ _id: key });

    if (!doc || doc.resetAt.getTime() <= now) {
      await col.updateOne(
        { _id: key },
        { $set: { count: 1, resetAt: new Date(now + windowMs) } },
        { upsert: true }
      );
      return { ok: true, remaining: limit - 1 };
    }

    const updated = await col.findOneAndUpdate(
      { _id: key, resetAt: doc.resetAt },
      { $inc: { count: 1 } },
      { returnDocument: "after" }
    );
    const count = updated ? updated.count : doc.count;
    if (count > limit) {
      return {
        ok: false,
        remaining: 0,
        retryAfter: Math.ceil((doc.resetAt.getTime() - now) / 1000),
      };
    }
    return { ok: true, remaining: Math.max(0, limit - count) };
  } catch {
    return rateLimit(key, limit, windowMs);
  }
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