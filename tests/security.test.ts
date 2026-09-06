import { describe, expect, it } from "vitest";
import {
  classifyThreat,
  HONEYPOT_PATHS,
  strikeLimit,
  blockWindowMs,
  isBlocked,
  shieldClientKey,
  STOPPED,
} from "../lib/security/shield";

describe("shield classifyThreat", () => {
  it("detects the classic payloads", () => {
    expect(classifyThreat({ path: "/api/courses", query: "id=1' OR '1'='1" })).toBe("SQLI");
    expect(classifyThreat({ path: "/blog", query: "q=<script>alert(1)</script>" })).toBe("XSS");
    expect(classifyThreat({ path: "/api/profile", query: "file=../../etc/passwd" })).toBe("PATH_TRAVERSAL");
    expect(classifyThreat({ path: "/api/courses", query: "$where=1" })).toBe("NOSQLI");
    expect(classifyThreat({ path: "/api/courses", query: "id=1&debug=1" })).toBe("RECON");
  });

  it("flags honeypot paths automatically", () => {
    for (const p of ["/.env", "/.git/config", "/wp-login.php", "/phpmyadmin"]) {
      expect(classifyThreat({ path: p }), p).toBe("HONEYPOT");
    }
    expect(HONEYPOT_PATHS.length).toBeGreaterThan(5);
  });

  it("leaves ordinary traffic alone", () => {
    expect(classifyThreat({ path: "/", query: "" })).toBeNull();
    expect(classifyThreat({ path: "/blog/ielts-tips", query: "tag=studying" })).toBeNull();
    expect(classifyThreat({ path: "/api/courses", query: "name=spoken-english" })).toBeNull();
  });

  it("provides a generic response string per threat", () => {
    expect(STOPPED.HONEYPOT).toMatch(/does not exist/);
    expect(STOPPED.SQLI).toMatch(/rejected/);
  });
});

describe("shield strikes / blocks", () => {
  it("escalates strikes into a block with backoff", () => {
    const limit = strikeLimit();
    expect(isBlocked(limit, Date.now() + 1000)).toBe(true);
    expect(isBlocked(0, undefined)).toBe(false);
    expect(blockWindowMs(limit)).toBeGreaterThanOrEqual(30_000);
    // Backoff doubles the window after each extra strike-limit threshold.
    expect(blockWindowMs(limit + limit)).toBe(blockWindowMs(limit) * 2);
  });

  it("derives a stable client key from IP when present", () => {
    expect(shieldClientKey({ "x-forwarded-for": "203.0.113.9" })).toBe("ip:203.0.113.9");
    expect(shieldClientKey({ "user-agent": "scanner" })).toMatch(/^ua:/);
  });
});