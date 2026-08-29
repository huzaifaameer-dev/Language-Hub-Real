import { describe, expect, it, vi, beforeEach } from "vitest";
import { clientKey, rateLimit } from "../lib/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => vi.useFakeTimers());

  it("allows up to the limit inside a window then blocks", () => {
    expect(rateLimit("k1", 3, 60_000).ok).toBe(true);
    expect(rateLimit("k1", 3, 60_000).ok).toBe(true);
    expect(rateLimit("k1", 3, 60_000).ok).toBe(true);
    const blocked = rateLimit("k1", 3, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("resets after the window elapses", () => {
    rateLimit("k2", 1, 10_000);
    expect(rateLimit("k2", 1, 10_000).ok).toBe(false);
    vi.advanceTimersByTime(10_001);
    expect(rateLimit("k2", 1, 10_000).ok).toBe(true);
  });

  it("keys are independent", () => {
    rateLimit("a", 1, 60_000);
    expect(rateLimit("b", 1, 60_000).ok).toBe(true);
    expect(rateLimit("a", 1, 60_000).ok).toBe(false);
  });
});

describe("clientKey", () => {
  it("prefers the first x-forwarded-for entry", () => {
    const req = new Request("http://localhost/api/x", {
      headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" },
    });
    expect(clientKey(req, "login")).toBe("1.2.3.4:login");
  });

  it("falls back to unknown", () => {
    const req = new Request("http://localhost/api/x");
    expect(clientKey(req)).toBe("unknown:");
  });
});