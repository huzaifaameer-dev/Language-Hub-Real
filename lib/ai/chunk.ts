import { createHash } from "node:crypto";

/**
 * Pure text utilities used by the AI retrieval layer: deterministic chunking,
 * cosine similarity and a lightweight keyword score. Everything here is side
 * effect free so it can be unit-tested without a DB or a network call.
 */

/** Stable sha256 hex digest — used as the unique id of a content chunk. */
export function hashText(input: string): string {
  return createHash("sha256").update(input).digest("hex").slice(0, 40);
}

/** Split a corpus text into ~maxChars chunks, preferring paragraph boundaries. */
export function chunkText(
  text: string,
  maxChars = 800,
  overlap = 120
): string[] {
  const paragraphs = text
    .split(/\n\s*\n|\r\n\s*\r\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const out: string[] = [];
  let buffer = "";

  const flush = () => {
    if (!buffer.trim()) return;
    out.push(buffer.trim());
    buffer = buffer.slice(-overlap);
  };

  for (const para of paragraphs) {
    if (para.length > maxChars) {
      flush();
      // Oversized paragraph: split by sentences, then hard-split.
      const sentences = para.match(/[^.!?]+[.!?]*/g) ?? [para];
      let sentenceBuf = "";
      for (const sentence of sentences) {
        if ((sentenceBuf + " " + sentence).trim().length > maxChars) {
          if (sentenceBuf.trim()) {
            out.push(sentenceBuf.trim());
            sentenceBuf = sentenceBuf.slice(-overlap);
          }
          let rest = sentence;
          while (rest.length > maxChars) {
            out.push(rest.slice(0, maxChars).trim());
            rest = rest.slice(maxChars - overlap);
          }
          sentenceBuf = rest;
        } else {
          sentenceBuf = (sentenceBuf + " " + sentence).trim();
        }
      }
      if (sentenceBuf.trim()) {
        buffer = sentenceBuf.trim();
        flush();
      }
      continue;
    }

    if ((buffer + " " + para).trim().length > maxChars) flush();
    buffer = (buffer + " " + para).trim();
  }
  flush();

  return out.map((c) => c.trim()).filter(Boolean);
}

/** Cosine similarity between two non-empty vectors. */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Lowercased alphanumeric tokens (kept deterministic for testing). */
export function normalizeTokens(text: string): string[] {
  return text.toLowerCase().replace(/'/g, " ").match(/[a-z0-9]+/g) ?? [];
}

/**
 * Length-normalised lexical overlap score with light TF weighting. Used for the
 * no-embedding fallback and to blend lexical + semantic signals. Higher is
 * better; the log-length divisor stops long chunks from winning by mass.
 */
export function keywordScore(query: string, text: string): number {
  const qTerms = [...new Set(normalizeTokens(query))];
  if (qTerms.length === 0) return 0;
  const words = normalizeTokens(text);
  if (words.length === 0) return 0;

  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);

  let score = 0;
  for (const term of qTerms) {
    const f = freq.get(term) ?? 0;
    if (f === 0) continue;
    score += 1 + Math.log(f);
  }
  return score / (1 + 0.5 * Math.log(words.length + 1));
}

export function truncate(text: string, max = 160): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + "…";
}