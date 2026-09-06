import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/admin-guard";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";
import { getApplicationsCollection, getAiAnalysesCollection, getDb } from "@/lib/db";
import { triageApplication, type TriageInput } from "@/lib/growth/triage";
import { courseSeatSummary, seatViews, batchUsageFor } from "@/lib/seat-math";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export interface TriageRow {
  id: string;
  name: string;
  email: string;
  course: string;
  place: string;
  createdAt: string;
  triage: {
    decision: string;
    reason: string;
    suggestedBatch: string | null;
    notes: string;
    offline: boolean;
    model: string | null;
    at: string;
  } | null;
}

/** Pull the latest placement analysis for an applicant (by email). */
async function placementFor(email: string) {
  const col = await getAiAnalysesCollection();
  const row = await col
    .find({ kind: "placement", email })
    .sort({ createdAt: -1 })
    .limit(1)
    .toArray();
  const r = row[0];
  if (!r) return null;
  const result = r.result as Record<string, unknown> | undefined;
  return {
    level: String(result?.level ?? ""),
    recommendedCourse: String(result?.recommendedCourse ?? ""),
    overallScore: Number(result?.overallScore ?? 0),
  };
}

/** Seat pressure for the requested course (aggregate across batches). */
async function seatsFor(course: string) {
  try {
    const db = await getDb();
    const doc = await db.collection("courses").findOne({ name: course });
    if (!doc?.batches) return null;
    const enrolled = await db
      .collection("enrollments")
      .find({ status: "ENROLLED" })
      .project({ batch: 1, subjects: 1 })
      .toArray();
    const used = batchUsageFor(enrolled as Array<{ batch: string; subjects?: string[] }>);
    const views = seatViews(doc.batches as Array<{ name: string; time: string; seatsTotal: number }>, used, course);
    const summary = courseSeatSummary(views);
    return { seatsLeft: summary.seatsLeft, full: summary.seatsLeft <= 0 };
  } catch {
    return null;
  }
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const apps = await getApplicationsCollection();
  const rows = await apps
    .find({ status: "PENDING" })
    .sort({ createdAt: 1 })
    .limit(100)
    .toArray();

  return NextResponse.json({
    applications: rows.map<TriageRow>((a) => {
      const t = (a as unknown as { triage?: TriageRow["triage"] }).triage ?? null;
      return {
        id: String(a._id),
        name: a.name ?? "",
        email: a.email ?? "",
        course: a.course ?? "",
        place: a.place ?? "",
        createdAt: a.createdAt.toISOString(),
        triage: t,
      };
    }),
  });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const rl = await rateLimitDb(await clientKey(request, "triage"), 40, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ message: "Too many requests." }, { status: 429 });

  const body = (await request.json().catch(() => ({}))) as { applicationId?: string };
  if (!body.applicationId || !ObjectId.isValid(body.applicationId)) {
    return NextResponse.json({ message: "Missing applicationId." }, { status: 400 });
  }

  const apps = await getApplicationsCollection();
  const app = await apps.findOne({ _id: new ObjectId(body.applicationId) });
  if (!app) return NextResponse.json({ message: "Application not found." }, { status: 404 });

  const input: TriageInput = {
    name: app.name ?? "",
    email: app.email ?? "",
    course: app.course ?? "",
    place: app.place ?? "",
    bio: (app.bio as string) ?? "",
    message: (app.message as string | undefined) ?? undefined,
    createdAt: app.createdAt,
    placement: await placementFor(app.email ?? ""),
    seats: await seatsFor(app.course ?? ""),
  };

  const { suggestion, offline, model } = await triageApplication(input);
  const triage = {
    decision: suggestion.decision,
    reason: suggestion.reason,
    suggestedBatch: suggestion.suggestedBatch ?? null,
    notes: suggestion.notes,
    offline,
    model,
    at: new Date().toISOString(),
  };

  await apps.updateOne(
    { _id: app._id },
    { $set: { triage, updatedAt: new Date() } }
  );

  return NextResponse.json({ triage });
}