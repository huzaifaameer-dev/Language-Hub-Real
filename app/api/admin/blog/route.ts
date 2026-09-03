import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { revalidateTag } from "next/cache";
import { z } from "zod";

import { requireAdmin, isValidObjectId } from "@/lib/admin-guard";
import { getBlogCollection, logAdminAction } from "@/lib/db";

export const dynamic = "force-dynamic";

const MAX_TITLE = 180;
const MAX_EXCERPT = 320;
const MAX_CONTENT = 2_000_000; // ~2 MB of markdown is far beyond any real post
const MAX_TAGS = 10;
const MAX_TAG_LEN = 30;
const MAX_COVER = 500;

/** Cover image must be a same-site path (upload endpoint output) or an https URL. */
const coverRefine = (v: string | null | undefined) =>
  v === null ||
  v === undefined ||
  v === "" ||
  /^\/uploads\/blog\/[a-z0-9._-]+\.webp$/i.test(v) ||
  /^https:\/\/[^\s]+$/i.test(v);

const BlogPostSchema = z.object({
  title: z.string().trim().min(1).max(MAX_TITLE),
  excerpt: z.string().trim().max(MAX_EXCERPT).nullable().optional(),
  content: z.string().min(1).max(MAX_CONTENT),
  coverImage: z.string().trim().max(MAX_COVER).nullable().optional().refine(coverRefine, {
    message: "Invalid cover image path.",
  }),
  tags: z
    .array(z.string().trim().max(MAX_TAG_LEN))
    .max(MAX_TAGS)
    .optional(),
  published: z.boolean().optional(),
});

const PatchSchema = z.object({
  id: z.string().min(1),
  payload: BlogPostSchema.partial(),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

/** Admin: list all blog posts (published + drafts). */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const blog = await getBlogCollection();
  const docs = await blog.find({}).sort({ createdAt: -1 }).limit(200).toArray();

  return NextResponse.json({
    posts: docs.map((d) => ({
      id: String(d._id),
      slug: d.slug,
      title: d.title,
      excerpt: d.excerpt,
      content: d.content,
      coverImage: d.coverImage ?? null,
      author: d.author,
      tags: d.tags,
      published: d.published,
      views: d.views,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
      publishedAt: d.publishedAt?.toISOString() ?? null,
    })),
  });
}

/** Admin: create a new blog post. */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const parsed = BlogPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const tags = (data.tags ?? []).map((t) => t.toLowerCase()).filter(Boolean);

  const blog = await getBlogCollection();
  const now = new Date();
  let slug = slugify(data.title);

  // Ensure unique slug.
  const existing = await blog.findOne({ slug });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const result = await blog.insertOne({
    slug,
    title: data.title,
    excerpt: data.excerpt?.trim() ?? "",
    content: data.content,
    coverImage: data.coverImage?.trim() || null,
    author: admin.email ?? "Admin",
    tags,
    published: !!data.published,
    views: 0,
    createdAt: now,
    updatedAt: now,
    publishedAt: data.published ? now : null,
  });

  revalidateTag("blog", { expire: 0 });
  void logAdminAction({
    actor: admin.email ?? "admin",
    action: "CREATE",
    targetType: "blog_post",
    targetLabel: data.title,
  });
  return NextResponse.json({ id: String(result.insertedId), slug }, { status: 201 });
}

/** Admin: update a blog post. */
export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Validation failed." }, { status: 400 });
  }
  if (!isValidObjectId(parsed.data.id)) {
    return NextResponse.json({ message: "Invalid id." }, { status: 400 });
  }

  const id = parsed.data.id;
  const blog = await getBlogCollection();
  const post = await blog.findOne({ _id: new ObjectId(id) });
  if (!post) {
    return NextResponse.json({ message: "Post not found." }, { status: 404 });
  }

  const payload = parsed.data.payload;
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (payload.title !== undefined && payload.title.trim()) {
    updates.title = payload.title.trim();
    // Only update slug if title changed significantly.
    const newSlug = slugify(payload.title);
    if (newSlug !== post.slug) {
      const conflict = await blog.findOne({ slug: newSlug, _id: { $ne: new ObjectId(id) } });
      updates.slug = conflict ? `${newSlug}-${Date.now().toString(36)}` : newSlug;
    }
  }
  if (payload.excerpt !== undefined) updates.excerpt = payload.excerpt?.trim() ?? "";
  if (payload.content !== undefined) updates.content = payload.content;
  if (payload.coverImage !== undefined) updates.coverImage = payload.coverImage?.trim() || null;
  if (payload.tags !== undefined) {
    updates.tags = payload.tags.map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, MAX_TAGS);
  }

  if (typeof payload.published === "boolean" && payload.published !== post.published) {
    updates.published = payload.published;
    if (payload.published && !post.publishedAt) {
      updates.publishedAt = new Date();
    }
  }

  await blog.updateOne({ _id: new ObjectId(id) }, { $set: updates });
  revalidateTag("blog", { expire: 0 });
  void logAdminAction({
    actor: admin.email ?? "admin",
    action: "UPDATE",
    targetType: "blog_post",
    targetLabel: (updates.title as string) ?? (post.title as string),
  });
  return NextResponse.json({ ok: true, slug: updates.slug ?? post.slug });
}

/** Admin: delete a blog post. */
export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") ?? "";
  if (!isValidObjectId(id)) {
    return NextResponse.json({ message: "Invalid id." }, { status: 400 });
  }

  const blog = await getBlogCollection();
  await blog.deleteOne({ _id: new ObjectId(id) });
  revalidateTag("blog", { expire: 0 });
  void logAdminAction({
    actor: admin.email ?? "admin",
    action: "DELETE",
    targetType: "blog_post",
    targetLabel: String(id),
  });
  return NextResponse.json({ ok: true });
}