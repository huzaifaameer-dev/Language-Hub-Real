import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { requireAdmin, isValidObjectId } from "@/lib/admin-guard";
import { getNewsCommentsCollection, logAdminAction } from "@/lib/db";

export const dynamic = "force-dynamic";

const PatchSchema = z.object({
  pinned: z.boolean().optional(),
  adminLiked: z.boolean().optional(),
  hidden: z.boolean().optional(),
});

/** Admin: pin/unpin, endorse, hide/unhide a comment. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ message: "Invalid id." }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Validation failed." }, { status: 400 });

  const commentsCol = await getNewsCommentsCollection();
  const existing = await commentsCol.findOne({ _id: new ObjectId(id) });
  if (!existing) return NextResponse.json({ message: "Comment not found." }, { status: 404 });

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.pinned !== undefined) updates.pinned = parsed.data.pinned;
  if (parsed.data.adminLiked !== undefined) updates.adminLiked = parsed.data.adminLiked;
  if (parsed.data.hidden !== undefined) updates.hidden = parsed.data.hidden;

  await commentsCol.updateOne({ _id: new ObjectId(id) }, { $set: updates });
  void logAdminAction({ actor: admin.email ?? "admin", action: "UPDATE", targetType: "news_comment", targetLabel: String(id) });
  return NextResponse.json({ ok: true });
}