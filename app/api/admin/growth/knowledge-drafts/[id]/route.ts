import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/admin-guard";
import { getDb, getKnowledgeDraftsCollection } from "@/lib/db";
import { hashText } from "@/lib/ai/chunk";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * PATCH — approve or reject a knowledge draft.
 * Approving inserts the chunk into the RAG knowledge base (lexical retrieval
 * works immediately; the next full refresh can embed it as well).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ message: "Invalid id." }, { status: 400 });

  const body = (await request.json().catch(() => ({}))) as { action?: unknown };
  const action = body.action === "approve" ? "approve" : body.action === "reject" ? "reject" : null;
  if (!action) return NextResponse.json({ message: "action must be 'approve' or 'reject'." }, { status: 400 });

  const col = await getKnowledgeDraftsCollection();
  const draft = await col.findOne({ _id: new ObjectId(id), status: "draft" });
  if (!draft) return NextResponse.json({ message: "Draft not found." }, { status: 404 });

  if (action === "approve") {
    // Add to the RAG chunk store (idempotent by content hash).
    const text = `${draft.title}. ${draft.faq}`;
    try {
      const db = await getDb();
      await db.collection("ai_chunks").updateOne(
        { hash: hashText(text) },
        {
          $setOnInsert: {
            hash: hashText(text),
            source: "guide",
            sourceId: `knowledge-draft::${id}`,
            kind: "faq",
            title: draft.title,
            text,
            embedding: null,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
    } catch {
      // index/DB hiccup — still allow marking the draft approved (best-effort)
    }
  }

  await col.updateOne(
    { _id: draft._id },
    { $set: { status: action === "approve" ? "approved" : "rejected", updatedAt: new Date() } }
  );

  return NextResponse.json({ ok: true, status: action === "approve" ? "approved" : "rejected" });
}