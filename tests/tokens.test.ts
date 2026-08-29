import { describe, expect, it } from "vitest";
import { generateToken, hashToken } from "../lib/tokens";

describe("tokens", () => {
  it("hashToken is a stable 64-char sha256 hex digest", () => {
    const a = hashToken("abc-123");
    const b = hashToken("abc-123");
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).toBe(b);
    expect(hashToken("abc-124")).not.toBe(a);
  });

  it("generateToken yields unique, url-safe tokens of expected length", () => {
    const t1 = generateToken();
    const t2 = generateToken();
    expect(t1).toMatch(/^[0-9a-f]{64}$/);
    expect(t1).not.toBe(t2);
    expect(generateToken(16)).toHaveLength(32);
  });
});