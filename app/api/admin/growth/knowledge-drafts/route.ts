import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";
import { getDb, getKnowledgeDraftsCollection, getAiFeedbackCollection } from "@/lib/db";
import { draftKnowledgeFromSeeds, type FeedbackSeed } from "@/lib/growth/flywheel";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SEED_LIMIT = 12;

/** GET — list knowledge drafts for the admin review queue. */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const col = await getKnowledgeDraftsCollection();
  const rows = await col
    .find({ status: "draft" })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  return NextResponse.json({
    drafts: rows.map((d) => ({
      id: String(d._id),
      title: d.title,
      faq: d.faq,
      source: d.source,
      offline: !!d.offline,
      seedId: d.seedId ?? null,
      createdAt: d.createdAt.toISOString(),
    })),
  });
}

/** POST — run the extraction: mine recent feedback and propose new chunks. */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const rl = await rateLimitDb(await clientKey(request, "flywheel"), 10, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ message: "Too many requests." }, { status: 429 });

  try {
    const db = await getDb();
    const feedbackCol = await getAiFeedbackCollection();
    const seeds = (
      await feedbackCol
        .find({})
        .sort({ createdAt: -1 })
        .limit(SEED_LIMIT)
        .toArray()
    ).map<FeedbackSeed>((f) => ({
      id: String(f._id),
      kind: f.kind,
      text: (f.text ?? "").slice(0, 400),
      feedback: (f.feedback ?? "").slice(0, 400),
      grade: f.grade ?? null,
      createdAt: f.createdAt,
    }));

    // Existing titles so the model avoids duplicates.
    const existing = await db
      .collection("ai_chunks")
      .find({}, { projection: { title: 1 } })
      .limit(200)
      .toArray();
    const titles = existing.map((c) => String(c.title ?? "")).filter(Boolean);

    const { drafts, offline, model } = await draftKnowledgeFromSeeds(seeds, titles);

    const col = await getKnowledgeDraftsCollection();
    const now = new Date();
    let inserted = 0;
    for (const d of drafts.slice(0, 3)) {
      await col.insertOne({
        title: d.title,
        faq: d.faq,
        source: d.source,
        offline: d.offline,
        model,
        status: "draft",
        seedId: d.source.startsWith("seed::") ? d.source.slice("seed::".length) : null,
        createdAt: now,
        updatedAt: now,
      });
      inserted += 1;
    }

    return NextResponse.json({ inserted, drafts, offline, model });
  } catch {
    return NextResponse.json({ message: "Could not mine knowledge. Try again." }, { status: 500 });
  }
}