import { NextResponse } from "next/server";

import { sendWaText, waConfigured } from "@/lib/whatsapp";
import { getDb } from "@/lib/db";
import { notifyAdmins } from "@/lib/notifications";
import { nextWaReply, initialReply, type WaFlowState } from "@/lib/growth/wa-flow";

export const dynamic = "force-dynamic";

/**
 * WhatsApp Business API webhook.
 *
 * GET  — Meta verification handshake (hub.challenge).
 * POST — inbound messages → stateful onboarding flow (course → batch → name)
 *        with keyword fallback, lead funnel into `whatsapp_leads`, and a demo
 *        booking created when the funnel completes.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && token === process.env.WA_WEBHOOK_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  // Accept and acknowledge even when not configured, so providers don't retry.
  const payload = await request.json().catch(() => null);
  if (!payload) return NextResponse.json({ received: true });

  const entries = payload.entry as Array<{ changes: Array<{ value: { messages?: unknown[]; contacts?: unknown[] } }> }> | undefined;
  const messages = entries?.[0]?.changes?.[0]?.value?.messages ?? [];

  for (const msg of messages as Array<{ from?: string; text?: { body?: string } }>) {
    const from = msg.from ?? "";
    const text = msg.text?.body ?? "";
    if (!from || !text) continue;

    const db = await getDb();
    const leads = db.collection<{
      phone: string;
      text?: string;
      category?: string | null;
      reply?: string;
      thread?: string[];
      flow?: WaFlowState;
      createdAt: Date;
      updatedAt: Date;
    }>("whatsapp_leads");

    // Look up the latest flow state for this phone.
    const last = await leads
      .find({ phone: from })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();
    const priorFlow = (last[0]?.flow ?? null) as WaFlowState | null;

    let replyCat: string | undefined;
    let lead = false;
    let completeDemo = false;
    let demoLabel: string | undefined;
    let patch: { flow: WaFlowState } | null = null;

    if (priorFlow?.stage && priorFlow.stage !== "done") {
      const r = nextWaReply(priorFlow, text);
      replyCat = r.category;
      lead = r.lead;
      completeDemo = !!r.completeDemo;
      demoLabel = r.demoLabel;
      patch = r.patch;
      // Persist the flow, then reply.
      try {
        await leads.updateOne(
          { phone: from },
          { $set: { flow: patch.flow, updatedAt: new Date() }, $push: { thread: text } }
        );
      } catch {}
      if (waConfigured()) void sendWaText({ to: from, text: r.reply });

      if (completeDemo) {
        try {
          await db.collection("demo_bookings").insertOne({
            name: patch.flow.name ?? from,
            email: "",
            phone: from,
            preferredDate: "—",
            preferredTime: "—",
            course: demoLabel ?? patch.flow.course ?? "TBD",
            message: null,
            status: "PENDING",
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          await notifyAdmins({
            kind: "wa-demo",
            title: "WhatsApp demo request",
            message: `${patch.flow.name} · ${demoLabel} · ${from}`,
            href: "/admin-panel",
          });
        } catch {}
      }
    } else {
      const r = initialReply(text);
      replyCat = r.category;
      lead = r.lead;
      patch = r.patch;
      try {
        await leads.insertOne({
          phone: from,
          text,
          category: replyCat ?? null,
          reply: r.reply,
          flow: patch.flow,
          thread: [text],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch {}
      if (waConfigured()) void sendWaText({ to: from, text: r.reply });
    }

    if (lead) {
      await notifyAdmins({
        kind: "whatsapp-lead",
        title: `WhatsApp lead: ${replyCat ?? "new"}`,
        message: `${from}: "${text.slice(0, 120)}"`,
        href: "/admin-panel",
      });
    }
  }

  return NextResponse.json({ received: true });
}