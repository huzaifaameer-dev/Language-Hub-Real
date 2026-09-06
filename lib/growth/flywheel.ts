import { generateText } from "ai";
import { aiConfigured, aiModelLabel, getChatModel } from "@/lib/ai/config";

/**
 * RAG knowledge flywheel — mines real learner submissions (ai_feedback) for
 * recurring English gaps and proposes new FAQ-style knowledge chunks for the
 * tutor/guide. Admin approves drafts; approval inserts them into the ai_chunks
 * store so retrieval finds them next turn.
 */

export interface FeedbackSeed {
  id: string;
  kind: string;
  text: string;
  feedback: string;
  grade?: string | null;
  createdAt: Date;
}

export interface KnowledgeDraft {
  title: string;
  faq: string;
  source: string;
  offline: boolean;
}

/** Existing chunk/FAQ titles used so the model avoids duplicate drafts. */
export function existingTitlesList(titles: string[]): string {
  return titles.length ? titles.join(" | ") : "(knowledge base is empty)";
}

export function buildFlywheelPrompt(seeds: FeedbackSeed[], existing: string[]): string {
  const rows = seeds
    .map(
      (s) =>
        `[${s.kind}] user wrote: "${s.text.slice(0, 220)}" → feedback: "${s.feedback.slice(0, 180)}"`
    )
    .join("\n");
  return `Here are recent real learner submissions and the AI feedback that followed:
${rows}

Existing knowledge titles (avoid duplicates):
${existingTitlesList(existing)}

Propose exactly 3 new FAQ-style knowledge chunks (title + a short answer sentence) that would help the RAG tutor answer similar questions next time. Focus on grammar/vocabulary patterns the submissions reveal.`;
}

/** Deterministic fallback: one gentle grammar FAQ from the top submission. */
export function offlineFlywheel(seeds: FeedbackSeed[]): KnowledgeDraft[] {
  const seed = seeds[0];
  if (!seed) return [];
  const topic = seed.kind === "essay" ? "structuring an essay" : "speaking with confidence";
  return [
    {
      title: `Basics of ${topic}`,
      faq: `Learners often ask for the clearest first step into ${topic}. Answer: keep your idea simple, support it with one example, then link to the next point.`,
      source: `seed::${seed.id.slice(-6)}`,
      offline: true,
    },
  ];
}

export interface FlywheelResult {
  drafts: KnowledgeDraft[];
  offline: boolean;
  model: string | null;
}

/**
 * Produce new knowledge chunks. Never throws — falls back to a minimal
 * deterministic draft (or none) when the model is unavailable.
 */
export async function draftKnowledgeFromSeeds(
  seeds: FeedbackSeed[],
  existing: string[]
): Promise<FlywheelResult> {
  if (!aiConfigured()) {
    return { drafts: offlineFlywheel(seeds), offline: true, model: null };
  }
  try {
    const { text } = await generateText({
      model: getChatModel(),
      system:
        "You are the knowledge curator at Language Hub. Output ONLY a JSON array of exactly 3 objects: [{title, faq}] where faq is one concise sentence for the RAG tutor.",
      prompt: buildFlywheelPrompt(seeds, existing),
      temperature: 0.4,
    });
    const json = text.slice(text.indexOf("["), text.lastIndexOf("]") + 1);
    const parsed = JSON.parse(json) as Array<{ title?: string; faq?: string }>;
    const drafts = parsed
      .filter((d) => d.title && d.faq)
      .slice(0, 3)
      .map((d) => ({
        title: String(d.title).slice(0, 120),
        faq: String(d.faq).slice(0, 400),
        source: "ai-flywheel",
        offline: false,
      }));
    return { drafts: drafts.length ? drafts : offlineFlywheel(seeds), offline: false, model: aiModelLabel() };
  } catch {
    return { drafts: offlineFlywheel(seeds), offline: true, model: null };
  }
}