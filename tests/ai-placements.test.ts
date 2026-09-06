import { describe, expect, it } from "vitest";

import { calculatePlacement } from "../lib/placement-test-data";
import {
  analyzePlacementFallback,
  buildPlacementPrompt,
} from "../lib/ai/placements";
import type { PlacementInput } from "../lib/ai/placements";

const ALL_CORRECT: number[] = [1, 2, 3, 1, 1, 2, 1, 2, 2, 1, 1, 1, 1, 1, 1, 2, 2, 2, 0, 1];
const ALL_WRONG: number[] = ALL_CORRECT.map((c) => (c + 1) % 4);

function inputFrom(answers: number[]): PlacementInput {
  const r = calculatePlacement(answers);
  return {
    name: "Test",
    email: "test@example.com",
    score: r.score,
    total: r.total,
    percentage: r.percentage,
    level: r.level,
    recommendedCourse: r.recommendedCourse,
    categoryBreakdown: r.categoryBreakdown as PlacementInput["categoryBreakdown"],
  };
}

describe("analyzePlacementFallback", () => {
  it("is deterministic", () => {
    const input = inputFrom(ALL_CORRECT);
    const a = analyzePlacementFallback(input);
    const b = analyzePlacementFallback(input);
    expect(a).toEqual(b);
  });

  it("produces the required structured shape", () => {
    const input = inputFrom(ALL_CORRECT);
    const a = analyzePlacementFallback(input);
    expect(a.level).toBe("advanced");
    expect(a.overallScore).toBe(input.percentage);
    expect(a.summary.length).toBeGreaterThan(20);
    expect(a.categories).toHaveLength(4);
    expect(a.strengths.length).toBeGreaterThan(0);
    expect(a.improvements.length).toBeGreaterThan(0);
    expect(a.recommendedCourse).toBe(input.recommendedCourse);
    expect(a.studyPlan.weeklyHours).toBeGreaterThan(0);
    expect(a.studyPlan.milestones.length).toBeGreaterThanOrEqual(4);
    expect(a.advice.length).toBeGreaterThan(10);
  });

  it("maps category scores correctly", () => {
    const input = inputFrom(ALL_CORRECT);
    const a = analyzePlacementFallback(input);
    for (const c of a.categories) {
      const raw = input.categoryBreakdown[c.category];
      expect(c.score).toBe(Math.round((raw.correct / raw.total) * 100));
    }
  });

  it("keeps the level consistent with the deterministic scorer", () => {
    const r = calculatePlacement(ALL_WRONG);
    const a = analyzePlacementFallback(inputFrom(ALL_WRONG));
    expect(a.level).toBe(r.level);
    expect(a.overallScore).toBe(r.percentage);
  });

  it("recommends more study hours for lower levels", () => {
    const beginner = analyzePlacementFallback(inputFrom(ALL_WRONG));
    const advanced = analyzePlacementFallback(inputFrom(ALL_CORRECT));
    expect(beginner.studyPlan.weeklyHours).toBeGreaterThanOrEqual(advanced.studyPlan.weeklyHours);
  });
});

describe("buildPlacementPrompt", () => {
  it("mentions the category breakdown and score", () => {
    const input = inputFrom(ALL_CORRECT);
    const prompt = buildPlacementPrompt(input);
    expect(prompt).toContain("grammar");
    expect(prompt).toContain(String(input.percentage));
  });
});