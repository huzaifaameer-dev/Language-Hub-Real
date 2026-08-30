import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = "huzaifa.ameer.2009@gmail.com";
const ADMIN_PASS = "Hub!Admin2026Secure";
const ADMIN_CODE = "LH-2026-SECURE-KEY";

const random = () => Math.random().toString(36).slice(2, 10);
const EMAIL = `hp-${Date.now()}-${random()}@example.com`;
const NAME = `Happy ${random()}`;
const PASSWORD = "HappyPath!2026";

const re = (s: string) => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

test("signup -> apply -> admin approve -> enroll -> admin confirm", async ({
  browser,
  request,
  baseURL,
}) => {
  test.setTimeout(300_000);

  // Choose a course with at least one open seat in the live catalog.
  const cat = (await (await request.get("/api/courses")).json()) as {
    courses: Array<{
      name: string;
      batches: Array<{ name: string; seatsLeft: number; full: boolean }>;
    }>;
  };
  expect(cat.courses.length).toBeGreaterThan(0);
  const course = cat.courses.find((c) => c.batches.some((b) => !b.full)) ?? cat.courses[0];
  const batch = course.batches.find((b) => !b.full) ?? course.batches[0];
  expect(batch, "course must have an open batch").toBeTruthy();

  // 1 —— user signs up and lands on the dashboard
  const user = await browser.newContext();
  const up = await user.newPage();
  await up.goto("/signup");
  await up.locator("#signup-name").fill(NAME);
  await up.locator("#signup-email").fill(EMAIL);
  await up.locator("#signup-password").fill(PASSWORD);
  await up.getByRole("button", { name: /Create Account/i }).click();
  await expect(up).toHaveURL(/\/dashboard/, { timeout: 25_000 });

  // 2 —— user applies
  await up.locator("#f-name").fill(NAME);
  await up.locator("#f-place").fill("Lahore, Pakistan");
  await up
    .locator("#f-bio")
    .fill("I want to speak English with confidence for daily life and interviews.");
  await up.locator("#f-course").selectOption({ label: course.name });
  await up.locator("#f-message").fill("Happy-path E2E application from " + EMAIL);
  await up.getByRole("button", { name: /Submit Application/i }).click();
  await expect(
    up.getByRole("dialog", { name: "Application sent" }),
    "application confirmation dialog"
  ).toBeVisible({ timeout: 25_000 });

  // 3 —— admin unlocks the panel (UI), then approves via the real admin API
  const admin = await browser.newContext({ baseURL });
  const ap = await admin.newPage();
  await ap.goto("/admin-panel");
  await ap.locator("#ag-email").fill(ADMIN_EMAIL);
  await ap.locator("#ag-pass").fill(ADMIN_PASS);
  await ap.locator("#ag-code").fill(ADMIN_CODE);
  await ap.getByRole("button", { name: /Unlock Panel/i }).click();
  await expect(ap.locator("body")).toContainText(/Command Center|Operations/i, {
    timeout: 30_000,
  });

  // The admin token cookie is marked Secure; over http the standalone request
  // client skips it (browsers exempt loopback). Pass it through explicitly.
  const token = (await admin.cookies()).find((c) => c.name === "hub_admin_token")?.value;
  expect(token, "admin token cookie is set").toBeTruthy();
  const adminHeaders = { cookie: `hub_admin_token=${token}` };

  const appsRes = await request.get("/api/admin/applications?status=PENDING", {
    headers: adminHeaders,
  });
  expect(
    appsRes.ok(),
    `GET applications -> ${appsRes.status()}: ${await appsRes.text()}`
  ).toBeTruthy();
  const { applications } = (await appsRes.json()) as {
    applications: Array<{ id: string; email: string; status: string }>;
  };
  const app = applications.find((a) => a.email === EMAIL);
  expect(app, "application reaches the admin queue").toBeTruthy();
  const approveRes = await request.patch("/api/admin/applications", {
    headers: adminHeaders,
    data: { id: app!.id, action: "APPROVE", message: "Welcome to Language Hub!" },
  });
  expect(approveRes.ok(), `approve failed: ${approveRes.statusText()}`).toBeTruthy();

  // 4 —— user enrolls (dashboard live-syncs the approval)
  await expect(
    up.getByRole("button", { name: /Proceed to Enrollment/i }),
    "enroll CTA appears after approval"
  ).toBeVisible({ timeout: 30_000 });
  await up.getByRole("button", { name: /Proceed to Enrollment/i }).click();
  const enrDialog = up.getByRole("dialog", { name: "Enroll in courses" });
  await expect(enrDialog).toBeVisible({ timeout: 15_000 });
  await enrDialog.getByRole("button", { name: re(course.name) }).first().click();
  await enrDialog.getByRole("button", { name: re(batch.name) }).first().click();
  await enrDialog.locator("#enr-plan").fill("Twice a week — beginner friendly.");
  await enrDialog.getByRole("button", { name: /Confirm Enrollment/i }).click();
  await expect(up.locator("body")).toContainText(/ENROLLMENT[\s\S]*SENT/i, {
    timeout: 25_000,
  });

  // 5 —— admin confirms the seat via the real admin API
  const enrsRes = await request.get("/api/admin/enrollments?status=PENDING", {
    headers: adminHeaders,
  });
  expect(
    enrsRes.ok(),
    `GET enrollments -> ${enrsRes.status()}: ${await enrsRes.text()}`
  ).toBeTruthy();
  const { enrollments } = (await enrsRes.json()) as {
    enrollments: Array<{ id: string; email: string; status: string }>;
  };
  const enr = enrollments.find((e) => e.email === EMAIL);
  expect(enr, "enrollment reaches the admin queue").toBeTruthy();
  const enrollRes = await request.patch("/api/admin/enrollments", {
    headers: adminHeaders,
    data: { id: enr!.id, action: "ENROLL", message: "Seat locked — see your books!" },
  });
  expect(enrollRes.ok(), `enroll failed: ${enrollRes.statusText()}`).toBeTruthy();

  // 6 —— user sees the fully-onboarded state (celebration overlay is a
// transient 5s animation; the persistent state below is the stable proof).
  await up.reload();
  await expect(up.locator("body"), "journey is fully onboarded").toContainText(
    /FULLY ONBOARDED/i,
    { timeout: 30_000 }
  );
  await expect(up.locator("#lh-bookshelf"), "assigned bookshelf is shown").toBeVisible({
    timeout: 20_000,
  });
  await expect(up.locator("body"), "enrollment is confirmed").toContainText(
    /SEAT\s+CONFIRMED/i,
    { timeout: 20_000 }
  );
  await expect(up.locator("body"), "admin reply is visible on the dashboard").toContainText(
    /Seat locked — see your books!/i
  );

  await admin.close();
  await user.close();
});