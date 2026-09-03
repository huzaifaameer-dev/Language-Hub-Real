import { NextResponse } from "next/server";

import { autoReplyFor, sendWaText, waConfigured } from "@/lib/whatsapp";
import { getDb } from "@/lib/db";
import { notifyAdmins } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * WhatsApp Business API webhook.
 *
 * GET  — Meta verification handshake (hub.challenge).
 * POST — inbound messages → keyword auto-reply + lead funnel into the DB.
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

    const reply = autoReplyFor(text);

    // Record the lead.
    try {
      const db = await getDb();
      await db.collection("whatsapp_leads").insertOne({
        phone: from,
        text,
        category: reply.category ?? null,
        reply: reply.message,
        createdAt: new Date(),
      });
    } catch {}

    // Auto-reply to the customer.
    if (waConfigured()) {
      void sendWaText({ to: from, text: reply.message });
    }

    // Notify admins for genuine leads (not just greetings).
    if (reply.lead) {
      await notifyAdmins({
        kind: "whatsapp-lead",
        title: `WhatsApp lead: ${reply.category ?? "new"}`,
        message: `${from}: "${text.slice(0, 120)}"`,
        href: "/admin-panel",
      });
    }
  }

  return NextResponse.json({ received: true });
}
