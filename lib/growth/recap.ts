import { generateObject } from "ai";
import { z } from "zod";
import { aiConfigured, aiModelLabel, getChatModel } from "@/lib/ai/config";

/**
 * AI session recap — a teacher pastes the notes from a live class and the AI
 * returns a student-ready summary, homework and per-student gap suggestions.
 * Offline-safe (deterministic template).
 */

export const RecapSchema = z.object({
  summary: z.string().describe("a short, warmly-worded recap the whole class can read"),
  homework: z.string().describe("concrete homework items students should complete before next class"),
  gaps: z
    .array(
      z.object({
        student: z.string(),
        gap: z.string(),
        suggestion: z.string(),
      })
    )
    .describe("one row per student you can meaningfully comment on"),
});
export type SessionRecap = z.infer<typeof RecapSchema>;

export interface RecapInput {
  course: string;
  topics: string[];
  batch?: string;
  notes: string;
  studentEmails: string[];
}

/** Deterministic template used when no AI key is configured. */
export function offlineRecap(input: RecapInput): SessionRecap {
  const topicList = input.topics.length ? input.topics.join(", ") : "today's topics";
  return {
    summary: `Class recap — ${input.course}: we covered ${topicList}. ${input.notes.trim() || "Students practised with live conversation and received pronunciation feedback."}`,
    homework:
      "Complete the practice set for these topics, read today's notes aloud once, and prepare one question for the next session.",
    gaps: input.studentEmails.slice(0, 8).map((email) => ({
      student: email,
      gap: "Needs more speaking practice time in the next session.",
      suggestion: "Answer one open question from today's topics before the next class.",
    })),
  };
}

function buildRecapPrompt(input: RecapInput): string {
  return `Course: ${input.course}${input.batch ? ` · batch ${input.batch}` : ""}
Topics covered: ${input.topics.join(", ") || "(not listed)"}
Students (emails): ${input.studentEmails.join(", ") || "(none listed)"}
Teacher's session notes:
${input.notes || "(none provided)"}

Produce the structured session recap.`;
}

export interface RecapResult {
  recap: SessionRecap;
  offline: boolean;
  model: string | null;
}

export async function generateSessionRecap(input: RecapInput): Promise<RecapResult> {
  if (!aiConfigured()) {
    return { recap: offlineRecap(input), offline: true, model: null };
  }
  try {
    const { object } = await generateObject({
      model: getChatModel(),
      schema: RecapSchema,
      system:
        "You are the teaching assistant at Language Hub, an online English institute. Turn the teacher's raw class notes into a crisp recap, homework and honest, specific per-student gap suggestions. Do not invent students that are not listed.",
      prompt: buildRecapPrompt(input),
      temperature: 0.4,
    });
    return { recap: object, offline: false, model: aiModelLabel() };
  } catch {
    return { recap: offlineRecap(input), offline: true, model: null };
  }
}