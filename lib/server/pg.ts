/**
 * Typed PostgreSQL access layer for Language Hub.
 *
 * The driver is selected in `lib/pg/driver.ts`:
 *   • `DATABASE_URL` → a real self-hosted PostgreSQL server (`pg` driver).
 *     Shared and durable across every Vercel instance — production path.
 *   • otherwise → PGlite, PostgreSQL compiled to WebAssembly, in-process
 *     against a local directory. Zero install, zero network.
 *
 * Only parameterised statements are used here (never string interpolation of
 * user input). Every helper returns plain rows; repositories map them to domain
 * objects.
 */

import {
  getDriver,
  directUrl,
  pgSslConfig,
  usingRemotePostgres,
  type DbClient,
} from "@/lib/pg/driver";
import { APP_SCHEMA_SQL } from "./schema";
import { seedDatabase } from "./seed";

declare global {
  /**
   * App-level bootstrap promise. Cached on globalThis so dev hot-reloads,
   * route handlers and server components share one initialised engine.
   */
  var __lhDbPromise: Promise<DbClient> | undefined;
}

/** Arbitrary but stable key so concurrent cold starts serialise the bootstrap. */
const BOOTSTRAP_LOCK_KEY = 741852963;

/**
 * Schema + seed for a networked PostgreSQL server.
 *
 * Runs on the DIRECT (unpooled) connection — Neon's PgBouncer pooler is
 * transaction-scoped and not the right place for DDL or session-level locks.
 * An advisory transaction lock serialises the work when several serverless
 * instances cold-start at the same time; the statements themselves are
 * idempotent (`IF NOT EXISTS` / `ON CONFLICT`).
 */
async function bootstrapRemote(): Promise<void> {
  const { Client } = await import("pg");
  const client = new Client({
    connectionString: directUrl(),
    application_name: "language-hub-bootstrap",
    connectionTimeoutMillis: 15_000,
    ssl: pgSslConfig(),
  });

  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1)", [BOOTSTRAP_LOCK_KEY]);
    await client.query("SET LOCAL timezone = 'UTC'");
    await client.query("SET LOCAL statement_timeout = '120s'");
    await client.query(APP_SCHEMA_SQL);
    await seedDatabase(client);
    await client.query("COMMIT");
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // connection already broken — the original error is the useful one
    }
    throw error;
  } finally {
    await client.end();
  }
}

async function boot(): Promise<DbClient> {
  const db = await getDriver();

  if (usingRemotePostgres()) {
    // Pooled connections may be reused by other clients between statements, so
    // session `SET`s belong to the bootstrap transaction (above), not here.
    await bootstrapRemote();
    return db;
  }

  // Local embedded engine: session pragmas persist for the process.
  await db.exec(`
    SET timezone = 'UTC';
    SET statement_timeout = '15s';
    SET idle_in_transaction_session_timeout = '30s';
  `);

  // Idempotent schema + first-boot seed.
  await db.exec(APP_SCHEMA_SQL);
  await seedDatabase(db);

  return db;
}

/** Returns the initialised, seeded database engine. */
export function getDb(): Promise<DbClient> {
  if (!globalThis.__lhDbPromise) {
    globalThis.__lhDbPromise = boot().catch((error) => {
      // A failed boot must not poison every future request.
      globalThis.__lhDbPromise = undefined;
      throw error;
    });
  }
  return globalThis.__lhDbPromise;
}

/** Run a query and return its rows. */
export async function q<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const db = await getDb();
  const result = await db.query<T>(sql, params);
  return result.rows;
}

/** Run a query and return the first row (or null). */
export async function one<T>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await q<T>(sql, params);
  return rows[0] ?? null;
}

/** Execute a statement that returns nothing useful (DDL, plain writes). */
export async function exec(sql: string): Promise<void> {
  const db = await getDb();
  await db.exec(sql);
}

export interface TxClient {
  query: <T>(sql: string, params?: unknown[]) => Promise<{ rows: T[] }>;
}

/** Run a set of statements atomically. */
export async function tx<T>(fn: (client: TxClient) => Promise<T>): Promise<T> {
  const db = await getDb();
  return db.transaction(async (client) =>
    fn({
      query: async <R>(sql: string, params: unknown[] = []) => {
        const result = await client.query<R>(sql, params);
        return { rows: result.rows };
      },
    })
  );
}

/** Small helper: does a row exist? */
export async function exists(sql: string, params: unknown[] = []): Promise<boolean> {
  const row = await one<{ ok: number }>(`SELECT 1::INT AS ok FROM (${sql}) AS _x LIMIT 1`, params);
  return row !== null;
}
