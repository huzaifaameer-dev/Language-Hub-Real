// Local visual-QA helper: captures production screenshots with Playwright.
// Run with the standalone server already listening on port 3000.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = process.env.QA_BASE ?? "http://localhost:3000";
const OUT = process.env.QA_OUT ?? "C:/Users/huzai/AppData/Local/Temp/opencode/qa";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const errors = [];

async function shot(page, name) {
  await page.screenshot({ path: `${OUT}/${name}.png`, timeout: 60_000 });
}

async function goto(page, path) {
  await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(2600);
}

async function scrollTo(page, sel) {
  await page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 62, behavior: "instant" });
  }, sel);
  await page.waitForTimeout(1300);
}

const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
desktop.on("pageerror", (e) => errors.push(`desktop: ${e.message}`));

await goto(desktop, "/");
await shot(desktop, "d-01-hero");
for (const [name, sel] of [
  ["d-02-stats", "#stats"],
  ["d-03-courses", "#courses"],
  ["d-04-why", "#why"],
  ["d-05-enroll", "#enroll"],
  ["d-06-reviews", "#reviews"],
  ["d-07-journey", "#journey"],
  ["d-08-founder", "#founder"],
  ["d-09-cta", "#cta"],
  ["d-10-footer", "footer"],
]) {
  await scrollTo(desktop, sel);
  await shot(desktop, name);
}

for (const [name, path] of [
  ["d-20-courses", "/courses"],
  ["d-21-course-detail", "/courses/spoken-english"],
  ["d-22-team", "/team"],
  ["d-23-news", "/news"],
  ["d-24-login", "/login"],
  ["d-25-placement", "/placement-test"],
  ["d-26-feedback", "/feedback"],
  ["d-27-signup", "/signup"],
  ["d-28-success", "/success-stories"],
  ["d-29-news-article", "/news/delete-test-1790411320280"],
  ["d-30-privacy", "/privacy"],
]) {
  await goto(desktop, path);
  await shot(desktop, name);
}

const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 2,
});
mobile.on("pageerror", (e) => errors.push(`mobile: ${e.message}`));

await goto(mobile, "/");
await shot(mobile, "m-01-hero");
for (const [name, sel] of [
  ["m-02-why", "#why"],
  ["m-03-enroll", "#enroll"],
  ["m-04-journey", "#journey"],
  ["m-05-cta", "#cta"],
  ["m-06-footer", "footer"],
]) {
  await scrollTo(mobile, sel);
  await shot(mobile, name);
}

for (const [name, path] of [
  ["m-07-courses", "/courses"],
  ["m-08-course", "/courses/spoken-english"],
  ["m-09-team", "/team"],
]) {
  await goto(mobile, path);
  await shot(mobile, name);
}

const overflow = await mobile.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
}));

await browser.close();
console.log(JSON.stringify({ errors, overflow, out: OUT }, null, 2));
