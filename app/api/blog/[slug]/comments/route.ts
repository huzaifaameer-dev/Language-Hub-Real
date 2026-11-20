import { NextResponse } from "next/server";
import { z } from "zod";

import { clientKey, rateLimitDb } from "@/lib/rate-limit";
import { createComment, getPublishedPost } from "@/lib/server/blog";

export const dynamic = "force-dynamic";

const CommentSchema = z.object({
  name: z.string().trim().min(2, "Please add your name.").max(60),
  email: z.string().trim().email("Please add a valid email.").max(160),
  body: z.string().trim().min(4, "Your comment is a little short.").max(1500),
  /** Hidden honeypot — real people never fill this in. */
  website: z.string().max(0).optional().or(z.literal("")),
});

export async function POST(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;

  const key = await clientKey(request, "blog-comment");
  const limit = await rateLimitDb(key, 5, 10 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { message: "You have posted a few notes already — please try again shortly." },
      { status: 429 }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = CommentSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { message: z.flattenError(parsed.error).formErrors[0] ?? "Please check the form." },
      { status: 400 }
    );
  }

  if (parsed.data.website) {
    // Silently accept for bots so they do not retry.
    return NextResponse.json({ ok: true, pending: true });
  }

  const post = await getPublishedPost(slug);
  if (!post) return NextResponse.json({ message: "Post not found." }, { status: 404 });

  await createComment({
    postId: post.id,
    name: parsed.data.name,
    email: parsed.data.email,
    body: parsed.data.body,
  });

  return NextResponse.json({ ok: true, pending: true }, { status: 201 });
}
