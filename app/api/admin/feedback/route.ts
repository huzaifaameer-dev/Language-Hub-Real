import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { requireAdmin, isValidObjectId } from "@/lib/admin-guard";
import { ensureIndexesAndAdmin, getFeedbackCollection, logAdminAction } from "@/lib/db";
import { type FeedbackStatus } from "@/lib/db";

const PatchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["REVIEWED", "ARCHIVED"]),
  adminNote: z.string().max(800).trim().optional().nullable(),
});

const STATUSES: FeedbackStatus[] = ["NEW", "REVIEWED", "ARCHIVED"];

/** Admin: list feedback with queue counts (small rows — no heavy payloads). */
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  await ensureIndexesAndAdmin();
  const { searchParams } = new URL(request.url);
  const qstatus = searchParams.get("status")?.toUpperCase();
  const countsOnly = searchParams.get("counts") === "1";

  const col = await getFeedbackCollection();
  const filter: { status?: FeedbackStatus } =
    qstatus && (STATUSES as string[]).includes(qstatus)
      ? { status: qstatus as FeedbackStatus }
      : {};

  const [fbTotal, fbNew, fbReviewed, fbArchived] = await Promise.all([
    col.countDocuments({}),
    col.countDocuments({ status: "NEW" }),
    col.countDocuments({ status: "REVIEWED" }),
    col.countDocuments({ status: "ARCHIVED" }),
  ]);

  const counts = { fbTotal, fbNew, fbReviewed, fbArchived };
  if (countsOnly) {
    return NextResponse.json({ counts });
  }

  const docs = await col.find(filter).sort({ createdAt: -1 }).limit(500).toArray();

  const list = docs.map((d) => ({
    id: String(d._id),
    name: d.name,
    email: d.email ?? null,
    userId: d.userId ?? null,
    category: d.category,
    rating: d.rating,
    subject: d.subject,
    message: d.message,
    contactOk: !!d.contactOk,
    status: d.status,
    adminNote: d.adminNote ?? null,
    createdAt: d.createdAt.toISOString(),
  }));

  return NextResponse.json({
    items: list,
    counts,
  });
}

/** Admin: mark feedback reviewed/archived, optionally attach a reply note. */
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
    return NextResponse.json({ message: "Invalid record id." }, { status: 400 });
  }

  await ensureIndexesAndAdmin();
  const col = await getFeedbackCollection();
  const update: Record<string, unknown> = {
    status: parsed.data.status,
    updatedAt: new Date(),
  };
  if (parsed.data.adminNote !== undefined) update.adminNote = parsed.data.adminNote || null;

  const result = await col.updateOne({ _id: new ObjectId(parsed.data.id) }, { $set: update });
  if (result.matchedCount === 0) {
    return NextResponse.json({ message: "Record not found." }, { status: 404 });
  }

  void logAdminAction({
    actor: admin.email ?? "admin",
    action: parsed.data.status,
    targetType: "feedback",
    targetLabel: String(parsed.data.id),
  });

  return NextResponse.json({ ok: true });
}