import { embedMany } from "ai";
import {
  FALLBACK_COURSES,
  type CourseInfo,
} from "@/lib/course-data";
import { COURSE_FAQS, COURSE_FEATURES, FAQS } from "@/lib/content";
import { aiConfigured, getEmbeddingModel } from "@/lib/ai/config";
import { chunkText, hashText } from "@/lib/ai/chunk";
import {
  hasEmbeddedChunks,
  replaceKnowledge,
} from "@/lib/ai/vector-store";
import { getAiChunksCollection, getBlogCollection, getCoursesCollection } from "@/lib/db";

export interface CorpusItem {
  source: string;
  sourceId: string;
  kind: string;
  title: string;
  text: string;
}

/** Pure builder for a course catalog — unit-testable without a DB. */
export function corpusFromCourses(courses: CourseInfo[]): CorpusItem[] {
  const items: CorpusItem[] = [];
  for (const c of courses) {
    items.push({
      source: "course",
      sourceId: c.name,
      kind: "course",
      title: c.name,
      text: `${c.name}. ${c.tagline} ${c.description} Duration: ${c.duration}. Schedule: ${c.schedule}. ${
        c.outcomes?.length ? `Outcomes: ${c.outcomes.join("; ")}.` : ""
      }`,
    });
    for (const m of c.modules ?? []) {
      items.push({
        source: "course",
        sourceId: `${c.name}::module::${m.title}`,
        kind: "module",
        title: `${c.name} — ${m.title} (${m.weeks})`,
        text: `${c.name} · ${m.title} (${m.weeks}). Topics: ${m.topics.join("; ")}. ${
          m.sampleLesson ? m.sampleLesson : ""
        }`,
      });
    }
  }
  return items;
}

/** Pure builder for academy FAQ content. */
export function corpusFromFaq(): CorpusItem[] {
  const items: CorpusItem[] = [];
  FAQS.forEach((faq, i) => {
    items.push({
      source: "faq",
      sourceId: `faq::${i}`,
      kind: "faq",
      title: faq.q,
      text: `${faq.q} ${faq.a}`,
    });
  });
  for (const [course, faqs] of Object.entries(COURSE_FAQS)) {
    faqs.forEach((faq, i) => {
      items.push({
        source: "faq",
        sourceId: `course-faq::${course}::${i}`,
        kind: "faq",
        title: `${course}: ${faq.q}`,
        text: `${course}: ${faq.q} ${faq.a}`,
      });
    });
  }
  return items;
}

/** Pure builder for the per-course feature blurbs. */
export function corpusFromFeatures(): CorpusItem[] {
  return Object.entries(COURSE_FEATURES).map(([course, features]) => ({
    source: "feature",
    sourceId: `feature::${course}`,
    kind: "feature",
    title: `${course} — key features`,
    text: `${course} features: ${features.join("; ")}.`,
  }));
}

/** Pure builder for published blog posts (content sliced into paragraphs). */
export function corpusFromBlog(
  posts: Array<{ title: string; excerpt: string; content: string; slug: string }>
): CorpusItem[] {
  const items: CorpusItem[] = [];
  for (const post of posts) {
    items.push({
      source: "blog",
      sourceId: `blog::${post.slug}`,
      kind: "blog",
      title: post.title,
      text: `${post.title}. ${post.excerpt}`,
    });
    for (const para of post.content.split(/\n\s*\n/).filter(Boolean)) {
      items.push({
        source: "blog",
        sourceId: `blog::${post.slug}::para`,
        kind: "blog",
        title: post.title,
        text: para.trim(),
      });
    }
  }
  return items;
}

/** Assemble the full knowledge corpus from live DB + static content. */
export async function buildCorpus(): Promise<CorpusItem[]> {
  const [coursesCol, blogCol] = await Promise.all([
    getCoursesCollection(),
    getBlogCollection(),
  ]);

  const [dbCourses, blogPosts] = await Promise.all([
    coursesCol.find({}).sort({ order: 1 }).limit(40).toArray(),
    blogCol
      .find({ published: true })
      .sort({ publishedAt: -1 })
      .limit(30)
      .toArray(),
  ]);

  const courses = dbCourses.length > 0 ? dbCourses : FALLBACK_COURSES;

  return [
    ...corpusFromCourses(courses),
    ...corpusFromFaq(),
    ...corpusFromFeatures(),
    ...corpusFromBlog(
      blogPosts.map((p) => ({
        title: p.title,
        excerpt: p.excerpt,
        content: p.content,
        slug: p.slug,
      }))
    ),
  ];
}

/**
 * Refresh the knowledge base: rebuilds the corpus, chunks it, embeds every
 * chunk (when an AI key exists) and atomically swaps the stored slice.
 * Returns what happened so callers can log / surface it.
 */
export async function refreshKnowledgeBase(): Promise<{
  added: number;
  embedded: boolean;
  skipped: boolean;
}> {
  const items = await buildCorpus();
  const flat: Array<{ hash: string; text: string; item: CorpusItem }> = [];
  for (const item of items) {
    for (const chunk of chunkText(item.text)) {
      flat.push({ hash: hashText(chunk), text: chunk, item });
    }
  }

  const configured = aiConfigured();
  let embeddings: number[][] | null = null;

  if (configured) {
    try {
      const model = getEmbeddingModel();
      const values = flat.map((f) => f.text);
      const embedded: number[][] = [];
      for (let i = 0; i < values.length; i += 100) {
        const batch = values.slice(i, i + 100);
        const { embeddings: batchEmbeddings } = await embedMany({ model, values: batch });
        embedded.push(...batchEmbeddings);
      }
      embeddings = embedded;
    } catch {
      // Provider has no embedding endpoint (e.g. Groq/DeepSeek). The corpus is
      // stored without vectors and retrieval falls back to keyword search.
      embeddings = null;
    }
  }

  await replaceKnowledge(
    flat.map((f, i) => ({
      hash: f.hash,
      source: f.item.source,
      sourceId: f.item.sourceId,
      kind: f.item.kind,
      title: f.item.title,
      text: f.text,
      embedding: embeddings ? embeddings[i] : null,
    }))
  );

  return { added: flat.length, embedded: !!embeddings, skipped: flat.length === 0 };
}

/**
 * Idempotent "make sure the knowledge base exists". Builds it on first use.
 * When a key is added later, callers can force a rebuild with refreshKnowledgeBase.
 */
export async function ensureKnowledgeBase(): Promise<"ok" | "refreshed" | "offline"> {
  const col = await getAiChunksCollection();
  const count = await col.countDocuments({}).catch(() => 0);
  if (count > 0) return "ok";

  await refreshKnowledgeBase().catch(() => {});
  const after = await col.countDocuments({}).catch(() => 0);
  const embedded = await hasEmbeddedChunks();
  return after > 0 ? (embedded ? "refreshed" : "offline") : "offline";
}