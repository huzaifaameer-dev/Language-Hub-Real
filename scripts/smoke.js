/* Smoke test: loads the site headlessly, exercises the kinetic intro, nav, and
 * smooth scroll, captures screenshots, and reports console errors. Dev-only. */
const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const URL = "http://localhost:3000";
const SHOTS = path.join(process.env.TEMP || ".", "opencode", "shots");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

fs.mkdirSync(SHOTS, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(err.message));

  await page.goto(URL, { waitUntil: "networkidle0", timeout: 60000 });

  const introText = await page.evaluate(() => {
    const intro = document.querySelector('[data-intro="tag-c"]');
    return intro ? intro.textContent.replace(/\s+/g, " ").trim().slice(0, 80) : null;
  });
  console.log("intro tag text:", introText);

  // skip the kinetic intro with a click
  await page.mouse.click(720, 450);
  await sleep(1600);

  const heroH1 = await page.evaluate(() => {
    const h1 = document.querySelector("h1");
    return h1 ? h1.textContent.replace(/\s+/g, " ").trim() : null;
  });
  console.log("hero h1:", heroH1);
  await page.screenshot({ path: path.join(SHOTS, "01-hero.png") });

  // smooth scroll to courses via the nav
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("nav button")).find((b) =>
      b.textContent.includes("Courses")
    );
    btn && btn.click();
  });
  await sleep(2600);
  const scrollToCourses = await page.evaluate(() => window.scrollY);
  console.log("scrollY after Courses nav click:", Math.round(scrollToCourses));
  await page.screenshot({ path: path.join(SHOTS, "02-courses.png") });

  // scroll to the bookshelf and screenshot it
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.72));
  await sleep(1400);
  await page.screenshot({ path: path.join(SHOTS, "03-bookshelf.png") });

  // mobile menu
  await page.setViewport({ width: 390, height: 844 });
  await sleep(600);
  await page.evaluate(() => {
    const burger = document.querySelector('button[aria-label="Open menu"]');
    burger && burger.click();
  });
  await sleep(1000);
  const menuVisible = await page.evaluate(
    () => document.querySelector('[role="dialog"][aria-label="Menu"]') !== null
  );
  console.log("mobile menu visible:", menuVisible);
  await page.keyboard.press("Escape");
  await sleep(600);
  await page.screenshot({ path: path.join(SHOTS, "04-mobile.png") });

  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return { w: doc.scrollWidth - doc.clientWidth, h: doc.scrollHeight - doc.clientHeight };
  });
  console.log("horizontal overflow px:", overflow.w);

  // count scroll-pinned sections as a sanity check
  const pins = await page.evaluate(() => document.querySelectorAll(".is-pinned").length);
  console.log("pin-spacer elements:", pins);

  console.log("console errors:", consoleErrors.length ? consoleErrors : "none");
  console.log("page errors:", pageErrors.length ? pageErrors : "none");
  await browser.close();
})().catch((e) => {
  console.error("SMOKE TEST FAILED:", e.message);
  process.exit(1);
});