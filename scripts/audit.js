/* Layout audit: measures pinned horizontal galleries end exactly flush. */
const puppeteer = require("puppeteer-core");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const URL = "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"],
    defaultViewport: { width: 1440, height: 900 },
  });
  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: "networkidle0", timeout: 60000 });

  // skip the kinetic intro and wait until the page is interactive
  await page.mouse.click(720, 450);
  await page.waitForFunction(
    () => {
      const main = document.getElementById("main");
      return main && main.hasAttribute("inert") === false;
    },
    { timeout: 15000 }
  ).catch(() => {});
  await sleep(1500);

  const auditTrack = async (label, sectionSel) => {
    const info = await page.evaluate((sel) => {
      const s = document.querySelector(sel);
      if (!s) return null;
      const track = s.querySelector("[data-track]");
      if (!track) return null;
      const r = s.getBoundingClientRect();
      return {
        top: Math.round(r.top + window.scrollY),
        height: Math.round(r.height),
        trackLayoutW: track.offsetWidth,
        viewport: window.innerWidth,
      };
    }, sectionSel);
    if (!info) return (out[label] = { error: "section/track not found" });
    out[`${label} (layout)`] = {
      trackLayoutW: info.trackLayoutW,
      maxX: info.trackLayoutW - info.viewport,
    };

    const scrollTo = async (y) => {
      await page.evaluate((yy) => {
        window.scrollTo(0, yy);
        document.documentElement.scrollTop = yy;
        document.body.scrollTop = yy;
      }, y);
      await sleep(1100);
    };

    await scrollTo(info.top + info.height * 0.32);
    const mid = await page.evaluate((sel) => {
      const s = document.querySelector(sel);
      const track = s.querySelector("[data-track]");
      const rect = track.getBoundingClientRect();
      return { scrollY: Math.round(window.scrollY), x: Math.round(rect.left), rectW: Math.round(rect.width) };
    }, sectionSel);
    out[`${label} (mid)`] = mid;

    await scrollTo(info.top + info.height - 2);
    const end = await page.evaluate((sel) => {
      const s = document.querySelector(sel);
      const track = s.querySelector("[data-track]");
      const rect = track.getBoundingClientRect();
      const maxX = track.offsetWidth - window.innerWidth;
      return {
        scrollY: Math.round(window.scrollY),
        x: Math.round(rect.left),
        maxX,
        flush: Math.round(Math.abs(Math.abs(rect.left) - maxX)) <= 20,
      };
    }, sectionSel);
    out[`${label} (end)`] = end;
  };

  const out = {};
  await auditTrack("courses", 'section[aria-label="Courses"]');
  await auditTrack("bookshelf", 'section[aria-label="Reading room"]');

  const bookFocus = await page.evaluate(() => {
    const s = document.querySelector('section[aria-label="Reading room"]');
    const slot = s?.querySelector("[data-track] > div > div > div");
    if (!slot) return null;
    const book = slot.querySelector("button, [role='button']");
    const b = book?.getBoundingClientRect();
    const sRect = s.querySelector("[data-track]").getBoundingClientRect();
    const bookOffset = book ? book.getBoundingClientRect().left - sRect.left : null;
    const content = book ? book.getBoundingClientRect().width : 0;
    return {
      bookInViewportX: b ? Math.round(b.left) : null,
      bookOffsetInTrack: bookOffset !== null ? Math.round(bookOffset) : null,
      centerFraction: bookOffset !== null ? Number(((bookOffset + content / 2) / (s.querySelector("[data-track]").offsetWidth)).toFixed(3)) : null,
    };
  });
  out.bookshelfBookGeometry = bookFocus;

  console.log(JSON.stringify(out, null, 2));
  await browser.close();
})().catch((e) => {
  console.error("AUDIT FAILED:", e.message);
  process.exit(1);
});