import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/admin-guard";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";
import { getDb, getDemoBookingsCollection, getAiAnalysesCollection } from "@/lib/db";
import { generateDemoBrief } from "@/lib/growth/demo-brief";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST — build an AI pre-call brief for a demo booking. */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const rl = await rateLimitDb(await clientKey(request, "demo-brief"), 30, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ message: "Too many requests." }, { status: 429 });

  const body = (await request.json().catch(() => ({}))) as { demoId?: string };
  if (!body.demoId || !ObjectId.isValid(body.demoId)) {
    return NextResponse.json({ message: "Missing demoId." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const demos = await getDemoBookingsCollection();
    const demo = await demos.findOne({ _id: new ObjectId(body.demoId) });
    if (!demo) return NextResponse.json({ message: "Demo booking not found." }, { status: 404 });

    // Pull any WhatsApp history for the same phone number.
    const waHistory = await db
      .collection("whatsapp_leads")
      .find({ phone: { $regex: String(demo.phone ?? "").replace(/[^\d]/g, "") + "$" } })
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray();

    // Placement result keyed by the booking email.
    let placement: { level: string; overallScore: number; recommendedCourse: string } | null = null;
    if (demo.email) {
      const row = await (await getAiAnalysesCollection())
        .find({ kind: "placement", email: String(demo.email) })
        .sort({ createdAt: -1 })
        .limit(1)
        .toArray();
      const r = row[0];
      if (r) {
        const res = r.result as Record<string, unknown> | undefined;
        placement = {
          level: String(res?.level ?? ""),
          overallScore: Number(res?.overallScore ?? 0),
          recommendedCourse: String(res?.recommendedCourse ?? ""),
        };
      }
    }

    const brief = await generateDemoBrief({
      name: demo.name ?? "",
      course: demo.course ?? "",
      preferredDate: demo.preferredDate ?? "",
      preferredTime: demo.preferredTime ?? "",
      message: demo.message ?? null,
      whatsappHistory: waHistory.map((w) => `${w.text ?? ""} → ${w.reply ?? ""}`),
      placement,
    });

    return NextResponse.json({ brief, demo: { id: String(demo._id), course: demo.course, name: demo.name } });
  } catch {
    return NextResponse.json({ message: "Could not build the brief. Try again." }, { status: 500 });
  }
}