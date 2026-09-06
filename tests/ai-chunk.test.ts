import { describe, expect, it } from "vitest";

import {
  chunkText,
  cosineSimilarity,
  hashText,
  keywordScore,
  normalizeTokens,
  truncate,
} from "../lib/ai/chunk";

describe("chunkText", () => {
  it("returns a single chunk for short text", () => {
    const chunks = chunkText("Hello world. This is short.");
    expect(chunks.length).toBe(1);
    expect(chunks[0]).toContain("Hello world");
  });

  it("splits long text into chunks under the size limit", () => {
    const long = "word paragraph\n\n".repeat(0) + ("The quick brown fox jumps over the lazy dog. ".repeat(60));
    const chunks = chunkText(long, 200, 30);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) {
      expect(c.length).toBeLessThanOrEqual(200 + 30 + 64);
    }
  });

  it("preserves the content across chunks (all words still present)", () => {
    const text = Array.from({ length: 120 }, (_, i) => `Token ${i} `).join("");
    const chunks = chunkText(text, 300, 50);
    const joined = chunks.join(" ");
    expect(joined.length).toBeGreaterThanOrEqual(text.trim().length - 1000);
    for (let i = 0; i < 120; i += 10) {
      expect(joined).toContain(`Token ${i}`);
    }
  });

  it("drops empty input", () => {
    expect(chunkText("   \n  ")).toEqual([]);
  });
});

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1, 5);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 5);
  });

  it("returns a value between -1 and 1", () => {
    const s = cosineSimilarity([1, 2, 3], [3, 2, 1]);
    expect(s).toBeGreaterThan(-1.01);
    expect(s).toBeLessThan(1.01);
  });

  it("returns 0 for mismatched lengths", () => {
    expect(cosineSimilarity([1], [1, 2])).toBe(0);
  });
});

describe("keywordScore", () => {
  it("scores higher for directly matching text", () => {
    const s1 = keywordScore("ielts writing band", "IELTS Writing requires a band 7 strategy");
    const s2 = keywordScore("ielts writing band", "The academy opens at nine o'clock on weekdays");
    expect(s1).toBeGreaterThan(s2);
  });

  it("is zero when nothing matches", () => {
    expect(keywordScore("zzqqxx", "nothing related here at all")).toBe(0);
  });

  it("is length-normalised (short relevant docs win over long generic ones)", () => {
    const relevant = keywordScore("duolingo test", "the Duolingo English Test is adaptive and fast");
    const diluted = keywordScore("duolingo test", "the Duolingo test " + "filler ".repeat(400));
    expect(relevant).toBeGreaterThan(diluted);
  });
});

describe("hashText & tokens", () => {
  it("is deterministic and stable length", () => {
    expect(hashText("abc")).toBe(hashText("abc"));
    expect(hashText("abc").length).toBe(40);
  });

  it("normalizes tokens to lowercase alphanumerics", () => {
    expect(normalizeTokens("Hello, World! It's 2026.")).toEqual(["hello", "world", "it", "s", "2026"]);
  });

  it("truncates with an ellipsis", () => {
    expect(truncate("short")).toBe("short");
    expect(truncate("a".repeat(200), 20).length).toBeLessThanOrEqual(20);
    expect(truncate("a".repeat(200), 20)).toMatch(/…$/);
  });
});