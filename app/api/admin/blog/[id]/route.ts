import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin, isValidId } from "@/lib/admin-guard";
import { audit } from "@/lib/server/admin";
import { deletePost, getPostById, updatePost } from "@/lib/server/blog";
import { BlogCoverImageSchema } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const { id } = await ctx.params;
  if (!isValidId(id)) return NextResponse.json({ message: "Invalid id." }, { status: 400 });

  const post = await getPostById(id);
  if (!post) return NextResponse.json({ message: "Post not found." }, { status: 404 });
  return NextResponse.json({ post });
}

const PatchSchema = z.object({
  title: z.string().trim().min(3).max(180).optional(),
  slug: z.string().trim().max(120).optional(),
  excerpt: z.string().max(600).optional(),
  content: z.string().max(400_000).optional(),
  coverImage: BlogCoverImageSchema.nullable().optional(),
  category: z.string().trim().max(60).optional(),
  tags: z.array(z.string().trim().max(40)).max(12).optional(),
  author: z.string().trim().max(80).optional(),
  authorRole: z.string().trim().max(80).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  featured: z.boolean().optional(),
  publishedAt: z.string().datetime().nullable().optional(),
  readMinutes: z.number().int().min(1).max(120).optional(),
});

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const { id } = await ctx.params;
  if (!isValidId(id)) return NextResponse.json({ message: "Invalid id." }, { status: 400 });

  const parsed = PatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 }
    );
  }

  await updatePost(id, parsed.data);
  await audit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "admin.blog_updated",
    targetType: "blog_post",
    targetId: id,
    meta: { status: parsed.data.status },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const { id } = await ctx.params;
  if (!isValidId(id)) return NextResponse.json({ message: "Invalid id." }, { status: 400 });

  await deletePost(id);
  await audit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "admin.blog_deleted",
    targetType: "blog_post",
    targetId: id,
  });

  return NextResponse.json({ ok: true });
}
