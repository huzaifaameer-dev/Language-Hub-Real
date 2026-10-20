import { createOpenAI } from "@ai-sdk/openai";

const DEFAULT_MODEL = "gpt-4o-mini";

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

export function aiModelLabel(): string {
  return process.env.AI_MODEL || DEFAULT_MODEL;
}