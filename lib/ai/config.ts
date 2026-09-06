import { createOpenAI } from "@ai-sdk/openai";

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small";

/**
 * True when an OpenAI (or OpenAI-compatible) key is configured. Every AI
 * feature degrades to a deterministic offline mode when this is false, so the
 * app never breaks without a key.
 */
export function aiConfigured(): boolean {
  const key = process.env.AI_API_KEY;
  return typeof key === "string" && key.trim().length > 0;
}

let openai: ReturnType<typeof createOpenAI> | null = null;

/** Lazy provider singleton. Callers must check aiConfigured() first. */
export function getProvider() {
  if (!openai) {
    openai = createOpenAI({
      apiKey: process.env.AI_API_KEY?.trim() || undefined,
      name: "openai",
      // Lets the same code target any OpenAI-compatible gateway (Groq, Fireworks, …).
      ...(process.env.AI_BASE_URL
        ? { baseURL: process.env.AI_BASE_URL }
        : {}),
    });
  }
  return openai;
}

export function getChatModel(modelId?: string) {
  return getProvider().chat(modelId || process.env.AI_MODEL || DEFAULT_MODEL);
}

export function getEmbeddingModel(modelId?: string) {
  const id = modelId || process.env.AI_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL;
  // Optional separate OpenAI-style endpoint for embeddings so chat and vectors
  // can use different providers (e.g. Groq/DeepSeek for chat + OpenAI for
  // embeddings). Falls back to the main provider otherwise.
  if (process.env.AI_EMBEDDING_BASE_URL || process.env.AI_EMBEDDING_API_KEY) {
    const embeddingProvider = createOpenAI({
      apiKey:
        process.env.AI_EMBEDDING_API_KEY?.trim() || process.env.AI_API_KEY?.trim() || undefined,
      name: "openai-embeddings",
      ...(process.env.AI_EMBEDDING_BASE_URL ? { baseURL: process.env.AI_EMBEDDING_BASE_URL } : {}),
    });
    return embeddingProvider.embedding(id);
  }
  return getProvider().embedding(id);
}

export function aiModelLabel(): string {
  return process.env.AI_MODEL || DEFAULT_MODEL;
}

/** "atlas" uses Mongo $vectorSearch; "local" computes cosine in-process. */
export function aiVectorMode(): "atlas" | "local" {
  return process.env.AI_VECTOR_MODE === "atlas" ? "atlas" : "local";
}

export function aiVectorIndexName(): string {
  return process.env.AI_VECTOR_INDEX || "ai_chunks_vec";
}