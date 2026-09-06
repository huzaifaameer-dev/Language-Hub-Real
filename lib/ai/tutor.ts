import { embed } from "ai";
import type { ModelMessage } from "ai";
import { aiConfigured, getEmbeddingModel } from "@/lib/ai/config";
import { ensureKnowledgeBase } from "@/lib/ai/knowledge";
import { retrieveKnowledge, type RetrievedSource } from "@/lib/ai/vector-store";

export interface TutorChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** What the tutor knows for a single turn. */
export interface TutorContext {
  sources: RetrievedSource[];
  context: string;
  vector: boolean;
}

/** Ensure the KB exists, embed the question, and retrieve the top chunks. */
export async function retrieveContext(
  question: string,
  k = 4
): Promise<TutorContext> {
  await ensureKnowledgeBase();

  let embedding: number[] | undefined;
  if (aiConfigured()) {
    try {
      const result = await embed({
        model: getEmbeddingModel(),
        value: question.slice(0, 4000),
      });
      embedding = result.embedding;
    } catch {
      // embedding failure → lexical retrieval fallback
    }
  }

  const { sources, vector } = await retrieveKnowledge(question, k, embedding);
  const context = sources
    .map((s) => `[${s.kind}] ${s.title}\n${s.snippet}`)
    .join("\n\n---\n\n");

  return { sources, context, vector };
}

/**
 * Build the model-message history for the LLM. The system prompt (with the
 * retrieved context) is passed separately, so only user/assistant turns live
 * in the messages array. History is trimmed to the most recent N turns.
 */
export function buildTutorMessages(
  history: TutorChatMessage[],
  maxTurns = 8
): ModelMessage[] {
  const recent = history.slice(-maxTurns).map((m) =>
    m.role === "user"
      ? { role: "user" as const, content: m.content }
      : { role: "assistant" as const, content: m.content }
  );
  return recent;
}