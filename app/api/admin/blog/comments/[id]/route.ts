import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin, isValidId } from "@/lib/admin-guard";
import { audit } from "@/lib/server/admin";
import { deleteComment, setCommentApproval } from "@/lib/server/blog";

export const dynamic = "force-dynamic";

const PatchSchema = z.object({ approved: z.boolean() });

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const { id } = await ctx.params;
  if (!isValidId(id)) return NextResponse.json({ message: "Invalid id." }, { status: 400 });

  const parsed = PatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Validation failed." }, { status: 400 });

  await setCommentApproval(id, parsed.data.approved);
  await audit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: parsed.data.approved ? "admin.blog_comment_approved" : "admin.blog_comment_hidden",
    targetType: "blog_comment",
    targetId: id,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const { id } = await ctx.params;
  if (!isValidId(id)) return NextResponse.json({ message: "Invalid id." }, { status: 400 });

  await deleteComment(id);
  await audit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "admin.blog_comment_deleted",
    targetType: "blog_comment",
    targetId: id,
  });

  return NextResponse.json({ ok: true });
}
