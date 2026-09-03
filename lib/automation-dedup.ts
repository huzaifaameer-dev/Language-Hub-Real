/**
 * Automation send dedup.
 *
 * The `/api/automations` route must never email the same user regarding the
 * same automation tick twice, even if the cron fires repeatedly or races with
 * itself. This small, pure state machine captures that "claim once per key"
 * behaviour so it can be unit tested without a database.
 *
 * The tracker delegates persistence to a tiny store interface so production can
 * back it with the `automation_sends` MongoDB collection while tests use an
 * in-memory map.
 */

export interface AutomationKeyStore {
  /** Returns true if `key` has already been claimed. */
  has(key: string): Promise<boolean>;
  /** Claims `key` (must be idempotent — a second claim is a no-op). */
  add(key: string): Promise<void>;
}

export interface AutomationDedup {
  /** True when this key should NOT fire again (already claimed). */
  alreadySent(key: string): Promise<boolean>;
  /**
   * Atomically "claim or skip": returns the claimed key if it had not been
   * sent yet (caller should perform the side effect then commit), or null if
   * it was already claimed. Committing after the side effect keeps the cursor
   * on the dedup set only once the send actually succeeded.
   */
  claim(key: string): Promise<string | null>;
  /** Records a successful send so future ticks skip it. Idempotent. */
  markSent(key: string): Promise<void>;
}

/** A store backed by a plain in-memory Set — ideal for tests and small apps. */
export function createMemoryKeyStore(): AutomationKeyStore {
  const seen = new Set<string>();
  return {
    async has(key) {
      return seen.has(key);
    },
    async add(key) {
      seen.add(key);
    },
  };
}

/** Build a dedup tracker over any store. All ops are async + idempotent. */
export function createDedupTracker(store: AutomationKeyStore): AutomationDedup {
  return {
    async alreadySent(key) {
      return store.has(key);
    },
    async claim(key) {
      if (await store.has(key)) return null;
      return key;
    },
    async markSent(key) {
      await store.add(key);
    },
  };
}
