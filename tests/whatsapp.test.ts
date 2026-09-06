import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { verifyWaSignature } from "../lib/whatsapp";

function sign(body: string, secret: string): string {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}

describe("verifyWaSignature", () => {
  it("accepts a correctly-signed raw body", () => {
    const body = JSON.stringify({ entry: [{ changes: [{ value: { messages: [] } }] }] });
    const sig = sign(body, "test-secret");
    expect(verifyWaSignature(sig, body, "test-secret")).toBe(true);
  });

  it("rejects a tampered body", () => {
    const body = JSON.stringify({ entry: ["hi"] });
    const sig = sign(body, "test-secret");
    expect(verifyWaSignature(sig, '{ "entry": ["bye"] }', "test-secret")).toBe(false);
  });

  it("rejects a missing or wrong-format signature", () => {
    expect(verifyWaSignature(null, "{}", "test-secret")).toBe(false);
    expect(verifyWaSignature("the wrong format", "{}", "test-secret")).toBe(false);
  });

  it("fails closed when the secret is not configured", () => {
    const body = "{}";
    const sig = sign(body, "anything");
    expect(verifyWaSignature(sig, body, "")).toBe(false);
  });
});