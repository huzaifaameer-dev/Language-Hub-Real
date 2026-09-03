import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
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
  afterEach(() => {
    delete process.env.TRUST_PROXY;
  });

  it("prefers the first x-forwarded-for entry only when a proxy is trusted", async () => {
    process.env.TRUST_PROXY = "1";
    const req = new Request("http://localhost/api/x", {
      headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" },
    });
    expect(await clientKey(req, "login")).toBe("1.2.3.4:login");
  });

  it("ignores spoofed x-forwarded-for when no trusted proxy is configured", async () => {
    delete process.env.TRUST_PROXY;
    const req = new Request("http://localhost/api/x", {
      headers: {
        "x-forwarded-for": "9.9.9.9",
        "x-real-ip": "8.8.8.8",
        "cf-connecting-ip": "7.7.7.7",
        "user-agent": "Mozilla/5.0 (superbot v9)",
      },
    });
    expect(await clientKey(req, "login")).toMatch(/^ua:[0-9a-f]+:login$/);
  });

  it("falls back to a user-agent bucket when no client headers exist", async () => {
    const req = new Request("http://localhost/api/x", {
      headers: { "user-agent": "Mozilla/5.0 (superbot v9)" },
    });
    expect(await clientKey(req)).toMatch(/^ua:[0-9a-f]+:$/);
    const other = new Request("http://localhost/api/x", {
      headers: { "user-agent": "curl/8.0" },
    });
    expect(await clientKey(other)).not.toBe(await clientKey(req));
  });
});