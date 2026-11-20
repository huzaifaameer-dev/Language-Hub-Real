/**
 * CLI: apply the review-engine schema + seed.
 * Usage: npm run db:setup
 *
 * • `DATABASE_URL` set → applies to that networked PostgreSQL server (Neon),
 *   using the direct/unpooled URL when available. Safe to re-run.
 * • otherwise → applies to the local embedded PGlite data directory.
 */
import path from "node:path";
import fs from "node:fs/promises";

const migration = await fs.readFile(
  path.join(process.cwd(), "db", "migrations", "0001_reviews.sql"),
  "utf8"
);
const seed = await fs.readFile(
  path.join(process.cwd(), "db", "seed", "0001_reviews.sql"),
  "utf8"
);

const remoteUrl = (process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "").trim();

/** Minimal shape shared by PGlite and pg.Client for this script. */
async function run(db, label) {
  console.log(`[db] target: ${label}`);
  await db.exec(migration);
  const before = await db.query("SELECT COUNT(*)::INT AS n FROM reviews");
  await db.exec(seed);
  const after = await db.query("SELECT COUNT(*)::INT AS n FROM reviews");
  const stats = await db.query("SELECT * FROM review_stats");
  console.log(`[db] reviews before: ${before.rows[0].n}, after: ${after.rows[0].n}`);
  console.log("[db] stats:", stats.rows[0]);
}

if (remoteUrl) {
  const { Client } = await import("pg");
  const client = new Client({
    connectionString: remoteUrl,
    application_name: "language-hub-db-setup",
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await run(client, new URL(remoteUrl).host);
  } finally {
    await client.end();
  }
} else {
  const { PGlite } = await import("@electric-sql/pglite");
  const dataDir = process.env.LANGUAGE_HUB_PG_DIR
    ? path.resolve(process.env.LANGUAGE_HUB_PG_DIR)
    : path.join(process.cwd(), ".pgdata");
  const db = new PGlite(dataDir);
  await db.waitReady;
  await run(db, dataDir);
  await db.close();
}

console.log("[db] done");
