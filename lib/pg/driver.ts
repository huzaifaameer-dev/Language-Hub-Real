import path from "node:path";
import type { PGlite } from "@electric-sql/pglite";

/**
 * Unified PostgreSQL driver.
 *
 * • `DATABASE_URL` set → a real PostgreSQL server over the network (`pg`).
 *   Every Vercel instance talks to the SAME database, so accounts, signups and
 *   registrations are durable and shared. This is the production path (Neon).
 * • no `DATABASE_URL` → PGlite: the real PostgreSQL engine compiled to WASM,
 *   running in-process against a local data directory. Zero install, zero
 *   network — ideal for local development and single-server deployments.
 *
 * Both expose the same tiny surface (`query` / `exec` / `transaction`), so every
 * repository, the seed and the review engine stay driver-agnostic.
 *
 * Notes for the managed (Neon) path:
 *   • the pooled `-pooler` URL is meant for application traffic; schema
 *     migrations use the direct URL (see `lib/server/pg.ts`).
 *   • `sslmode` comes from the connection string, so we never force `ssl: false`
 *     over it.
 *   • on Vercel the pool is attached to the function lifecycle so Fluid compute
 *     reuses it and closes it on suspend.
 */

export interface QueryResult<T> {
  rows: T[];
}

export interface DbClient {
  query<T>(text: string, params?: unknown[]): Promise<QueryResult<T>>;
  exec(sql: string): Promise<void>;
  transaction<T>(fn: (client: DbClient) => Promise<T>): Promise<T>;
}

const configuredDir = process.env.LANGUAGE_HUB_PG_DIR?.trim();
const DATA_DIR = configuredDir
  ? path.resolve(configuredDir)
  : process.env.VERCEL
    ? path.join("/tmp", "language-hub-pgdata")
    : path.join(process.cwd(), ".pgdata");

declare global {
  var __lhDbDriverPromise: Promise<DbClient> | undefined;
}

export function usingRemotePostgres(): boolean {
  return Boolean((process.env.DATABASE_URL ?? "").trim());
}

export function pgSslConfig(): { rejectUnauthorized: boolean } | false | undefined {
  const mode = (process.env.PGSSLMODE ?? "").trim().toLowerCase();
  // Unset → let `sslmode` in the connection string decide (Neon ships
  // `sslmode=require`, and node-postgres parses it). Never force `false` here,
  // which would silently disable TLS that the URL asked for.
  if (!mode) return undefined;
  if (mode === "disable") return false;
  if (mode === "require" || mode === "no-verify") return { rejectUnauthorized: false };
  if (mode === "verify-ca" || mode === "verify-full") {
    return { rejectUnauthorized: mode === "verify-full" };
  }
  return undefined;
}

/** Direct (unpooled) URL — used for schema bootstrap / migrations. */
export function directUrl(): string {
  return (
    (process.env.DATABASE_URL_UNPOOLED ?? "").trim() ||
    (process.env.DATABASE_URL ?? "").trim()
  );
}

async function bootstrap(): Promise<DbClient> {
  const connectionString = (process.env.DATABASE_URL ?? "").trim();

  if (connectionString) {
    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 8_000,
      application_name: "language-hub",
      ssl: pgSslConfig(),
    });
    // Fail fast on a bad URL instead of at the first user request.
    await pool.query("SELECT 1");

    // Vercel Fluid compute: reuse the pool across invocations and close it
    // cleanly before the instance suspends.
    if (process.env.VERCEL) {
      const { attachDatabasePool } = await import("@vercel/functions");
      attachDatabasePool(pool);
    }

    return {
      query: async <T>(text: string, params: unknown[] = []) => {
        const res = await pool.query(text, params as never[]);
        return { rows: res.rows as T[] };
      },
      exec: async (sql: string) => {
        // node-postgres supports multiple statements via the simple query
        // protocol when no parameters are supplied — exactly what our DDL and
        // seed scripts use.
        await pool.query(sql);
      },
      transaction: async <T>(fn: (client: DbClient) => Promise<T>) => {
        const client = await pool.connect();
        const tx: DbClient = {
          query: async <R>(text: string, params: unknown[] = []) => {
            const res = await client.query(text, params as never[]);
            return { rows: res.rows as R[] };
          },
          exec: async (sql: string) => {
            await client.query(sql);
          },
          transaction: (inner) => inner(tx), // nested → reuse current tx
        };
        try {
          await client.query("BEGIN");
          const out = await fn(tx);
          await client.query("COMMIT");
          return out;
        } catch (err) {
          await client.query("ROLLBACK");
          throw err;
        } finally {
          client.release();
        }
      },
    };
  }

  // Local / single-server path: embedded PostgreSQL, no network.
  const { PGlite } = await import("@electric-sql/pglite");
  const db: PGlite = new PGlite(DATA_DIR);
  await db.waitReady;

  return {
    query: async <T>(text: string, params: unknown[] = []) => {
      const res = await db.query<T>(text, params as never[]);
      return { rows: res.rows };
    },
    exec: async (sql: string) => {
      await db.exec(sql);
    },
    transaction: <T>(fn: (client: DbClient) => Promise<T>) =>
      db.transaction(async (client) => {
        const nested: DbClient = {
          query: async <R>(text: string, params: unknown[] = []) => {
            const res = await client.query<R>(text, params as never[]);
            return { rows: res.rows };
          },
          exec: async (sql: string) => {
            await client.exec(sql);
          },
          transaction: () => {
            throw new Error("Nested transactions are not supported on PGlite.");
          },
        };
        return fn(nested);
      }),
  };
}

/** Returns the shared driver, creating it once per process. */
export function getDriver(): Promise<DbClient> {
  if (!globalThis.__lhDbDriverPromise) {
    globalThis.__lhDbDriverPromise = bootstrap().catch((error) => {
      // A failed boot must not poison every future request.
      globalThis.__lhDbDriverPromise = undefined;
      throw error;
    });
  }
  return globalThis.__lhDbDriverPromise;
}

/** Data directory label for diagnostics (remote DB returns its URL host). */
export function dbTarget(): string {
  const url = (process.env.DATABASE_URL ?? "").trim();
  if (url) {
    try {
      return new URL(url).host;
    } catch {
      return "postgres";
    }
  }
  return DATA_DIR;
}
