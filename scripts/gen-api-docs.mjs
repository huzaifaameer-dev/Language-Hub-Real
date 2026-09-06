/** Generates docs/API.md — inventory of every App Router API route. */
import { readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const apiDir = path.join(root, "app", "api");

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name === "route.ts") {
      const rel = path.relative(apiDir, full).split(path.sep).join("/").replace(/\/route\.ts$/, "");
      out.push(`/api/${rel}`);
    }
  }
  return out;
}

const routes = walk(apiDir).sort();
const groups = new Map();
for (const r of routes) {
  const top = r.split("/")[2] ?? "other";
  if (!groups.has(top)) groups.set(top, []);
  groups.get(top).push(r);
}

const lines = [
  "# Language Hub - HTTP API Reference",
  "",
  "Auto-generated inventory of every App Router API route (`npm run gen:api-docs` regenerates it). Schemas live in `lib/validate.ts` and zod schemas in the route sources.",
  "",
  "## Auth conventions",
  "- **Admins**: standalone `hub_admin_token` cookie (enforced by `lib/admin-guard`).",
  "- **Learners**: NextAuth JWT session (`auth()`).",
  "- **Public AI** (`/api/guide`, `/api/ai/practice*`): rate-limited + daily quota via the `lh_client` identity.",
  "",
  `## Routes (${routes.length} total)`,
  "",
  "```",
  ...routes,
  "```",
  "",
  "## Groups",
  "",
  ...[...groups.entries()].map(([g, items]) => `- **/${g}** — ${items.length} route(s)`),
  "",
];

writeFileSync(path.join(root, "docs", "API.md"), lines.join("\n"), "utf8");
console.log(`docs/API.md written (${routes.length} routes, ${groups.size} groups)`);