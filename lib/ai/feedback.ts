import { getAiFeedbackCollection } from "@/lib/db";
import { normalizeTokens } from "@/lib/ai/chunk";

export type FeedbackKind = "essay" | "speaking";

/** Extract a short grade/band label from raw feedback text, if present. */
export function parseGrade(feedback: string): string | null {
  const band = feedback.match(/band\s*(\d(?:\.\d)?)/i);
  if (band) return `Band ${band[1]} (IELTS-style)`;

  const nineScale = feedback.match(/(\d(?:\.\d)?)\s*\/\s*9/);
  if (nineScale) return `Score ${nineScale[1]}/9 (IELTS-style)`;

  const cefr = feedback.match(/\b(?:cefr\s+)?level\s*(b\d|a\d|c\d)/i);
  if (cefr) return `Level ${cefr[1].toUpperCase()} (CEFR)`;

  const pte = feedback.match(/(\d{2})\s*(?:\/|out of\s*)90/i);
  if (pte) return `PTE ${pte[1]}/90`;

  return null;
}

/** Deterministic offline feedback — always presentable, clearly labelled. */
export function offlineFeedback(
  text: string,
  kind: FeedbackKind
): { feedback: string; grade: string | null } {
  const words = normalizeTokens(text);
  const wordCount = words.length;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgSentence = sentences.length > 0 ? Math.round(wordCount / sentences.length) : 0;
  const uniqueRatio = wordCount > 0 ? new Set(words).size / wordCount : 0;

  // Heuristic band proxy: length + sentence variety + vocabulary richness.
  const lengthScore = Math.min(6, wordCount > 250 ? 6 : wordCount / 60);
  const sentenceScore = Math.min(7, 3 + (sentences.length >= 6 ? 2 : sentences.length >= 3 ? 1 : 0));
  const vocabScore = Math.min(7, 2 + uniqueRatio * 5);
  const overall = Math.round(((lengthScore + sentenceScore + vocabScore) / 21) * 20) / 2;
  const band = Math.min(8.5, Math.max(4, overall));

  const criteria =
    kind === "essay"
      ? [
          ["Task Response", band],
          ["Coherence & Cohesion", Math.min(8.5, band + 0.5)],
          ["Lexical Resource", Math.min(8.5, band + 0.5)],
          ["Grammatical Range & Accuracy", band],
        ]
      : [
          ["Fluency & Coherence", band],
          ["Lexical Resource", Math.min(8.5, band + 0.5)],
          ["Grammatical Range & Accuracy", band],
          ["Pronunciation", Math.min(8.5, band + 0.5)],
        ];

  const table = criteria.map(([name, score]) => `| ${name} | ${typeof score === "number" ? score.toFixed(1) : score} | Based on length, variety and clarity. |`).join("\n");

  return {
    grade: `Band ${band.toFixed(1)} (estimated)`,
    feedback: `### Overall grade\nEstimated **Band ${band.toFixed(1)}** (offline mode)

### Criteria scores
${table}

### What you did well
- You produced a ${wordCount}-word ${kind === "essay" ? "essay" : "transcript"} — a good, focused effort.
- Average sentence length was ~${avgSentence} words, which suggests readable structure.
- Vocabulary variety: ~${Math.round(uniqueRatio * 100)}% unique words — ${
      uniqueRatio > 0.45 ? "a promising range." : "room to add more linking words and synonyms."
    }

### What to improve
- Expand your ideas: aim for 250+ words for an essay / 1–2 minutes of speech, with an example for every claim.
- Use signposting ("Firstly…", "On the other hand…") to make transitions obvious.
- Re-read for subject-verb agreement and articles (*a/the*) before submitting.

### Next 3 steps
1. Write 150 words a day on a new topic and count your unique-word ratio.
2. Record a 1-minute speaking answer, transcribe it, and rewrite it more formally.
3. Book a free demo or mock with the Language Hub team for examiner-style feedback.

> ⚠️ Offline mode: add \`AI_API_KEY\` to get detailed, specific AI grading with corrections.`,
  };
}

export async function saveFeedbackRecord(input: {
  userId: string;
  kind: FeedbackKind;
  taskPrompt?: string | null;
  text: string;
  feedback: string;
  grade?: string | null;
  model?: string | null;
  offline: boolean;
}): Promise<string> {
  const col = await getAiFeedbackCollection();
  const res = await col.insertOne({
    userId: input.userId,
    kind: input.kind,
    taskPrompt: input.taskPrompt ?? null,
    text: input.text,
    feedback: input.feedback,
    grade: input.grade ?? null,
    model: input.model ?? null,
    offline: input.offline,
    createdAt: new Date(),
  });
  return String(res.insertedId);
}

export interface FeedbackRecord {
  id: string;
  kind: FeedbackKind;
  taskPrompt: string | null;
  preview: string;
  feedback: string;
  grade: string | null;
  offline: boolean;
  createdAt: string;
}

export async function listFeedback(userId: string, limit = 20): Promise<FeedbackRecord[]> {
  const col = await getAiFeedbackCollection();
  const rows = await col.find({ userId }).sort({ createdAt: -1 }).limit(limit).toArray();
  return rows.map((r) => ({
    id: String(r._id),
    kind: r.kind,
    taskPrompt: r.taskPrompt ?? null,
    preview: r.text.slice(0, 120) + (r.text.length > 120 ? "…" : ""),
    feedback: r.feedback,
    grade: r.grade ?? null,
    offline: r.offline,
    createdAt: r.createdAt.toISOString(),
  }));
}