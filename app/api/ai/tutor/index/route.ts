import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-guard";
import { refreshKnowledgeBase } from "@/lib/ai/knowledge";
import { countKnowledgeChunks, hasEmbeddedChunks } from "@/lib/ai/vector-store";
import { logAdminAction } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST — rebuilds the tutor's RAG knowledge base (course syllabi + FAQ + blog
 * content), embedding every chunk when an AI key is present. Admin-only.
 */
export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const result = await refreshKnowledgeBase();
  void logAdminAction({
    actor: admin.email ?? admin.id,
    action: "REFRESH",
    targetType: "ai_knowledge",
    detail: `${result.added} chunks, ${result.embedded ? "embedded" : "not embedded"}`,
  });

  return NextResponse.json({ ...result, chunks: await countKnowledgeChunks(), embedded: await hasEmbeddedChunks() });
}