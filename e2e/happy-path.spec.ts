import { test, expect } from "@playwright/test";

// Admin credentials come from env (set to match the server-under-test), never
// production values. CI supplies its own fixtures via LH_TEST_ADMIN_*.
const ADMIN_EMAIL = process.env.LH_TEST_ADMIN_EMAIL ?? "ci.e2e.admin@languagehub.test";
const ADMIN_PASS = process.env.LH_TEST_ADMIN_PASSWORD ?? "E2e-Test-Admin-Pass-9x!";
const ADMIN_CODE = process.env.LH_TEST_ADMIN_ACCESS_CODE ?? "E2E-TEST-ACCESS-9x";

const random = () => Math.random().toString(36).slice(2, 10);
const EMAIL = `hp-${Date.now()}-${random()}@example.com`;
const NAME = `Happy ${random()}`;
const PASSWORD = "HappyPath!2026";

// 1x1 transparent PNG used as proxy the browser photo upload.
const PHOTO_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="; // 1x1 transparent PNG (real, decodable)

test("signup -> register for a course -> admin sees + contacts the registration", async ({
  browser,
  request,
  baseURL,
}) => {
  test.setTimeout(300_000);

  // 1 —— user signs up and lands on the dashboard
  const user = await browser.newContext();
  const up = await user.newPage();
  await up.goto("/signup");
  await up.locator("#signup-name").fill(NAME);
  await up.locator("#signup-email").fill(EMAIL);
  await up.locator("#signup-password").fill(PASSWORD);
  await up.getByRole("button", { name: /Create Account/i }).click();
  await expect(up).toHaveURL(/\/dashboard/, { timeout: 25_000 });

  // 2 —— user picks the Spoken English course card
  await expect(up.locator("body")).toContainText(/Choose your course/i, { timeout: 20_000 });
  await up.getByRole("button", { name: /Spoken English.*Register/i }).click();

  const wizard = up.getByRole("dialog", { name: "Spoken English registration form" });
  await expect(wizard).toBeVisible({ timeout: 15_000 });

  // 3 —— step 1: personal details + photo
  await wizard.locator("#reg-dob").fill("2001-05-14");
  await wizard.locator("#reg-phone").fill("+92 300 1234567");
  await wizard.locator("#reg-address").fill("Gulberg III, Lahore, Pakistan");

  const photoInput = wizard.locator('input[type="file"][accept="image/png,image/jpeg,image/webp"]');
  await photoInput.setInputFiles({
    name: "photo.png",
    mimeType: "image/png",
    buffer: Buffer.from(PHOTO_B64, "base64"),
  });
  await wizard.getByRole("button", { name: /Next/i }).click();

  // 4 —— step 2: academics
  await expect(wizard.locator("#reg-qualification")).toBeVisible();
  await wizard.locator("#reg-qualification").fill("Bachelor of Science");
  await wizard.locator("#reg-institution").fill("University of the Punjab");
  await wizard.locator("#reg-year").fill("2023");
  await wizard.getByRole("button", { name: /Next/i }).click();

  // 5 —— step 3: study preferences
  await expect(wizard).toContainText(/Which skill do you want to enhance/);
  await wizard.getByRole("button", { name: /^Fluency$/ }).click();
  await wizard.getByRole("button", { name: /^Everyday conversation$/ }).click();
  await wizard.getByRole("button", { name: /^Evening$/ }).click();
  await wizard.getByRole("button", { name: /^Average$/ }).click();
  await wizard.getByRole("button", { name: /^6 – 10 hours$/ }).click();
  await wizard.getByRole("button", { name: /^Instagram$/ }).click();
  await wizard.getByRole("button", { name: /Next/i }).click();

  // 6 —— step 4: payment + receipt
  await expect(wizard).toContainText(/Payment method/i);
  await wizard.getByRole("button", { name: /^Easypaisa$/ }).click();

  const receiptInput = wizard.locator('input[type="file"][accept*="application/pdf"]');
  await receiptInput.setInputFiles({
    name: "receipt.png",
    mimeType: "image/png",
    buffer: Buffer.from(PHOTO_B64, "base64"),
  });
  await expect(wizard).toContainText(/Uploaded/i, { timeout: 10_000 });
  await wizard.getByRole("button", { name: /Next/i }).click();

  // 7 —— step 5: review + declaration + submit
  await expect(wizard).toContainText(/Review & submit/i, { timeout: 30_000 });
  await wizard.locator("#reg-agree").check();
  await wizard.getByRole("button", { name: /Submit registration/i }).click();

  // 8 —— success screen with a reference + 24h promise
  await expect(wizard).toContainText(/THANK YOU FOR CHOOSING/i, { timeout: 30_000 });
  await expect(wizard).toContainText(/reply within 24 hours/i);
  await wizard.getByRole("button", { name: /^Done/ }).click();

  // Dashboard shows "My registrations" entry for this submission.
  await expect(up.locator("body")).toContainText(/My registrations/i, { timeout: 20_000 });
  await expect(up.locator("body")).toContainText(/Received/i);

  // 9 —— admin unlocks the panel, opens Registration desk, finds the entry
  const admin = await browser.newContext({ baseURL });
  const ap = await admin.newPage();
  await ap.goto("/admin-panel");
  await ap.locator("#ag-email").fill(ADMIN_EMAIL);
  await ap.locator("#ag-pass").fill(ADMIN_PASS);
  await ap.locator("#ag-code").fill(ADMIN_CODE);
  await ap.getByRole("button", { name: /Unlock Panel/i }).click();
  await expect(ap.locator("body")).toContainText(/Course Registrations/i, { timeout: 30_000 });

  // The admin token cookie is marked Secure; over http the standalone request
  // client skips it (browsers exempt loopback). Pass it through explicitly.
  const token = (await admin.cookies()).find((c) => c.name === "hub_admin_token")?.value;
  expect(token, "admin token cookie is set").toBeTruthy();
  const adminHeaders = { cookie: `hub_admin_token=${token}` };

  let reg: { id: string; email: string; ref: string; status: string } | undefined;
  for (let i = 0; i < 20 && !reg; i += 1) {
    const res = await request.get("/api/admin/registrations", { headers: adminHeaders });
    expect(res.ok(), `GET registrations -> ${res.status()}: ${await res.text()}`).toBeTruthy();
    const { registrations } = (await res.json()) as {
      registrations: Array<{ id: string; email: string; ref: string; status: string }>;
    };
    reg = registrations.find((r) => r.email === EMAIL);
    if (!reg) await new Promise((r) => setTimeout(r, 600));
  }
  expect(reg, "registration landed in the admin queue").toBeTruthy();

  // 10 —— admin marks it contacted
  const patch = await request.patch("/api/admin/registrations", {
    headers: adminHeaders,
    data: { id: reg!.id, status: "CONTACTED", message: "Thanks — we'll call within 24h." },
  });
  expect(patch.ok(), `PATCH registration -> ${patch.status()}: ${await patch.text()}`).toBeTruthy();

  await admin.close();
  await user.close();
});