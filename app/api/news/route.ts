import { NextResponse } from "next/server";
import { getNewsPostsCollection, getNewsReactionsCollection } from "@/lib/db";
import { resolveNewsActor } from "@/lib/news-identity";

export const dynamic = "force-dynamic";

/** Strip markdown images so excerpts never leak raw `![..](url)` syntax.
 *  Defensive: a post missing `body` (legacy/draft) must not 500 the feed. */
function excerptFrom(body: string | null | undefined, max = 220): string {
  const clean = String(body ?? "").replace(/!\[[^\]]*\]\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
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

  // Attach the viewer's own reaction to each post so cards can hydrate the
  // "liked" state on refresh (no double-likes / confused toggling).
  const myBySlug: Record<string, string> = {};
  try {
    const actor = await resolveNewsActor();
    if (actor.actorId) {
      const rows = await (await getNewsReactionsCollection())
        .find(
          { actorId: actor.actorId, postSlug: { $in: docs.map((d) => d.slug) } },
          { projection: { postSlug: 1, type: 1 } }
        )
        .toArray();
      for (const r of rows) myBySlug[r.postSlug] = r.type as string;
    }
  } catch {
    // viewer context unavailable → leave everything unreacted
  }

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
        myReaction: myBySlug[d.slug] ?? null,
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