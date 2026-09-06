import { generateObject } from "ai";
import { z } from "zod";
import { aiConfigured, aiModelLabel, getChatModel } from "@/lib/ai/config";

/**
 * Application triage assistant — reads a pending application (and any
 * placement result / live seat pressure) and proposes a decision the admin can
 * accept with one tap. Fully offline-safe.
 */

export const TriageSchema = z.object({
  decision: z.enum(["APPROVE", "WAITLIST", "REJECT"]),
  reason: z.string().describe("short plain-English reason for the decision"),
  suggestedBatch: z.string().nullable().describe("a concrete batch name when a seat is available"),
  notes: z.string().describe("what to verify before confirming"),
});
export type TriageSuggestion = z.infer<typeof TriageSchema>;

export interface TriageInput {
  name: string;
  email: string;
  course: string;
  place: string;
  bio: string;
  message?: string;
  createdAt: Date;
  placement?: { level: string; recommendedCourse: string; overallScore: number } | null;
  seats?: { seatsLeft: number; full: boolean } | null;
}

/** Deterministic rule-based suggestion (used when no AI key is configured). */
export function triageFallback(input: TriageInput): TriageSuggestion {
  const bioComplete = input.bio.trim().length >= 20;
  const message = input.message?.trim() ?? "";
  const placements = input.placement;

  if (!bioComplete && !message) {
    return {
      decision: "WAITLIST",
      reason: "Application looks incomplete — contact the applicant for a short intro before approving.",
      suggestedBatch: null,
      notes: "Request a 1-minute bio or a demo call.",
    };
  }

  if (input.seats?.full) {
    return {
      decision: "WAITLIST",
      reason: "The preferred batch is full — hold the application as a backup candidate.",
      suggestedBatch: null,
      notes: "Seat may open when a payment is released.",
    };
  }

  if (placements && placements.overallScore < 50 && /ielts|pte/i.test(input.course)) {
    return {
      decision: "WAITLIST",
      reason: `${input.name} scored ${placements.overallScore}% on the placement test — they may benefit from a foundation course first.`,
      suggestedBatch: null,
      notes: "Offer Spoken English readiness before a high-band target course.",
    };
  }

  return {
    decision: "APPROVE",
    reason: "Complete application and an available seat — low risk to proceed.",
    suggestedBatch: null,
    notes: "Confirm the preferred batch with the applicant, then lock the seat.",
  };
}

function buildTriagePrompt(input: TriageInput): string {
  const placement =
    input.placement ? `Placement: ${input.placement.level} level, ${input.placement.overallScore}%, recommended ${input.placement.recommendedCourse}.`
    : "Placement: none taken yet.";
  const seats = input.seats ? `Seats left in the requested batch: ${input.seats.seatsLeft} (${input.seats.full ? "full" : "open"}).`
    : "Seat availability: unknown for this course.";

  return `Triaging application from ${input.name} (${input.email}, ${input.place || "no city"}).
Course requested: ${input.course}.
Bio: ${input.bio || "(empty)"}
${input.message ? `Message: ${input.message}` : ""}
${placement}
${seats}

Courses the academy runs: Spoken English, IELTS Preparation, PTE Preparation, Duolingo English Test.
Decide APPROVE / WAITLIST / REJECT with a short reason, a suggested batch when a seat looks open, and a verification note.`;
}

export interface TriageResult {
  suggestion: TriageSuggestion;
  offline: boolean;
  model: string | null;
}

/**
 * Produce a triage suggestion. Uses structured output when a key is
 * configured; otherwise the deterministic rule-based fallback. Never throws.
 */
export async function triageApplication(input: TriageInput): Promise<TriageResult> {
  if (!aiConfigured()) {
    return { suggestion: triageFallback(input), offline: true, model: null };
  }
  try {
    const { object } = await generateObject({
      model: getChatModel(),
      schema: TriageSchema,
      system:
        "You are the admissions assistant at Language Hub, an online English institute. Be decisive and honest; never invent information not provided.",
      prompt: buildTriagePrompt(input),
      temperature: 0.2,
    });
    return { suggestion: object, offline: false, model: aiModelLabel() };
  } catch {
    return { suggestion: triageFallback(input), offline: true, model: null };
  }
}