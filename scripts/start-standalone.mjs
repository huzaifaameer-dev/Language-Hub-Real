/**
 * Start the Next.js standalone production server.
 *
 * `next build` with `output: "standalone"` emits a minimal server plus the
 * node_modules it traced — but it deliberately does NOT copy three things the
 * server needs:
 *
 *   1. `public/`          → every image and upload 404s
 *   2. `.next/static/`    → the built CSS/JS 404s (unstyled pages)
 *   3. `.env.local` (and friends) → the server loads env from its OWN
 *      directory, so runtime secrets (`AUTH_SECRET`, `SMTP_*`, `STRIPE_*`,
 *      `AI_API_KEY`, …) never arrive and Auth.js fails every
 *      `/api/auth/session` with MissingSecret.
 *
 * The Dockerfile handles 1 and 2 and supplies secrets as real environment
 * variables; this script does the same for local runs so
 * `npm run start:standalone` behaves like the real deployment.
 *
 * Note: the copied env files live under `.next/`, which is gitignored — this
 * never publishes anything.
 */
import { cp, access, readdir } from "node:fs/promises";
import { constants } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const standalone = join(root, ".next", "standalone");

async function exists(p) {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

if (!(await exists(join(standalone, "server.js")))) {
  console.error("[standalone] .next/standalone/server.js not found — run `npm run build` first.");
  process.exit(1);
}

// public/ holds images, uploads and icons; .next/static holds the built CSS/JS.
for (const [from, to] of [
  [join(root, "public"), join(standalone, "public")],
  [join(root, ".next", "static"), join(standalone, ".next", "static")],
]) {
  if (await exists(from)) {
    await cp(from, to, { recursive: true, force: true });
  } else {
    console.warn(`[standalone] skipped missing ${from}`);
  }
}

// Runtime env: the standalone server resolves `.env*` from its own directory.
// Carry the root's env files over, but never `.env.example` (a template) and
// never overwrite a real env file already placed next to the server.
for (const name of await readdir(root)) {
  if (!name.startsWith(".env")) continue;
  if (name === ".env.example") continue;
  const from = join(root, name);
  const to = join(standalone, name);
  if (!(await exists(to))) await cp(from, to, { force: true });
}

const child = spawn(process.execPath, [join(standalone, "server.js")], {
  stdio: "inherit",
  cwd: standalone,
});

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => child.kill(sig));
}
child.on("exit", (code) => process.exit(code ?? 0));
