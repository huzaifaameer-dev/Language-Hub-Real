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

/** Admin: list all comments across news posts (including hidden). */
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";

  const commentsCol = await getNewsCommentsCollection();
  const docs = await commentsCol.find({}).sort({ pinned: -1, createdAt: -1 }).limit(400).toArray();

  const filtered = q
    ? docs.filter(
        (c) =>
          c.text.toLowerCase().includes(q) ||
          c.authorName.toLowerCase().includes(q) ||
          (c.postTitle ?? "").toLowerCase().includes(q) ||
          c.postSlug.toLowerCase().includes(q)
      )
    : docs;

  return NextResponse.json({
    comments: filtered.map((c) => ({
      id: String(c._id),
      postSlug: c.postSlug,
      postTitle: c.postTitle ?? "",
      name: c.authorName,
      text: c.text,
      likes: c.likes,
      adminLiked: c.adminLiked,
      pinned: c.pinned,
      hidden: c.hidden,
      createdAt: c.createdAt.toISOString(),
    })),
  });
}

/** Admin: delete a comment. */
export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") ?? "";
  if (!isValidObjectId(id)) return NextResponse.json({ message: "Invalid id." }, { status: 400 });

  const commentsCol = await getNewsCommentsCollection();
  await commentsCol.deleteOne({ _id: new ObjectId(id) });
  void logAdminAction({ actor: admin.email ?? "admin", action: "DELETE", targetType: "news_comment", targetLabel: String(id) });
  return NextResponse.json({ ok: true });
}

export { PatchSchema };