import { NextResponse } from "next/server";

import { sendWaText, waConfigured, verifyWaSignature, waWebhookConfigured } from "@/lib/whatsapp";
import { getDb } from "@/lib/db";
import { notifyAdmins } from "@/lib/notifications";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";
import { nextWaReply, initialReply, type WaFlowState } from "@/lib/growth/wa-flow";

export const dynamic = "force-dynamic";

/**
 * WhatsApp Business API webhook.
 *
 * GET  — Meta verification handshake (hub.challenge).
 * POST — inbound messages → stateful onboarding flow (course → batch → name)
 *        with keyword fallback, lead funnel into `whatsapp_leads`, and a demo
 *        booking created when the funnel completes.
 *
 * Security: when WA_WEBHOOK_TOKEN is set, every POST must carry a valid
 * `X-Hub-Signature-256` (HMAC of the raw body) or it is rejected with 401.
 * Per-phone + per-client rate limits and an admin-notify throttle stop
 * spammers from flooding the panel or burning WhatsApp credits.
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
  const raw = await request.text().catch(() => "");

  // Signature gate (only when a webhook token is configured).
  if (waWebhookConfigured()) {
    const signature = request.headers.get("x-hub-signature-256");
    if (!verifyWaSignature(signature, raw)) {
      return NextResponse.json({ received: false }, { status: 401 });
    }
  }

  // Bound inbound volume per sender + per client.
  const clientKeyId = await clientKey(request, "wa-webhook");
  const rlClient = await rateLimitDb(clientKeyId, 120, 60 * 60 * 1000);
  if (!rlClient.ok) return NextResponse.json({ received: true }, { status: 429 });

  const entries = (JSON.parse(raw || "{}") as { entry?: unknown }).entry as Array<{ changes: Array<{ value: { messages?: unknown[]; contacts?: unknown[] } }> }> | undefined;
  const messages = entries?.[0]?.changes?.[0]?.value?.messages ?? [];

  for (const msg of messages as Array<{ from?: string; text?: { body?: string } }>) {
    const from = msg.from ?? "";
    const text = msg.text?.body ?? "";
    if (!from || !text) continue;

    const rlPhone = await rateLimitDb(`wa:${from}`, 40, 60 * 60 * 1000);
    if (!rlPhone.ok) continue;

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
          await notifyAdminsThrottled(from, patch.flow.name ?? undefined, demoLabel);
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
      await notifyAdminsThrottled(from, undefined, `${replyCat ?? "new"} · "${text.slice(0, 90)}"`);
    }
  }

  return NextResponse.json({ received: true });
}

/** Notify admins at most a few times per phone per hour (anti-notification-spam). */
async function notifyAdminsThrottled(
  phone: string,
  name?: string,
  label?: string
): Promise<void> {
  const rl = await rateLimitDb(`wa-notify:${phone}`, 6, 60 * 60 * 1000);
  if (!rl.ok) return;
  await notifyAdmins({
    kind: "whatsapp-lead",
    title: `WhatsApp lead ${name ? `· ${name}` : ""}`,
    message: label ? `${phone}: ${label}` : `New conversation from ${phone}`,
    href: "/admin-panel",
  });
}