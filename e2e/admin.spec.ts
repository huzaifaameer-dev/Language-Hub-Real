import { test, expect } from "@playwright/test";

// Admin credentials come from env (set to match the server-under-test), never
// production values. CI supplies its own fixtures via LH_TEST_ADMIN_*.
const ADMIN_EMAIL = process.env.LH_TEST_ADMIN_EMAIL ?? "ci.e2e.admin@languagehub.test";
const ADMIN_PASS = process.env.LH_TEST_ADMIN_PASSWORD ?? "E2e-Test-Admin-Pass-9x!";
const ADMIN_CODE = process.env.LH_TEST_ADMIN_ACCESS_CODE ?? "E2E-TEST-ACCESS-9x";

test("admin gate unlock -> user directory tab", async ({ page }) => {
  await page.goto("/admin-panel");
  await page.locator("#ag-email").fill(ADMIN_EMAIL);
  await page.locator("#ag-pass").fill(ADMIN_PASS);
  await page.locator("#ag-code").fill(ADMIN_CODE);
  await page.getByRole("button", { name: /Unlock Panel/i }).click();

  await expect(page.locator("body")).toContainText(/Operations|Command Center/i, {
    timeout: 25_000,
  });

  // Applications tab shows the queue
  await expect(page.locator("body")).toContainText(/Applications/i);

  // Students tab
  await page.evaluate(() => {
    const b = [...document.querySelectorAll("aside button")].find((x) => /Students/.test(x.textContent ?? ""));
    (b as HTMLButtonElement | undefined)?.click();
  });
  await expect(page.locator("body")).toContainText(/User Directory/i, { timeout: 20_000 });
  await expect(page.getByRole("button", { name: /Export CSV/i })).toBeEnabled();
});