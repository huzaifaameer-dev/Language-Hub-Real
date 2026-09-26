import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";
import { publishBlog } from "@/lib/ai/agent/tools";

const DraftSchema = z.object({
  title: z.string().min(1).max(180),
  excerpt: z.string().max(300).optional().default(""),
  content: z.string().min(1).max(12000),
  coverImage: z.string().max(80000).nullable().optional().default(null),
  tags: z.array(z.string().min(1).max(24)).max(8).optional().default([]),
  slug: z.string().min(1).max(160),
  author: z.string().max(80).optional().default("Aina (AI)"),
});

/** Keep the AI-generated cover as a data-URI (serverless-safe: no disk). */
async function materializeCover(_slug: string, dataUri: string | null): Promise<string | null> {
  return dataUri;
}

/** POST — publish an AI-drafted blog post (reviewed by the admin first). */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const rl = await rateLimitDb(await clientKey(request, "ai-blog-publish"), 15, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ message: "Too many requests." }, { status: 429 });

  const body = await request.json().catch(() => null);
  const parsed = DraftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid draft.", errors: z.flattenError(parsed.error).fieldErrors }, { status: 400 });
  }

  const d = parsed.data;
  const result = await publishBlog({
    slug: d.slug,
    title: d.title,
    excerpt: d.excerpt,
    content: d.content,
    coverImage: await materializeCover(d.slug, d.coverImage),
    tags: d.tags,
    author: d.author,
  });
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: result.ref, article: `/news/${d.slug}` });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";