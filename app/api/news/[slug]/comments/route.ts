import { NextResponse } from "next/server";
import { z } from "zod";

import { getNewsCommentsCollection, getNewsPostsCollection } from "@/lib/db";
import { resolveNewsActor } from "@/lib/news-identity";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MAX_COMMENT = 2000;
const MAX_NAME = 60;

const CommentSchema = z.object({
  name: z.string().trim().min(1).max(MAX_NAME),
  text: z.string().trim().min(1).max(MAX_COMMENT),
});

/** Public: list comments (visible, pinned first) + post reaction counts. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const commentsCol = await getNewsCommentsCollection();
  const comments = await commentsCol
    .find({ postSlug: slug, hidden: false })
    .sort({ pinned: -1, createdAt: -1 })
    .limit(500)
    .toArray();

  return NextResponse.json(
    {
      comments: comments.map((c) => ({
        id: String(c._id),
        name: c.authorName,
        image: c.authorImage ?? null,
        text: c.text,
        likes: c.likes,
        adminLiked: c.adminLiked,
        pinned: c.pinned,
        createdAt: c.createdAt.toISOString(),
      })),
    },
    {
      headers: {
        "Cache-Control": "public, max-age=20, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}

/** Public: add a comment. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const posts = await getNewsPostsCollection();
  const post = await posts.findOne({ slug, published: true });
  if (!post) return NextResponse.json({ message: "Post not found." }, { status: 404 });

  const rl = await rateLimitDb(await clientKey(request, "news-comment"), 6, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { message: "Too many comments. Please slow down." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }
  const parsed = CommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 }
    );
  }

  const actor = await resolveNewsActor();
  const commentsCol = await getNewsCommentsCollection();
  const now = new Date();
  const result = await commentsCol.insertOne({
    postSlug: slug,
    postTitle: post.title,
    authorName: parsed.data.name,
    authorId: actor.actorId.startsWith("u:") ? actor.actorId.slice(2) : null,
    authorImage: actor.image,
    clientId: actor.clientId,
    text: parsed.data.text,
    likes: 0,
    likedBy: [],
    adminLiked: false,
    pinned: false,
    hidden: false,
    createdAt: now,
    updatedAt: now,
  });
  if (result.insertedId) {
    posts.updateOne({ _id: post._id }, { $inc: { commentCount: 1 } }).catch(() => {});
  }

  return NextResponse.json(
    {
      comment: {
        id: String(result.insertedId),
        name: parsed.data.name,
        image: actor.image,
        text: parsed.data.text,
        likes: 0,
        adminLiked: false,
        pinned: false,
        createdAt: now.toISOString(),
      },
    },
    { status: 201 }
  );
}