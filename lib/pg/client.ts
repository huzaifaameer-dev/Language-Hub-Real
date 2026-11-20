import { getDriver, type DbClient } from "./driver";
import { REVIEW_SCHEMA_SQL, REVIEW_SEED_SQL } from "./schema";

/**
 * Review-engine connection.
 *
 * Uses the shared driver, so with `DATABASE_URL` configured the reviews live in
 * the same durable self-hosted PostgreSQL as everything else — every serverless
 * instance sees identical data. Without it, PGlite runs the schema locally.
 */

declare global {
  var __lhReviewBootPromise: Promise<void> | undefined;
}

async function bootReviews(): Promise<void> {
  const db = await getDriver();

  // One transaction (and one advisory lock) so simultaneous cold starts cannot
  // race the CREATE TABLE / seed against the same schema.
  await db.transaction(async (tx) => {
    await tx.exec("SELECT pg_advisory_xact_lock(741852964)");
    await tx.exec(REVIEW_SCHEMA_SQL);

    const { rows } = await tx.query<{ n: number }>(
      "SELECT COUNT(*)::INT AS n FROM reviews"
    );
    if ((rows[0]?.n ?? 0) === 0) {
      await tx.exec(REVIEW_SEED_SQL);
    }
  });
}

/**
 * Singleton connection. Cached on `globalThis` so hot reloads and route handlers
 * share one engine instance (and one PGlite data-directory lock locally).
 */
export function getPg(): Promise<DbClient> {
  if (!globalThis.__lhReviewBootPromise) {
    globalThis.__lhReviewBootPromise = bootReviews().catch((error) => {
      globalThis.__lhReviewBootPromise = undefined;
      throw error;
    });
  }
  return globalThis.__lhReviewBootPromise.then(() => getDriver());
}
