import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = "http://localhost:3000";
const logs = [];

const browser = await chromium.launch();
const ctx = await browser.newContext();
let mgCookieSet = false;

async function visit(path, expectLoginForm = false) {
  const page = await ctx.newPage();
  const collected = [];
  const handle = (kind, txt) => {
    const t = String(txt ?? "");
    if (/hydrat|418|mismatch|HTML|419|modify/i.test(t) || kind === "pageerror") {
      collected.push(`[${kind}] ${t.slice(0, 900)}`);
    }
  };
  page.on("console", (m) => handle(m.type(), m.text()));
  page.on("pageerror", (e) => handle("pagerr", String(e.stack ?? e.message ?? e).slice(0, 1100)));
  try {
    await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(2500);
    const body = (await page.locator("body").innerText().catch(() => "")).slice(0, 120);
    logs.push(`\n### ${path} hydrateErrs=${collected.length} body="${body.replace(/\s+/g, " ").trim()}"`);
    for (const c of collected) logs.push(`   ${c.slice(0, 520)}`);
  } catch (e) {
    logs.push(`\n### ${path} !! goto failed: ${String(e.message ?? e).slice(0, 200)}`);
  }
  await page.close();
}

await visit("/management");
await visit("/management"); // second pass — roster backfill path
await visit("/login");
await visit("/admin-panel");

writeFileSync("diag-hydrate-final.log", logs.join("\n"));
console.log("-> diag-hydrate-final.log");
await browser.close();