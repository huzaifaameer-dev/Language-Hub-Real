import { z } from "zod";

/**
 * Structured output schema for the placement-test analyzer (generateObject /
 * JSON mode). The shape is deliberately rich so the results screen can render
 * the analysis without a second parsing pass.
 */
export const PlacementAnalysisSchema = z.object({
  level: z.enum(["beginner", "intermediate", "advanced"]),
  overallScore: z.number().min(0).max(100),
  summary: z
    .string()
    .describe(
      "2-3 sentence, plain-English summary of where the student is now and what to do next."
    ),
  categories: z
    .array(
      z.object({
        category: z.enum(["grammar", "vocabulary", "reading", "sentence-structure"]),
        score: z.number().min(0).max(100),
        verdict: z.string().describe("one short sentence assessing this area"),
        tip: z.string().describe("one precise, actionable tip for this area"),
      })
    )
    .length(4),
  strengths: z
    .array(z.string())
    .min(1)
    .describe("what the test shows the student is already good at"),
  improvements: z
    .array(z.string())
    .min(1)
    .describe("priority areas to improve, ordered by impact"),
  recommendedCourse: z.string().describe("one of the Language Hub courses"),
  studyPlan: z.object({
    weeklyHours: z.number().min(1).max(40).describe("realistic weekly study hours"),
    focusAreas: z.array(z.string()).describe("what to practise week by week"),
    milestones: z
      .array(z.string())
      .describe("4-6 concrete weekly milestones the student can measure"),
  }),
  advice: z.string().describe("a short, motivating closing note"),
});

export type PlacementAnalysis = z.infer<typeof PlacementAnalysisSchema>;

/** Human labels used by the client to render category chips. */
export type PlacementCategory = z.infer<typeof PlacementAnalysisSchema>["categories"][number]["category"];