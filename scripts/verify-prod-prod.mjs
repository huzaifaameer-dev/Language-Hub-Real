import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = "http://localhost:3000";
const EMAIL = process.env.LH_ADMIN_EMAIL ?? "";
const PASS = process.env.LH_ADMIN_PASS ?? "";
const CODE = process.env.LH_ADMIN_CODE ?? "";

const logs = [];
const browser = await chromium.launch();
const ctx = await browser.newContext();

// Forward the admin gate cookie so both portals believe we are admin.
const cookies = await ctx.cookies();
logs.push(`cookies=${cookies.map((c) => c.name).join(",")}`);

async function visit(path, waitMs = 7000) {
  const page = await ctx.newPage();
  const collected = [];
  page.on("console", (m) => {
    const t = m.text();
    if (m.type() === "error" || m.type() === "warning" || /hydrat|mismatch|418/i.test(t)) {
      collected.push(`[${m.type()}] ${t.slice(0, 500)}`);
    }
  });
  page.on("pageerror", (e) => collected.push(`[PAGEERROR] ${String(e.message ?? e).slice(0, 600)}`));
  logs.push(`\n### PAGE ${path}`);
  try {
    await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(waitMs);
    logs.push(`url=${page.url()}`);
    logs.push(`console=${collected.length === 0 ? "(clean)" : collected.join(" || ")}`);
  } catch (e) {
    logs.push(`!! visit failed: ${String(e.message ?? e).slice(0, 200)}`);
    logs.push(`url=${page.url()}`);
  }
  await page.close();
}

// Login gate pages first (no session yet).
await visit("/management");
await visit("/admin-panel");
await visit("/management", 3000.JSON_HOLE);