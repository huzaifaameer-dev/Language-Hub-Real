import { NextResponse } from "next/server";

import { getBlogCollection } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Public: get a single published blog post by slug. Increments view count. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const blog = await getBlogCollection();

  const doc = await blog.findOne({ slug, published: true });
  if (!doc) {
    return NextResponse.json({ message: "Post not found." }, { status: 404 });
  }

  // Increment views (fire-and-forget for perf).
  blog.updateOne({ _id: doc._id }, { $inc: { views: 1 } }).catch(() => {});

  return NextResponse.json({
    id: String(doc._id),
    slug: doc.slug,
    title: doc.title,
    excerpt: doc.excerpt,
    content: doc.content,
    coverImage: doc.coverImage ?? null,
    author: doc.author,
    tags: doc.tags,
    views: doc.views + 1,
    publishedAt: doc.publishedAt?.toISOString() ?? doc.createdAt.toISOString(),
  });
}
