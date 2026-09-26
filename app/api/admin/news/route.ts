import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { revalidateTag } from "next/cache";
import { z } from "zod";

import { requireAdmin, isValidObjectId } from "@/lib/admin-guard";
import { getNewsPostsCollection, logAdminAction } from "@/lib/db";

export const dynamic = "force-dynamic";
// Body can carry inline data-URI images (cover + content), up to MAX_BODY headroom.
export const bodySizeLimit = "60mb";

const MAX_TITLE = 180;
const MAX_BODY = 50_000_000; // body now holds inline data-URI images → needs headroom
const MAX_TAGS = 20;
const MAX_TAG_LEN = 30;
const MAX_COVER = 8_000_000;

const coverRefine = (v: string | null | undefined) =>
  v === null ||
  v === undefined ||
  v === "" ||
  /^data:image\/(webp|jpeg|png|avif);base64,/i.test(v) ||
  /^https:\/\/[^\s]+$/i.test(v);

const NewsPostSchema = z.object({
  title: z.string().trim().min(1).max(MAX_TITLE),
  body: z.string().trim().max(MAX_BODY),
  coverImage: z.string().trim().max(MAX_COVER).nullable().optional().refine(coverRefine, {
    message: "Invalid cover image path.",
  }),
  authorName: z.string().trim().min(1).max(80),
  authorRole: z.enum(["ceo", "founder", "teacher", "developer", "manager", "ambassador"]),
  tags: z.array(z.string().trim().max(MAX_TAG_LEN)).max(MAX_TAGS).optional(),
  published: z.boolean().optional(),
  pinned: z.boolean().optional(),
});

const PatchSchema = z.object({
  id: z.string().min(1),
  payload: NewsPostSchema.partial(),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const posts = await getNewsPostsCollection();
  const docs = await posts.find({}).sort({ pinned: -1, createdAt: -1 }).limit(200).toArray();

  return NextResponse.json({
    posts: docs.map((d) => ({
      id: String(d._id),
      slug: d.slug,
      title: d.title,
      body: d.body,
      coverImage: d.coverImage ?? null,
      author: d.authorName,
      authorRole: d.authorRole,
      tags: d.tags,
      published: d.published,
      pinned: d.pinned,
      views: d.views,
      likeCount: d.likeCount ?? 0,
      interestedCount: d.interestedCount ?? 0,
      commentCount: d.commentCount ?? 0,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
      publishedAt: d.publishedAt?.toISOString() ?? null,
    })),
  });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }
  const parsed = NewsPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 }
    );
  }

  const posts = await getNewsPostsCollection();
  const now = new Date();
  let slug = slugify(parsed.data.title);
  if (await posts.findOne({ slug })) slug = `${slug}-${Date.now().toString(36)}`;

  // Guard: never publish a post with an empty body. Fall back to the title so
  // "new news -> publish" never fails on a missing paragraph.
  const finalBody = parsed.data.body || parsed.data.title;

  await posts.insertOne({
    slug,
    title: parsed.data.title,
    body: finalBody,
    coverImage: parsed.data.coverImage?.trim() || null,
    authorName: parsed.data.authorName,
    authorRole: parsed.data.authorRole,
    tags: [...new Set((parsed.data.tags ?? []).map((t) => t.toLowerCase().trim()).filter(Boolean))],
    published: !!parsed.data.published,
    pinned: !!parsed.data.pinned,
    views: 0,
    likeCount: 0,
    interestedCount: 0,
    notInterestedCount: 0,
    commentCount: 0,
    createdAt: now,
    updatedAt: now,
    publishedAt: parsed.data.published ? now : null,
  });

  revalidateTag("news", { expire: 0 });
  void logAdminAction({ actor: admin.email ?? "admin", action: "CREATE", targetType: "news_post", targetLabel: parsed.data.title });
  return NextResponse.json({ ok: true, slug }, { status: 201 });
}

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
  if (!parsed.success || !isValidObjectId(parsed.data.id)) {
    return NextResponse.json({ message: "Invalid payload." }, { status: 400 });
  }

  const posts = await getNewsPostsCollection();
  const existing = await posts.findOne({ _id: new ObjectId(parsed.data.id) });
  if (!existing) return NextResponse.json({ message: "Post not found." }, { status: 404 });

  const p = parsed.data.payload;
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (p.title !== undefined) {
    updates.title = p.title.trim();
    const nextSlug = slugify(p.title);
    if (nextSlug && nextSlug !== existing.slug) {
      updates.slug = (await posts.findOne({ slug: nextSlug, _id: { $ne: existing._id } }))
        ? `${nextSlug}-${Date.now().toString(36)}`
        : nextSlug;
    }
  }
  if (p.body !== undefined) updates.body = p.body.trim() || existing.title || existing.body;
  if (p.coverImage !== undefined) updates.coverImage = p.coverImage?.trim() || null;
  if (p.authorName !== undefined) updates.authorName = p.authorName;
  if (p.authorRole !== undefined) updates.authorRole = p.authorRole;
  if (p.tags !== undefined)
  updates.tags = [...new Set(p.tags.map((t) => t.trim().toLowerCase()).filter(Boolean))];
  if (typeof p.published === "boolean" && p.published !== existing.published) {
    updates.published = p.published;
    if (p.published && !existing.publishedAt) updates.publishedAt = new Date();
  }
  if (typeof p.pinned === "boolean") updates.pinned = p.pinned;

  await posts.updateOne({ _id: existing._id }, { $set: updates });
  revalidateTag("news", { expire: 0 });
  void logAdminAction({ actor: admin.email ?? "admin", action: "UPDATE", targetType: "news_post", targetLabel: updates.title as string });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") ?? "";
  if (!isValidObjectId(id)) return NextResponse.json({ message: "Invalid id." }, { status: 400 });

  const posts = await getNewsPostsCollection();
  await posts.deleteOne({ _id: new ObjectId(id) });
  revalidateTag("news", { expire: 0 });
  void logAdminAction({ actor: admin.email ?? "admin", action: "DELETE", targetType: "news_post", targetLabel: String(id) });
  return NextResponse.json({ ok: true });
}