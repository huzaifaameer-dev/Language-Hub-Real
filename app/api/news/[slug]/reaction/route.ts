import { NextResponse } from "next/server";
import { z } from "zod";

import { getNewsReactionsCollection, getNewsPostsCollection } from "@/lib/db";
import { resolveNewsActor } from "@/lib/news-identity";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const ReactionSchema = z.object({
  type: z.enum(["like", "interested", "not_interested"]).nullable(),
});

/** Public: set or clear a visitor's reaction (like / interested / not interested). */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const posts = await getNewsPostsCollection();
  const post = await posts.findOne({ slug, published: true });
  if (!post) return NextResponse.json({ message: "Post not found." }, { status: 404 });

  const rl = await rateLimitDb(await clientKey(request, "news-reaction"), 12, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { message: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }
  const parsed = ReactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Validation failed." }, { status: 400 });
  }

  const actor = await resolveNewsActor();
  const reactions = await getNewsReactionsCollection();
  const my = await reactions.findOne({ postSlug: slug, actorId: actor.actorId });
  const type = parsed.data.type;

  // Idempotent per-actor toggle: like → unlike, different reaction swaps over,
  // null always removes. A single actor can never double-count.
  if (type === null) {
    if (my) await reactions.deleteOne({ _id: my._id });
  } else if (my && my.type === type) {
    await reactions.deleteOne({ _id: my._id });
  } else {
    await reactions.updateOne(
      { postSlug: slug, actorId: actor.actorId },
      { $set: { type, updatedAt: new Date() } },
      { upsert: true }
    );
  }

  // The reactions collection is the source of truth. Recompute the live
  // numbers and SYNC them back onto the post document — the feed and post page
  // read those counters, so they can never drift into "wrong" numbers again.
  const [likeCount, interestedCount, notInterestedCount] = await Promise.all([
    reactions.countDocuments({ postSlug: slug, type: "like" }),
    reactions.countDocuments({ postSlug: slug, type: "interested" }),
    reactions.countDocuments({ postSlug: slug, type: "not_interested" }),
  ]);

  await posts.updateOne(
    { _id: post._id },
    {
      $set: {
        likeCount,
        interestedCount,
        notInterestedCount,
        updatedAt: new Date(),
      },
    }
  ).catch(() => {});

  return NextResponse.json({
    myReaction: type,
    counts: { like: likeCount, interested: interestedCount, not_interested: notInterestedCount },
  });
}