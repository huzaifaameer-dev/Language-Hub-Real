import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getNewsCommentsCollection } from "@/lib/db";
import { resolveNewsActor } from "@/lib/news-identity";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Public: toggle a like on a comment. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string; commentId: string }> }
) {
  const { slug, commentId } = await params;
  if (!slug || !commentId || !ObjectId.isValid(commentId)) {
    return NextResponse.json({ message: "Invalid parameters." }, { status: 400 });
  }

  const rl = await rateLimitDb(await clientKey(request, "news-comment-like"), 20, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { message: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const actor = await resolveNewsActor();
  const commentsCol = await getNewsCommentsCollection();
  const comment = await commentsCol.findOne({ _id: new ObjectId(commentId), postSlug: slug });
  if (!comment) return NextResponse.json({ message: "Comment not found." }, { status: 404 });

  const likedBy = comment.likedBy ?? [];
  const already = likedBy.includes(actor.actorId);

  if (already) {
    await commentsCol.updateOne(
      { _id: comment._id },
      { $set: { updatedAt: new Date() }, $pull: { likedBy: actor.actorId }, $inc: { likes: -1 } }
    );
    return NextResponse.json({ liked: false, likes: Math.max(0, (comment.likes ?? 0) - 1) });
  }

  await commentsCol.updateOne(
    { _id: comment._id },
    { $set: { updatedAt: new Date() }, $addToSet: { likedBy: actor.actorId }, $inc: { likes: 1 } }
  );
  return NextResponse.json({ liked: true, likes: (comment.likes ?? 0) + 1 });
}