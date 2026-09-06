import { generateText } from "ai";
import { aiConfigured, aiModelLabel, getChatModel } from "@/lib/ai/config";
import { slugifyBlog } from "@/lib/ai/agent/rules";

/**
 * AI blog studio — writes a complete, published-ready blog post from a topic
 * (optionally seeded by a course or learner story). Produces an SVG cover image
 * on the fly (no external upload needed) so every post ships with a picture.
 */

export interface BlogDraft {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  coverImage: string;
  slug: string;
}

/** Deterministic, brand-styled SVG cover (data URI) for any topic. */
export function svgCover(topic: string, tone = "indigo"): string {
  const title = topic.slice(0, 60);
  const colorA = tone === "gold" ? "#f59e0b" : "#6366f1";
  const colorB = tone === "gold" ? "#d97706" : "#a855f7";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="${colorA}"/><stop offset="1" stop-color="${colorB}"/>
</linearGradient></defs>
<rect width="1200" height="630" fill="url(#g)"/>
<circle cx="1050" cy="90" r="200" fill="#ffffff" opacity="0.12"/>
<circle cx="140" cy="560" r="260" fill="#ffffff" opacity="0.10"/>
<text x="70" y="300" font-family="Arial, sans-serif" font-size="64" font-weight="bold" fill="#ffffff">Language Hub</text>
<text x="72" y="380" font-family="Arial, sans-serif" font-size="40" fill="#ffffff" opacity="0.85">${title}</text>
<rect x="72" y="430" width="220" height="8" rx="4" fill="#ffffff" opacity="0.55"/>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function buildBlogPrompt(input: { topic: string; seed?: string | null }): string {
  return `Write one complete blog post for Language Hub, an online English institute.
Topic: ${input.topic}
${input.seed ? `Use this as source material (facts only, do not invent): ${input.seed.slice(0, 800)}` : ""}
Courses the academy offers: Spoken English, IELTS Preparation, PTE Preparation, Duolingo English Test.

Output EXACTLY this JSON: {title, excerpt, content, tags}
- title: catchy, under 70 chars
- excerpt: one teaser sentence under 140 chars
- content: 3-5 short markdown paragraphs with a ## heading per section, 250-400 words total. Practical, honest, no fabricated numbers.
- tags: 3-5 lowercase tags`;
}

/** Deterministic offline fallback — writes a useful post from the topic itself. */
export function offlineBlog(input: { topic: string; seed?: string | null }): BlogDraft {
  const topic = input.topic.trim();
  return {
    title: `${titleCase(topic)}: a practical guide`,
    excerpt: `A clear, practical guide to ${topic.toLowerCase()} from the Language Hub learning team.`,
    content: `## Why ${topic.toLowerCase()} matters

At Language Hub we teach English as a living skill. ${topic.slice(0, 60)} is exactly the kind of topic our learners practise in small batches until it feels second nature.

## How we practise it

Every session drills real usage — you speak on the topic, hear corrections, and repeat. Consistency beats intensity: short daily practice moves you faster than occasional cramming.

## Your next step

Try the free placement test to see your level, then match it to a course: Spoken English, IELTS, PTE or Duolingo. ${input.seed ? `\n\n> ${input.seed.slice(0, 200)}` : ""}`,
    tags: [topic.toLowerCase().split(/\s+/)[0] ?? "english", "learning", "practical"],
    coverImage: svgCover(topic),
    slug: slugifyBlog(topic),
  };
}

export async function writeAiBlog(input: {
  topic: string;
  seed?: string | null;
  tone?: string;
}): Promise<{ post: BlogDraft; offline: boolean; model: string | null }> {
  const topic = input.topic.trim();
  if (topic.length < 4) throw new Error("Topic is too short.");

  if (!aiConfigured()) {
    return { post: offlineBlog(input), offline: true, model: null };
  }

  try {
    const { text } = await generateText({
      model: getChatModel(),
      system:
        "You are the content editor at Language Hub. Output ONLY valid JSON {title, excerpt, content, tags}. Friendly, practical, honest. Content is markdown with short ## sections.",
      prompt: buildBlogPrompt(input),
      temperature: 0.7,
      maxOutputTokens: 800,
    });
    const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    const parsed = JSON.parse(json) as { title?: string; excerpt?: string; content?: string; tags?: string[] };
    const title = String(parsed.title ?? "").trim().slice(0, 120) || titleCase(topic);
    return {
      post: {
        title,
        excerpt: String(parsed.excerpt ?? "").trim().slice(0, 200) || `${title}.`,
        content: String(parsed.content ?? "").trim().slice(0, 4000) || offlineBlog(input).content,
        tags: (parsed.tags ?? []).map(String).slice(0, 6),
        coverImage: svgCover(topic, input.tone === "gold" ? "gold" : "indigo"),
        slug: slugifyBlog(title),
      },
      offline: false,
      model: aiModelLabel(),
    };
  } catch {
    return { post: offlineBlog(input), offline: true, model: null };
  }
}

function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}