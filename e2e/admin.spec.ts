import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = "huzaifa.ameer.2009@gmail.com";
const ADMIN_PASS = "Hub!Admin2026Secure";
const ADMIN_CODE = "LH-2026-SECURE-KEY";

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