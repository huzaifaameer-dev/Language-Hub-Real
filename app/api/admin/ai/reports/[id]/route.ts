import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { requireAdmin } from "@/lib/admin-guard";
import { getAiReportsCollection } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET — a single saved AI weekly report (admin panel). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Invalid report id." }, { status: 400 });
  }

  const col = await getAiReportsCollection();
  const doc = await col.findOne({ _id: new ObjectId(id) });
  if (!doc) return NextResponse.json({ message: "Report not found." }, { status: 404 });

  return NextResponse.json({
    report: {
      id: String(doc._id),
      period: doc.period,
      text: doc.text,
      metrics: doc.metrics as Record<string, unknown>,
      offline: !!doc.offline,
      model: doc.model ?? null,
      createdAt: doc.createdAt.toISOString(),
    },
  });
}