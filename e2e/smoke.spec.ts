import { test, expect } from "@playwright/test";

test.describe("public smoke", () => {
  test("home renders core content with no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(e.message));

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(page.getByRole("region", { name: /Courses/i }).first()).toBeVisible();
    expect(errors.filter((e) => !/favicon/.test(e))).toEqual([]);
  });

  test("Aina guide launcher is present and opens the dialog", async ({ page }) => {
    await page.goto("/");
    const launcher = page.getByRole("button", { name: /Open guide/i });
    await expect(launcher).toBeVisible();
    await launcher.click();
    await expect(page.getByRole("dialog", { name: /Aina|آئینہ/i }).first()).toBeVisible();
    await expect(page.getByPlaceholder(/Ask about|کورسز/).first()).toBeVisible();
  });

  test("auth pages are reachable", async ({ page }) => {
    for (const path of ["/login", "/signup"]) {
      await page.goto(path);
      await expect(page).toHaveTitle(/Language Hub/);
    }
  });

  test("admin panel is gated", async ({ page }) => {
    await page.goto("/admin-panel");
    await expect(page.locator("#ag-email")).toBeVisible();
  });

  test("health endpoint reports ok", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.db).toBe("up");
  });

  test("rate limiter returns 429 on abuse", async ({ request }) => {
    const email = `rl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
    const statuses: number[] = [];
    for (let i = 0; i < 7; i += 1) {
      const res = await request.post("/api/auth/forgot", {
        data: { email },
      });
      statuses.push(res.status());
    }
    expect(statuses.slice(0, 5)).toEqual([200, 200, 200, 200, 200]);
    expect(statuses).toContain(429);
  });
});