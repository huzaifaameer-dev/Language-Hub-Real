import { NextResponse } from "next/server";
import { getNewsPostsCollection } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Strip markdown images so excerpts never leak raw `![..](url)` syntax. */
function excerptFrom(body: string, max = 220): string {
  const clean = body.replace(/!\[[^\]]*\]\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
  return clean.length > max ? clean.slice(0, max) + "…" : clean;
}

/** Public: paginated published news feed. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get("tag")?.trim() ?? "";
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const skip = (page - 1) * limit;

  const posts = await getNewsPostsCollection();
  const filter: Record<string, unknown> = { published: true };
  if (tag) filter.tags = tag;

  const [docs, total] = await Promise.all([
    posts
      .find(filter)
      .project({ body: 0 })
      .sort({ pinned: -1, publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    posts.countDocuments(filter),
  ]);

  return NextResponse.json(
    {
      posts: docs.map((d) => ({
        id: String(d._id),
        slug: d.slug,
        title: d.title,
        excerpt: excerptFrom(d.body),
        coverImage: d.coverImage ?? null,
        author: d.authorName,
        authorRole: d.authorRole,
        tags: d.tags,
        views: d.views,
        likeCount: d.likeCount ?? 0,
        interestedCount: d.interestedCount ?? 0,
        notInterestedCount: d.notInterestedCount ?? 0,
        commentCount: d.commentCount ?? 0,
        pinned: d.pinned,
        publishedAt: d.publishedAt?.toISOString() ?? d.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize: limit,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=30, s-maxage=120, stale-while-revalidate=300",
      },
    }
  );
}