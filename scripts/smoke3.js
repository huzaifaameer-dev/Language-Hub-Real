/* Feature smoke: journey pinned stepper, book modal, hero emblem, gift text, darker ghosts. */
const puppeteer = require("puppeteer-core");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const URL = "http://localhost:3000";
const SHOT = "C:\\Users\\huzai\\AppData\\Local\\Temp\\opencode\\";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const journeyState = () =>
  page.evaluate(() => {
    const section = document.getElementById("learning");
    const stage = document.querySelector('#learning [class*="lg:block"] h3');
    const line = document.querySelector('#learning [class*="lg:block"] .gold-underline');
    const lineTx = line ? getComputedStyle(line).transform : "n/a";
    const activeNodes = Array.from(
      document.querySelectorAll('#learning [class*="lg:block"] .bg-gold')
    ).length;
    return {
      title: stage ? stage.textContent : null,
      lineTransform: lineTx,
      goldNodes: activeNodes,
      sectionTop: section ? Math.round(section.getBoundingClientRect().top) : null,
    };
  });

const scrollToSection = (id) =>
  page.evaluate((sid) => {
    const el = document.getElementById(sid);
    if (!el) return false;
    const y = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, y);
    return true;
  }, id);

let page;
let errors = [];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"],
    defaultViewport: { width: 1440, height: 900 },
  });

  page = await browser.newPage();
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

  await page.goto(URL, { waitUntil: "networkidle0", timeout: 60000 });
  await sleep(2800);

  /* gift text checks (idle) */
  const idleText = await page.evaluate(() => document.body.innerText.includes("For Ms. Javeria Malik"));
  console.log("gift: idle 'For Ms. Javeria Malik':", idleText);

  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent.includes("Open the Gift")
    );
    btn && btn.click();
  });
  await sleep(800);
  await page.screenshot({ path: SHOT + "07-opening.png" });
  const openingText = await page.evaluate(() =>
    document.body.innerText.includes("Something special is inside")
  );
  console.log("gift: opening note:", openingText);

  /* poll until the reveal line appears */
  let madeFor;
  for (let i = 0; i < 24; i++) {
    madeFor = await page.evaluate(() => {
      const el = document.querySelector('p[aria-label="Made for Ms. Javeria Malik."]');
      return {
        exists: !!el,
        letters: el ? el.querySelectorAll("span").length : 0,
        settled:
          el && Array.from(el.querySelectorAll("span")).every((s) => s.style.opacity === "1"),
      };
    });
    if (madeFor.exists) break;
    await sleep(250);
  }
  /* stagger runs 0.8s + 27 letters x 0.045s ~= 2.0s; sample after it finishes */
  await sleep(2400);
  await page.screenshot({ path: SHOT + "08-made-for.png" });
  madeFor = await page.evaluate(() => {
    const el = document.querySelector('p[aria-label="Made for Ms. Javeria Malik."]');
    return {
      exists: !!el,
      letters: el ? el.querySelectorAll("span").length : 0,
      settled:
        el && Array.from(el.querySelectorAll("span")).every((s) => s.style.opacity === "1"),
    };
  });
  console.log("gift: 'Made for Ms. Javeria Malik.' letters:", JSON.stringify(madeFor));

  /* hero ghost word darkness + emblem structure */
  await sleep(2600);
  const ghost = await page.evaluate(() => {
    const span = Array.from(document.querySelectorAll("#home span")).find(
      (s) => s.textContent.trim() === "language"
    );
    if (!span) return null;
    const cs = getComputedStyle(span);
    return { color: cs.color, fontSize: cs.fontSize };
  });
  console.log("hero: ghost 'language' color:", JSON.stringify(ghost));

  const emblem = await page.evaluate(() => {
    const h1 = document.querySelector("#home h1");
    const plate = Array.from(document.querySelectorAll("#home div")).find((d) =>
      (d.getAttribute("aria-label") || "") === "Language Hub" &&
      d.textContent.includes("Hub of Language Excellence")
    );
    const ringPath = !!document.querySelector("#brand-ring-path");
    const sunburst = Array.from(document.querySelectorAll("#home div")).some((d) =>
      getComputedStyle(d).backgroundImage.includes("repeating-conic-gradient")
    );
    const oldTopRing = document.querySelector("#hero-ring-path");
    return {
      headline: h1 ? h1.textContent.replace(/\s+/g, " ").trim() : null,
      brandPlate: !!plate,
      plateRingPath: ringPath,
      topEmblemGone: !oldTopRing,
      sunburstRemoved: !sunburst,
    };
  });
  console.log("hero: emblem:", JSON.stringify(emblem));

  /* journey pinned stepper */
  await scrollToSection("learning");
  await sleep(1200);
  const steps = [];
  const sample = async () => steps.push(await journeyState());
  await sample();
  for (let i = 0; i < 4; i++) {
    await page.evaluate(() => window.scrollBy(0, 725));
    await sleep(650);
    await sample();
  }
  console.log("journey: card sequence:");
  steps.forEach((s, i) =>
    console.log(`  #${i} top=${s.sectionTop} title="${s.title}" line=${s.lineTransform} goldNodes=${s.goldNodes}`)
  );

  /* after step 5, page should keep scrolling past the pinned journey */
  await page.evaluate(() => window.scrollBy(0, 2200));
  await sleep(900);
  const after = await journeyState();
  const resourcesVisible = await page.evaluate(() => {
    const r = document.getElementById("resources");
    return r ? r.getBoundingClientRect().top < 900 : false;
  });
  console.log("journey: after end — sectionTop:", after.sectionTop, "resources on screen:", resourcesVisible);

  /* resources: click book → modal */
  await scrollToSection("resources");
  await sleep(800);
  await page.evaluate(() => window.scrollBy(0, 300));
  await sleep(900);
  await page.screenshot({ path: SHOT + "09-resources-pinned.png" });

  await page.evaluate(() => {
    const book = document.querySelector('#resources [role="button"]');
    book && book.click();
  });
  await sleep(1100);
  const modal = await page.evaluate(() => {
    const dlg = document.querySelector('[role="dialog"][aria-label*="learning resource"]');
    const cta = dlg
      ? Array.from(dlg.querySelectorAll("button")).find((b) => b.textContent.includes("Start with"))
    : null;
    return {
      exists: !!dlg,
      title: dlg ? dlg.querySelector("h3")?.textContent : null,
      points: dlg ? dlg.querySelectorAll("li").length : 0,
      cta: cta ? cta.textContent.trim() : null,
      bodyLocked: document.body.style.overflow === "hidden",
    };
  });
  console.log("resources: modal:", JSON.stringify(modal));
  await page.screenshot({ path: SHOT + "10-book-modal.png" });

  await page.keyboard.press("Escape");
  await sleep(700);
  const modalClosed = await page.evaluate(() => {
    return {
      gone: !document.querySelector('[role="dialog"][aria-label*="learning resource"]'),
      bodyUnlocked: document.body.style.overflow === "",
    };
  });
  console.log("resources: modal closed:", JSON.stringify(modalClosed));

  /* mobile: journey timeline + book modal */
  await page.setViewport({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(800);
  await scrollToSection("learning");
  await sleep(900);
  const mobileSteps = await page.evaluate(() => {
    const heads = Array.from(document.querySelectorAll("#learning h3")).map((h) => h.textContent);
    const bullets = document.querySelectorAll("#learning ul li").length;
    return { heads, bullets };
  });
  console.log("journey: mobile timeline:", JSON.stringify(mobileSteps));

  await scrollToSection("resources");
  await sleep(800);
  await page.evaluate(() => {
    const book = document.querySelector('#resources [role="button"]');
    book && book.click();
  });
  await sleep(1000);
  const mobileModal = await page.evaluate(() => {
    const dlg = document.querySelector('[role="dialog"][aria-label*="learning resource"]');
    return dlg ? !!dlg.querySelector("h3") : false;
  });
  console.log("resources: mobile modal opens:", mobileModal);

  console.log("console errors:", errors.length ? errors.slice(0, 5) : "none");
  await browser.close();
})().catch((e) => {
  console.error("SMOKE TEST 3 FAILED:", e.message);
  process.exit(1);
});
