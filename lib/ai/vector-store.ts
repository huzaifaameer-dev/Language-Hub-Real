import type { Collection } from "mongodb";
import { aiVectorIndexName, aiVectorMode } from "@/lib/ai/config";
import { cosineSimilarity, keywordScore, truncate } from "@/lib/ai/chunk";
import { getAiChunksCollection, type AiChunkDoc } from "@/lib/db";

export type RetrievedSource = {
  title: string;
  kind: string;
  source: string;
  snippet: string;
  score: number;
};

/** DB-level collections used by knowledge management. Internal to this module. */
let chunksColPromise: Promise<Collection<AiChunkDoc>> | null = null;

function chunksCollection(): Promise<Collection<AiChunkDoc>> {
  if (!chunksColPromise) chunksColPromise = getAiChunksCollection();
  return chunksColPromise;
}

export async function countKnowledgeChunks(): Promise<number> {
  const col = await chunksCollection();
  return col.countDocuments({});
}

/** True when at least one stored chunk carries an embedding. */
export async function hasEmbeddedChunks(): Promise<boolean> {
  const col = await chunksCollection();
  return (await col.countDocuments({ embedding: { $exists: true, $ne: null } })) > 0;
}

/** Replace the whole knowledge slice (used by the knowledge refresher). */
export async function replaceKnowledge(
  chunks: Array<Pick<AiChunkDoc, "hash" | "source" | "sourceId" | "kind" | "title" | "text" | "embedding">
>): Promise<void> {
  const col = await chunksCollection();
  const now = new Date();
  await col.deleteMany({});
  const docs = chunks.map((c) => ({
    hash: c.hash,
    source: c.source,
    sourceId: c.sourceId,
    kind: c.kind,
    title: c.title,
    text: c.text,
    embedding: c.embedding ?? null,
    updatedAt: now,
  }));
  // Bulk insert in small batches so huge knowledge bases don't exhaust the pool.
  for (let i = 0; i < docs.length; i += 100) {
    await col.insertMany(docs.slice(i, i + 100));
  }
}

function toSource(
  doc: Pick<AiChunkDoc, "title" | "kind" | "source" | "text">,
  score: number
): RetrievedSource {
  return {
    title: doc.title,
    kind: doc.kind,
    source: doc.source,
    snippet: truncate(doc.text, 200),
    score,
  };
}

/** Atlas $vectorSearch path — needs an Atlas cluster + the vector index. */
async function vectorSearchAtlas(
  col: Collection<AiChunkDoc>,
  embedding: number[],
  k: number
): Promise<RetrievedSource[]> {
  const rows = await col
    .aggregate<Pick<AiChunkDoc, "title" | "kind" | "source" | "text"> & { score?: number }>([
      {
        $vectorSearch: {
          index: aiVectorIndexName(),
          path: "embedding",
          queryVector: embedding,
          numCandidates: Math.min(200, Math.max(50, k * 25)),
          limit: k,
        },
      },
      { $project: { _id: 0, title: 1, kind: 1, source: 1, text: 1, score: { $meta: "vectorSearchScore" } } },
    ])
    .toArray();
  return rows.map((r) => toSource(r, r.score ?? 0));
}

/** In-process cosine search over stored embeddings. Works on plain MongoDB. */
async function vectorSearchLocal(
  col: Collection<AiChunkDoc>,
  embedding: number[],
  k: number
): Promise<RetrievedSource[]> {
  const docs = await col
    .find({ embedding: { $exists: true, $ne: null } })
    .project<Pick<AiChunkDoc, "title" | "kind" | "source" | "text" | "embedding">>({
      title: 1,
      kind: 1,
      source: 1,
      text: 1,
      embedding: 1,
    })
    .limit(2000)
    .toArray();

  const scored: RetrievedSource[] = [];
  for (const d of docs) {
    if (!d.embedding || d.embedding.length === 0) continue;
    const score = cosineSimilarity(embedding, d.embedding);
    if (score <= 0) continue;
    scored.push(toSource(d as AiChunkDoc, score));
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

/** Lexical fallback when no embeddings are stored (no AI key installed). */
async function keywordSearch(
  col: Collection<AiChunkDoc>,
  query: string,
  k: number
): Promise<RetrievedSource[]> {
  const docs = await col
    .find({})
    .project<Pick<AiChunkDoc, "title" | "kind" | "source" | "text">>({
      title: 1,
      kind: 1,
      source: 1,
      text: 1,
    })
    .limit(3000)
    .toArray();

  const scored: RetrievedSource[] = [];
  for (const d of docs) {
    const score = keywordScore(query, `${d.title} ${d.text}`);
    if (score <= 0) continue;
    scored.push(toSource(d as AiChunkDoc, score));
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

/**
 * Retrieve the top-k relevant knowledge chunks for a question. Uses Atlas
 * $vectorSearch when configured + embedded, otherwise in-process cosine, and
 * finally lexical keyword scoring when the corpus has no embeddings at all.
 */
export async function retrieveKnowledge(
  query: string,
  k = 4,
  embedding?: number[]
): Promise<{ sources: RetrievedSource[]; vector: boolean }> {
  const col = await chunksCollection();
  const embedded = await hasEmbeddedChunks();

  if (embedding && embedded) {
    if (aiVectorMode() === "atlas") {
      try {
        return { sources: await vectorSearchAtlas(col, embedding, k), vector: true };
      } catch {
        // Index/Atlas unavailable — fall through to local cosine.
      }
    }
    return { sources: await vectorSearchLocal(col, embedding, k), vector: true };
  }

  const sources = await keywordSearch(col, query, k);
  return { sources, vector: false };
}