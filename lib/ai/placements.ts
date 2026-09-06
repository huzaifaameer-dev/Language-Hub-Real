import { generateObject } from "ai";
import { aiConfigured, aiModelLabel, getChatModel } from "@/lib/ai/config";
import { PlacementAnalysisSchema, type PlacementAnalysis } from "@/lib/ai/schemas";
import { PLACEMENT_SYSTEM } from "@/lib/ai/prompts";
import { getAiAnalysesCollection } from "@/lib/db";
import type { PlacementCategory } from "@/lib/ai/schemas";

export interface PlacementInput {
  name?: string | null;
  email?: string | null;
  score: number;
  total: number;
  percentage: number;
  level: "beginner" | "intermediate" | "advanced";
  recommendedCourse: string;
  categoryBreakdown: Record<PlacementCategory, { correct: number; total: number }>;
}

/** Deterministic fallback analysis — used when no AI key is configured. */
export function analyzePlacementFallback(input: PlacementInput): PlacementAnalysis {
  const cats = (Object.keys(input.categoryBreakdown) as PlacementCategory[]).filter(
    (c) => input.categoryBreakdown[c] && input.categoryBreakdown[c].total > 0
  );

  const pctOf = (c: PlacementCategory) => {
    const d = input.categoryBreakdown[c];
    return Math.round((d.correct / d.total) * 100);
  };

  const sorted = [...cats].sort((a, b) => pctOf(b) - pctOf(a));
  const strengths = sorted
    .filter((c) => pctOf(c) >= 60)
    .map(
      (c) =>
        `Solid ${c.replace("-", " ")} — you got ${input.categoryBreakdown[c].correct}/${input.categoryBreakdown[c].total} right.`
    );
  const improvements = sorted
    .slice()
    .reverse()
    .filter((c) => pctOf(c) < 70)
    .map(
      (c) =>
        `Build ${c.replace("-", " ")}: only ${input.categoryBreakdown[c].correct}/${input.categoryBreakdown[c].total} correct — review the core rules and practise daily.`
    );

  const fallbackStrengths = strengths.length
    ? strengths
    : ["You attempted every section thoughtfully — consistency is a great base to build on."];
  const fallbackImprovements = improvements.length
    ? improvements
    : ["Keep reinforcing your understanding with mixed-difficulty practice every day."];

  const weeklyHours = input.level === "beginner" ? 5 : input.level === "intermediate" ? 4 : 3;
  const focusAreas = improvements.length
    ? improvements.map((i) => i.split(":")[0])
    : Object.keys(input.categoryBreakdown);

  return {
    level: input.level,
    overallScore: input.percentage,
    summary: `Your ${input.percentage}% score places you at the ${input.level} level. Your strongest area is ${sorted[0]?.replace("-", " ") ?? "grammar"}. We recommend starting with ${input.recommendedCourse} and following the plan below.`,
    categories: cats.map((c) => ({
      category: c,
      score: pctOf(c),
      verdict:
        pctOf(c) >= 70
          ? `Strong — you handle this comfortably.`
          : pctOf(c) >= 40
            ? `Developing — you know the basics, now build consistency.`
            : `Needs attention — start with the fundamentals.`,
      tip:
        pctOf(c) >= 70
          ? "Keep it sharp with advanced-level practice questions."
          : "Review the rules, then do 5 focused questions daily on this area.",
    })),
    strengths: fallbackStrengths,
    improvements: fallbackImprovements,
    recommendedCourse: input.recommendedCourse,
    studyPlan: {
      weeklyHours,
      focusAreas,
      milestones: [
        `Week 1: Study grammar rules for ${focusAreas[0] ?? "your weakest skill"} for 15 minutes a day.`,
        `Week 2: Do one mixed practice set (10 questions) every other day.`,
        "Week 3: Practise reading aloud + write short answers weekly to link all skills.",
        "Week 4: Retake a mini-test and track your new category scores.",
      ],
    },
    advice: `At ${input.level} level, consistency beats intensity. ${weeklyHours} focused hours a week with ${input.recommendedCourse} will move you up a level within a month. You've got this!`,
  };
}

/** Human-readable prompt for the LLM analyzer. */
export function buildPlacementPrompt(input: PlacementInput): string {
  const catLines = Object.entries(input.categoryBreakdown)
    .map(([c, d]) => `${c}: ${d.correct}/${d.total} correct (${Math.round((d.correct / d.total) * 100)}%)`)
    .join("\n");
  return `Student: ${input.name || "Anonymous"} (${input.email || "no email"})
Overall: ${input.score}/${input.total} (${input.percentage}%)
Rule-based level: ${input.level} · Rule-based recommendation: ${input.recommendedCourse}

Category breakdown:
${catLines}

Produce the structured placement analysis.`;
}

/**
 * Analyze a placement-test result. Uses structured output (JSON mode) when a
 * key is configured, otherwise the deterministic fallback. Never throws on
 * model/API failures — always degrades to the offline analysis.
 */
export async function analyzePlacement(
  input: PlacementInput
): Promise<{ analysis: PlacementAnalysis; offline: boolean }> {
  const configured = aiConfigured();

  if (!configured) {
    const analysis = analyzePlacementFallback(input);
    await savePlacementAnalysis(input, analysis, true, null);
    return { analysis, offline: true };
  }

  try {
    const { object } = await generateObject({
      model: getChatModel(),
      schema: PlacementAnalysisSchema,
      system: PLACEMENT_SYSTEM,
      prompt: buildPlacementPrompt(input),
      temperature: 0.4,
    });
    await savePlacementAnalysis(input, object, false, aiModelLabel());
    return { analysis: object, offline: false };
  } catch {
    const analysis = analyzePlacementFallback(input);
    await savePlacementAnalysis(input, analysis, true, null);
    return { analysis, offline: true };
  }
}

async function savePlacementAnalysis(
  input: PlacementInput,
  analysis: PlacementAnalysis,
  offline: boolean,
  model: string | null
): Promise<void> {
  try {
    const col = await getAiAnalysesCollection();
    await col.insertOne({
      kind: "placement",
      email: input.email ?? null,
      name: input.name ?? null,
      input: input as unknown as Record<string, unknown>,
      result: analysis as unknown as Record<string, unknown>,
      model,
      offline,
      createdAt: new Date(),
    });
  } catch {
    // telemetry-style best-effort write; the response already happened
  }
}