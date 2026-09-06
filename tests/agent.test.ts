import { describe, expect, it } from "vitest";
import {
  applicationQualityOk,
  decideApplication,
  decideEnrollment,
  feeForCourse,
  paymentInstructionsFor,
  slugifyBlog,
} from "../lib/ai/agent/rules";
import { offlineBlog, svgCover } from "../lib/ai/agent/blog";
import { decisionAmount } from "../lib/ai/agent/tools";

const app = (o: Partial<{ name: string; email: string; bio: string; message: string; course: string }>) => ({
  userId: "u1",
  name: "Ali",
  email: "ali@example.com",
  bio: "A short but complete introduction about me and my goals.",
  message: "",
  course: "IELTS Preparation",
  createdAt: new Date(),
  ...o,
});

describe("applicationQualityOk", () => {
  it("passes a valid application", () => {
    const r = applicationQualityOk(app({}));
    expect(r.ok).toBe(true);
    expect(r.problems).toHaveLength(0);
  });

  it("rejects an invalid email", () => {
    expect(applicationQualityOk(app({ email: "not-an-email" })).ok).toBe(false);
  });

  it("rejects a too-short name and quotes the problem", () => {
    const r = applicationQualityOk(app({ name: "A" }));
    expect(r.ok).toBe(false);
    expect(r.problems.some((p) => p.includes("Name"))).toBe(true);
  });

  it("rejects near-empty free text", () => {
    const r = applicationQualityOk(app({ bio: "", message: "hi" }));
    expect(r.ok).toBe(false);
  });
});

describe("decideApplication", () => {
  it("approves a clean application (seats are unlimited)", () => {
    const d = decideApplication(app({}));
    expect(d.action).toBe("APPROVE");
    expect((d as { message: string }).message).toMatch(/enroll/i);
  });

  it("asks for a goal (clarify) when the application has no substance", () => {
    const d = decideApplication(app({ bio: "", message: "hi" }));
    expect(d.action).toBe("CLARIFY");
    expect((d as { message: string }).message).toMatch(/1–2 lines|goal/);
  });

  it("rejects (genuine blocker) only when the contact is unusable", () => {
    const d = decideApplication(app({ email: "broken-email" }));
    expect(d.action).toBe("REJECT");
    expect((d as { reason: string }).reason).toMatch(/contact|email/i);
  });
});

describe("decideEnrollment", () => {
  const enr = (o: Partial<{ status: string; email: string; paymentProof: string | null; batch: string }>) => ({
    userId: "u1",
    email: "ali@example.com",
    name: "Ali",
    subjects: ["IELTS Preparation"],
    batch: "Morning",
    status: "PENDING",
    paymentProof: null,
    paymentMethod: "easypaisa",
    createdAt: new Date(),
    ...o,
  });

  it("confirms when payment proof is uploaded and records the course fee", () => {
    const d = decideEnrollment(enr({ status: "PROOF_SUBMITTED", paymentProof: "/api/proof/x" }), 12000);
    expect(d.action).toBe("CONFIRM");
    expect((d as { amount: number }).amount).toBe(12000);
  });

  it("requests payment for a valid pending enrollment", () => {
    const d = decideEnrollment(enr({}), 12000);
    expect(d.action).toBe("REQUEST_PAYMENT");
    expect((d as { paymentInstructions: string }).paymentInstructions.length).toBeGreaterThan(10);
  });

  it("rejects (real blocker) an unusable enrollment email", () => {
    const d = decideEnrollment(enr({ email: "broken" }), 12000);
    expect(d.action).toBe("REJECT");
    expect((d as { message: string }).message).toMatch(/email/);
  });
});

describe("catalog helpers", () => {
  it("looks up fees from the catalog", () => {
    expect(feeForCourse("IELTS Preparation", [{ name: "IELTS Preparation", fee: 12000 }])).toBe(12000);
    expect(feeForCourse("nope", [])).toBe(0);
  });

  it("builds stable payment instructions", () => {
    const a = paymentInstructionsFor("easypaisa", ["0312", "3456789"]);
    const b = paymentInstructionsFor("easypaisa", ["0312", "3456789"]);
    expect(a).toBe(b); // deterministic within a method
    expect(a).toMatch(/easypaisa to|JazzCash to|bank transfer/);
  });
});

describe("slugifyBlog", () => {
  it("generates a slug with a uniqueness suffix", () => {
    const s = slugifyBlog("How to Ace IELTS Writing!");
    expect(s).toMatch(/^how-to-ace-ielts-writing-[a-z0-9]{4}$/);
    expect(slugifyBlog("How to Ace IELTS Writing!")).not.toBe(s);
  });
});

describe("AI blog (offline)", () => {
  it("produces a publish-ready post with cover art", () => {
    const post = offlineBlog({ topic: "Present perfect tense" });
    expect(post.title.length).toBeGreaterThan(5);
    expect(post.excerpt.length).toBeGreaterThan(5);
    expect(post.content).toMatch(/^## /m);
    expect(post.coverImage).toMatch(/^data:image\/svg\+xml;base64,/);
    expect(post.tags.length).toBeGreaterThan(0);
  });

  it("makes branded SVG covers", () => {
    const cover = svgCover("IELTS tips");
    expect(cover).toMatch(/^data:image\/svg\+xml;base64,/);
    const raw = Buffer.from(cover.split(",")[1], "base64").toString("utf8");
    expect(raw).toContain("Language Hub");
    const gold = Buffer.from(svgCover("IELTS tips", "gold").split(",")[1], "base64").toString("utf8");
    expect(gold).toContain("#f59e0b");
  });
});

describe("agent amount guard", () => {
  it("only accepts sane positive amounts", () => {
    expect(decisionAmount({ amount: 12000 })).toBe(12000);
    expect(decisionAmount({ amount: -5 })).toBe(0);
    expect(decisionAmount({ amount: "abc" as never })).toBe(0);
    expect(decisionAmount({ amount: 123.4 })).toBe(123);
  });
});