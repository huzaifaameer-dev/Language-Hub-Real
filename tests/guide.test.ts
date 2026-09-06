import { describe, expect, it } from "vitest";
import { offlineGuideReply, guideScripts } from "../lib/guide/guide";
import { guideSystemPrompt, GUIDE_FACTS } from "../lib/guide/persona";

describe("offlineGuideReply (deterministic, no AI key)", () => {
  it("greets warmly on a hello", () => {
    const en = offlineGuideReply("Assalam o alaikum!", "en");
    expect(en).toMatch(/Welcome to Language Hub/i);

    const ur = offlineGuideReply("السلام علیکم", "ur");
    expect(ur).toContain("خوش آمدید");
  });

  it("detects each course intent", () => {
    expect(offlineGuideReply("Tell me about IELTS", "en")).toMatch(/IELTS/i);
    expect(offlineGuideReply("What is PTE about?", "en")).toMatch(/computer-based/);
    expect(offlineGuideReply("Duolingo test details", "en")).toMatch(/six week/i);
    expect(offlineGuideReply("Spoken English classes", "en")).toMatch(/four month/i);
  });

  it("answers fees, placement, sign-up, demo and thanks intents", () => {
    expect(offlineGuideReply("How much are the fees?", "en")).toMatch(/eight thousand rupees/i);
    expect(offlineGuideReply("placement test", "en")).toMatch(/placement/i);
    expect(offlineGuideReply("how do I sign up", "en")).toMatch(/Sign up/i);
    expect(offlineGuideReply("book a demo call", "en")).toMatch(/demo/i);
    expect(offlineGuideReply("thank you", "en")).toMatch(/welcome/i);
  });

  it("offers a tour for navigation-ish requests", () => {
    const tour = offlineGuideReply("take me on a quick tour", "en");
    expect(tour).toMatch(/tour|show you around/i);
  });

  it("falls back gracefully to the default offer", () => {
    const reply = offlineGuideReply("what time is the sun up?", "en");
    expect(reply).toMatch(/what would you like to know/i);
  });

  it("responds in Urdu when asked in Urdu", () => {
    const ur = offlineGuideReply("آئی ایل ٹی ایس کیا ہے؟", "ur");
    expect(ur).toContain("آئی ایل ٹی ایس");
    expect(ur.length).toBeGreaterThan(20);
  });

  it("keeps replies spoken-word friendly (no markdown flourishes)", () => {
    for (const q of ["hello", "fees", "ielts", "demo", "placement"]) {
      const reply = offlineGuideReply(q, "en");
      expect(reply).not.toMatch(/[*_#`>]/);
      expect(reply.length).toBeLessThan(400);
    }
  });
});

describe("guideSystemPrompt (Aina persona)", () => {
  it("asks for English when EN and Urdu when UR", () => {
    expect(guideSystemPrompt("", "en")).toMatch(/Respond in English/);
    expect(guideSystemPrompt("", "ur")).toMatch(/Respond in Urdu/);
  });

  it("falls back to the spoken guide facts when context is empty", () => {
    const prompt = guideSystemPrompt("", "en");
    expect(prompt).toContain(GUIDE_FACTS);
    expect(prompt).toMatch(/[Nn]ever invent fees/);
  });

  it("prefers retrieved context when provided", () => {
    const prompt = guideSystemPrompt("IELTS: 3 months, weekly mocks.", "en");
    expect(prompt).toContain("IELTS: 3 months, weekly mocks.");
  });

  it("bakes the visitor name in when given", () => {
    expect(guideSystemPrompt("", "en", "Ali")).toContain("Ali");
  });

  it("forbids emoji, tables and heavy markdown in replies", () => {
    const prompt = guideSystemPrompt("", "en");
    expect(prompt).toMatch(/never use markdown/);
    expect(prompt).toMatch(/emoji/);
  });
});

describe("guideScripts", () => {
  it("returns a greeting and welcome-back for each language", () => {
    const en = guideScripts("en");
    expect(en.greeting).toContain("Assalam o alaikum");
    expect(en.welcomeBack.length).toBeGreaterThan(20);
    expect(en.quickTour.length).toBeGreaterThan(20);

    const ur = guideScripts("ur");
    expect(ur.greeting).toContain("السلام علیکم");
    expect(ur.welcomeBack.length).toBeGreaterThan(20);
  });
});