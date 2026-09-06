/**
 * Fresh-start database reset for the Language Hub app.
 *
 * Drops EVERY collection (users, applications, enrollments, payments, blog,
 * ai_*, automation_sends, …) so the project starts clean. On the first request
 * the app re-runs its idempotent bootstrapping (lib/db.ensureInit): indexes,
 * the seed course catalog, default testimonials, and the admin account from
 * ADMIN_EMAIL/ADMIN_PASSWORD.
 *
 * Usage:  node scripts/reset-db.mjs
 * Reads MONGODB_URI / MONGODB_DB from .env.local automatically.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function loadEnvLocal() {
  const file = path.join(root, ".env.local");
  if (!existsSync(file)) return {};
  const env = {};
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[m[1]] = value;
  }
  return env;
}

const env = { ...process.env, ...loadEnvLocal() };
const uri = env.MONGODB_URI ?? "mongodb://127.0.0.1:27017";
const dbName = env.MONGODB_DB ?? "languagehub";

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
await client.connect();
const db = client.db(dbName);

const collections = await db.listCollections({}, { nameOnly: true }).toArray();
const names = collections.map((c) => c.name);

if (names.length === 0) {
  console.log(`Database "${dbName}" is already clean — nothing to reset.`);
} else {
  console.log(`Dropping ${names.length} collection(s) from "${dbName}":`);
  for (const name of names) {
    await db.dropCollection(name);
    console.log(`  ✗ dropped  ${name}`);
  }
}

// Safety: re-verify so the operator sees the end state.
const after = await db.listCollections({}, { nameOnly: true }).toArray();
console.log(`\nDone. "${dbName}" now has ${after.length} collection(s).`);
console.log("On the next app request, ensureInit() will reseed indexes, courses, testimonials and the admin account.");

await client.close();