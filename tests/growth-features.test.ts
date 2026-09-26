import { describe, expect, it } from "vitest";

import { generateReferralCode } from "../lib/db";
import { autoReplyFor, sendWaText, waConfigured } from "../lib/whatsapp";
import { PLACEMENT_QUESTIONS, calculatePlacement } from "../lib/placement-test-data";
import { DICTS, enDict, urDict, type Lang } from "../lib/i18n";
import { COURSE_FAQS, SUCCESS_STORIES } from "../lib/content";

describe("referral code generation", () => {
  it("produces a stable, URL-safe, unique code from a name + user id", () => {
    const code = generateReferralCode("abc123def", "Javaria Malik");
    expect(code).toMatch(/^[A-Z0-9-]+$/);
    expect(code.length).toBeLessThanOrEqual(16);
    expect(code).toContain("JAVA");
  });

  it("falls back to a default prefix when the name is non-alphabetic", () => {
    const code = generateReferralCode("xyz", "123");
    expect(code).toMatch(/^LH-/);
  });

  it("produces distinct codes for distinct user ids", () => {
    const a = generateReferralCode("user-one", "Ali");
    const b = generateReferralCode("user-two", "Ali");
    expect(a).not.toBe(b);
  });
});

describe("whatsapp auto-reply funnel", () => {
  it("routes demo/booking intent to a lead with a demo category", () => {
    const r = autoReplyFor("I want to book a free demo class");
    expect(r.lead).toBe(true);
    expect(r.category).toBe("demo");
    expect(r.message.length).toBeGreaterThan(0);
  });

  it("routes fee/pricing questions to a pricing lead", () => {
    const r = autoReplyFor("kitnay charges hain fees?");
    expect(r.lead).toBe(true);
    expect(r.category).toBe("pricing");
  });

  it("routes IELTS intent correctly", () => {
    const r = autoReplyFor("how can I get a good ielts band?");
    expect(r.category).toBe("ielts");
    expect(r.lead).toBe(true);
  });

  it("greetings are not counted as leads", () => {
    const r = autoReplyFor("Hello");
    expect(r.lead).toBe(false);
  });

  it("unknown text falls back to a non-lead helper message", () => {
    const r = autoReplyFor("zzzz nonsense");
    expect(r.message.length).toBeGreaterThan(0);
    expect(r.lead).toBe(false);
  });
});

describe("whatsapp send helper config gating", () => {
  it("reports not-configured when no token is set", async () => {
    // This test assumes the CI/test env has no WA_TOKEN — safe default.
    if (!waConfigured()) {
      const res = await sendWaText({ to: "+923001234567", text: "hi" });
      expect(res.ok).toBe(false);
      expect(res.error).toContain("not configured");
    }
  });
});

describe("placement test scoring", () => {
  it("has exactly 20 questions covering all four categories", () => {
    expect(PLACEMENT_QUESTIONS).toHaveLength(20);
    const cats = new Set(PLACEMENT_QUESTIONS.map((q) => q.category));
    expect(cats).toEqual(
      new Set(["grammar", "vocabulary", "reading", "sentence-structure"])
    );
  });

  it("classifies a perfect score as advanced and recommends IELTS", () => {
    const answers = PLACEMENT_QUESTIONS.map((q) => q.correctIndex);
    const result = calculatePlacement(answers);
    expect(result.percentage).toBe(100);
    expect(result.level).toBe("advanced");
    expect(result.recommendedCourse).toBe("IELTS Preparation");
  });

  it("classifies a very low score as beginner and recommends Spoken English", () => {
    const answers = PLACEMENT_QUESTIONS.map(() => 0);
    const result = calculatePlacement(answers);
    expect(result.level).toBe("beginner");
    expect(result.recommendedCourse).toBe("Spoken English");
  });

  it("builds a per-category breakdown that sums to the total", () => {
    const answers = PLACEMENT_QUESTIONS.map((q) => q.correctIndex);
    const result = calculatePlacement(answers);
    const summed = Object.values(result.categoryBreakdown).reduce(
      (acc, c) => acc + c.total,
      0
    );
    expect(summed).toBe(result.total);
  });
});

describe("i18n dictionaries", () => {
  it("every key present in English also exists in Urdu", () => {
    for (const key of Object.keys(enDict)) {
      expect(urDict[key], `missing ur: ${key}`).toBeTruthy();
    }
  });

  it("DICTS resolves both languages to a complete dictionary", () => {
    expect(DICTS.en).toBe(enDict);
    expect(DICTS.ur).toBe(urDict);
    for (const lang of ["en", "ur"] as Lang[]) {
      expect(Object.keys(DICTS[lang]).length).toBeGreaterThan(20);
    }
  });

  it("urdu translations are actually present for key UI strings", () => {
    expect(urDict["nav.courses"]).toBe("کورسز");
    expect(urDict["hero.subtitle"].length).toBeGreaterThan(0);
    expect(urDict["faq.askWhatsApp"].length).toBeGreaterThan(0);
  });
});

describe("per-course FAQ + SEO content", () => {
  it("every public course has a non-empty FAQ set for schema markup", async () => {
    const { FALLBACK_COURSES } = await import("../lib/course-data");
    for (const course of FALLBACK_COURSES) {
      if (!course.active) continue;
      expect(COURSE_FAQS[course.name]?.length).toBeGreaterThan(0);
    }
  });

  it("each FAQ entry has both a question and an answer", () => {
    for (const list of Object.values(COURSE_FAQS)) {
      for (const f of list) {
        expect(f.q.length).toBeGreaterThan(0);
        expect(f.a.length).toBeGreaterThan(0);
      }
    }
  });

  it("success stories all have a slug and a measurable before/after outcome", () => {
    for (const s of SUCCESS_STORIES) {
      expect(s.slug.length).toBeGreaterThan(0);
      expect(s.before.length).toBeGreaterThan(0);
      expect(s.after.length).toBeGreaterThan(0);
      expect(s.highlights.length).toBeGreaterThan(0);
    }
  });
});
