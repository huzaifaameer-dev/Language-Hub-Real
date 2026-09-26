import { describe, expect, it } from "vitest";

import { FALLBACK_COURSES } from "../lib/course-data";
import {
  corpusFromBlog,
  corpusFromCourses,
  corpusFromFaq,
  corpusFromFeatures,
} from "../lib/ai/knowledge";

describe("corpusFromCourses", () => {
  it("emits one overview chunk per course plus one per module", () => {
    const items = corpusFromCourses(FALLBACK_COURSES);
    const courseNames = FALLBACK_COURSES.map((c) => c.name);
    for (const name of courseNames) {
      expect(items.some((i) => i.kind === "course" && i.sourceId === name)).toBe(true);
    }
    const moduleItems = items.filter((i) => i.kind === "module");
    expect(moduleItems.length).toBeGreaterThan(0);
    for (const m of moduleItems) {
      expect(m.title).toContain("(");
      expect(m.text).toContain("Topics:");
    }
  });

  it("includes outcomes and description in the course overview", () => {
    const overview = corpusFromCourses(FALLBACK_COURSES).find(
      (i) => i.sourceId === "IELTS General & Academic" && i.kind === "course"
    );
    expect(overview).toBeDefined();
    expect(overview!.text).toContain("Band 6.5+");
  });
});

describe("corpusFromFaq", () => {
  it("covers the academy FAQ and per-course FAQ", () => {
    const items = corpusFromFaq();
    expect(items.some((i) => i.title.toLowerCase().includes("demo class"))).toBe(true);
    expect(items.some((i) => i.sourceId.startsWith("course-faq::IELTS"))).toBe(true);
  });

  it("keeps the question and answer together", () => {
    const items = corpusFromFaq();
    for (const i of items) {
      expect(i.text).toContain(i.title);
    }
  });
});

describe("corpusFromFeatures", () => {
  it("emits a feature blurb for every course", () => {
    const items = corpusFromFeatures();
    expect(items.length).toBe(FALLBACK_COURSES.length);
    expect(items[0].text).toContain("features:");
  });
});

describe("corpusFromBlog", () => {
  it("creates a title chunk plus paragraph chunks per post", () => {
    const posts = [
      { title: "How to ace IELTS", excerpt: "A guide", content: "Para one.\n\nPara two with more detail.", slug: "ace-ielts" },
    ];
    const items = corpusFromBlog(posts);
    expect(items.some((i) => i.text.includes("A guide"))).toBe(true);
    expect(items.filter((i) => i.text === "Para one.").length).toBe(1);
    expect(items.filter((i) => i.text === "Para two with more detail.").length).toBe(1);
    expect(items.every((i) => i.sourceId.startsWith("blog::ace-ielts"))).toBe(true);
  });
});