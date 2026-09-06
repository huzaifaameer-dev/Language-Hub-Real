import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";
import { writeAiBlog } from "@/lib/ai/agent/blog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST — AI writes a full blog post (title, content, cover art, tags) and
 * returns it as a DRAFT for the admin to review. Nothing is published yet —
 * publishing happens via POST /api/ai/agent/blog/publish.
 */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const rl = await rateLimitDb(await clientKey(request, "ai-blog"), 15, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ message: "Too many requests." }, { status: 429 });

  const body = (await request.json().catch(() => ({}))) as { topic?: unknown; seed?: unknown; tone?: unknown };
  const topic = String(body.topic ?? "").trim().slice(0, 160);
  if (topic.length < 4) {
    return NextResponse.json({ message: "A topic of at least 4 characters is required." }, { status: 400 });
  }

  try {
    const { post, offline, model } = await writeAiBlog({
      topic,
      seed: body.seed ? String(body.seed).slice(0, 1200) : null,
      tone: body.tone === "gold" ? "gold" : "indigo",
    });
    return NextResponse.json({
      ok: true,
      post: {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        coverImage: post.coverImage,
        tags: post.tags,
        slug: post.slug,
      },
      offline,
      model,
    });
  } catch (err) {
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}