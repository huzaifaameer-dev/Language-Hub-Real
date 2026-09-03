import { NextResponse } from "next/server";

import { getBlogCollection } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Public: list published blog posts (newest first). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get("tag");
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const skip = (page - 1) * limit;

  const blog = await getBlogCollection();
  const filter: Record<string, unknown> = { published: true };
  if (tag) filter.tags = tag;

  const [docs, total] = await Promise.all([
    blog
      .find(filter)
      .project({ content: 0 })
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    blog.countDocuments(filter),
  ]);

  const posts = docs.map((d) => ({
    id: String(d._id),
    slug: d.slug,
    title: d.title,
    excerpt: d.excerpt,
    coverImage: d.coverImage ?? null,
    author: d.author,
    tags: d.tags,
    views: d.views,
    publishedAt: d.publishedAt?.toISOString() ?? d.createdAt.toISOString(),
  }));

  return NextResponse.json({ posts, total, page, pageSize: limit });
}
