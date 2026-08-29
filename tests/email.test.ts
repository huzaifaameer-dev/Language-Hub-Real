import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { appBaseUrl, sendDecisionEmail, sendResetEmail, sendWelcomeEmail } from "../lib/email";

beforeEach(() => {
  delete process.env.NEXTAUTH_URL;
  delete process.env.AUTH_URL;
  delete process.env.BASE_URL;
});

afterEach(() => {
  delete process.env.NEXTAUTH_URL;
  delete process.env.AUTH_URL;
  delete process.env.BASE_URL;
});

describe("appBaseUrl", () => {
  it("falls back to localhost with trailing slash trimmed", () => {
    expect(appBaseUrl()).toBe("http://localhost:3000");
  });

  it("prefers NEXTAUTH_URL", () => {
    process.env.BASE_URL = "https://backup.example";
    process.env.NEXTAUTH_URL = "https://app.languagehub.example/";
    expect(appBaseUrl()).toBe("https://app.languagehub.example");
  });
});

describe("email dev-link flow (no SMTP)", () => {
  it("reset mail returns a usable devLink and is marked skipped", async () => {
    const result = await sendResetEmail({ to: "a@b.com", name: "Ali", token: "tok-123" });
    expect(result.skipped).toBe(true);
    expect(result.devLink).toBe("http://localhost:3000/reset-password?token=tok-123");
  });

  it("decision and welcome mails skip cleanly without SMTP", async () => {
    const decision = await sendDecisionEmail({
      to: "a@b.com",
      name: "Ali",
      kind: "application",
      approved: true,
      subject: "You are in!",
      href: "/dashboard",
    });
    const welcome = await sendWelcomeEmail({ to: "a@b.com", name: "Sara" });
    expect(decision.skipped).toBe(true);
    expect(welcome.skipped).toBe(true);
  });

  it("logs a dev-only line when SMTP is unconfigured", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await sendWelcomeEmail({ to: "a@b.com", name: "Sara" });
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("[email:dev] to=a@b.com")
    );
    spy.mockRestore();
  });
});