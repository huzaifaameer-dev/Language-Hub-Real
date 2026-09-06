import { getDb } from "@/lib/db";

/**
 * Daily budget guard for LLM endpoints. Public AI services (guide, practice,
 * feedback) are behind the normal rate limiter; this adds a day-level quota so
 * anonymous abuse cannot burn an unbounded LLM bill within a month.
 *
 * Counts are keyed per client (or user) per date in `ai_usage`. The cap is
 * configurable via AI_DAILY_CAP (default 60 requests / client / day).
 */

export interface AiGuardResult {
  ok: boolean;
  remaining: number;
}

function capFor(): number {
  const n = Number(process.env.AI_DAILY_CAP ?? 60);
  return Number.isFinite(n) && n >= 1 ? Math.round(n) : 60;
}

function dayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function guardAiUsage(key: string): Promise<AiGuardResult> {
  const limit = capFor();
  try {
    const db = await getDb();
    const col = db.collection<{
      _id: string;
      count: number;
      updatedAt: Date;
    }>("ai_usage");
    const docId = `ai:${dayKey()}:${key.slice(0, 96)}`;
    const now = new Date();
    const updated = await col.findOneAndUpdate(
      { _id: docId },
      { $inc: { count: 1 }, $set: { updatedAt: now } },
      { upsert: true, returnDocument: "after" }
    );
    const count = updated?.count ?? 1;
    return { ok: count <= limit, remaining: Math.max(0, limit - count) };
  } catch {
    // DB hiccup — allow (rate limit still applies).
    return { ok: true, remaining: 1 };
  }
}