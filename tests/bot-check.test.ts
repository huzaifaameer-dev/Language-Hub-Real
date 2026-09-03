import { describe, expect, it } from "vitest";

import { botGuardError, isBotSubmission } from "../lib/bot-check";

describe("isBotSubmission (honeypot)", () => {
  it("allows a normal body without honeypot fields", () => {
    expect(isBotSubmission({ name: "Ali", email: "ali@example.com" })).toBe(false);
  });

  it("allows explicitly-empty honeypot fields", () => {
    expect(isBotSubmission({ website: "", company: "" })).toBe(false);
  });

  it("rejects a filled honeypot field", () => {
    expect(isBotSubmission({ name: "Bot", website: "https://spam.example" })).toBe(true);
  });

  it("rejects any populated honeypot key", () => {
    expect(isBotSubmission({ company: "SEO Co" })).toBe(true);
    expect(isBotSubmission({ fax: "12345" })).toBe(true);
    expect(isBotSubmission({ homepage: "x" })).toBe(true);
  });
});

describe("botGuardError", () => {
  it("returns null for a clean object", () => {
    expect(botGuardError({ name: "Ali" })).toBeNull();
  });

  it("returns an error message for a bot submission", () => {
    expect(botGuardError({ website: "spam.example" })).toBe("Submission rejected.");
  });

  it("returns null for non-applicable payloads", () => {
    expect(botGuardError(null)).toBeNull();
    expect(botGuardError("not-an-object")).toBeNull();
    expect(botGuardError([])).toBeNull();
    expect(botGuardError(undefined)).toBeNull();
  });
});
