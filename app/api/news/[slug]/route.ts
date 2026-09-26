import { NextResponse } from "next/server";
import { getNewsPostsCollection, getNewsReactionsCollection } from "@/lib/db";
import { resolveNewsActor } from "@/lib/news-identity";

export const dynamic = "force-dynamic";

/** Public: single news post. Increments views. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const posts = await getNewsPostsCollection();
  const doc = await posts.findOne({ slug, published: true });
  if (!doc) return NextResponse.json({ message: "Not found." }, { status: 404 });
  posts.updateOne({ _id: doc._id }, { $inc: { views: 1 } }).catch(() => {});

  let myReaction: string | null = null;
  try {
    const actor = await resolveNewsActor();
    if (actor.actorId) {
      const mine = await (await getNewsReactionsCollection()).findOne({ postSlug: slug, actorId: actor.actorId });
      if (mine) myReaction = mine.type as string;
    }
  } catch {
    // viewer context unavailable → unreacted
  }

  return NextResponse.json(
    {
      id: String(doc._id),
      slug: doc.slug,
      title: doc.title,
      body: doc.body,
      coverImage: doc.coverImage ?? null,
      author: doc.authorName,
      authorRole: doc.authorRole,
      tags: doc.tags,
      views: doc.views + 1,
      likeCount: doc.likeCount ?? 0,
      interestedCount: doc.interestedCount ?? 0,
      notInterestedCount: doc.notInterestedCount ?? 0,
      commentCount: doc.commentCount ?? 0,
      myReaction,
      publishedAt: doc.publishedAt?.toISOString() ?? doc.createdAt.toISOString(),
    },
    {
      headers: {
        "Cache-Control": "public, max-age=30, s-maxage=120, stale-while-revalidate=300",
      },
    }
  );
}