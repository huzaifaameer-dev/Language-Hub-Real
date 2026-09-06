import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * WhatsApp Business API integration.
 *
 * Uses the standard Cloud API message shape, which works across providers used
 * in Pakistan (Meta Cloud API, Twilio, 360dialog, etc.). The endpoint is
 * configurable so you can point it at your provider.
 *
 * Environment variables:
 *   WA_API_URL        — provider base URL (default: https://graph.facebook.com/v18.0/<phone-id>/messages)
 *   WA_TOKEN          — bearer token / API key
 *   WA_WEBHOOK_TOKEN  — verification token for the webhook handshake
 *   WA_PHONE_NUMBER   — the business WhatsApp number (E.164)
 */

const WA_API_URL =
  (process.env.WA_API_URL ?? "").replace(/\/+$/, "") ||
  "https://graph.facebook.com/v18.0";
const WA_TOKEN = process.env.WA_TOKEN ?? "";
const WA_WEBHOOK_TOKEN = process.env.WA_WEBHOOK_TOKEN ?? "";
const WA_PHONE = process.env.WA_PHONE_NUMBER ?? process.env.NEXT_PUBLIC_ACADEMY_WHATSAPP ?? "";

/** True only when a WhatsApp Business API token is configured. */
export function waConfigured(): boolean {
  return !!WA_TOKEN;
}

export function waWebhookConfigured(): boolean {
  return !!WA_WEBHOOK_TOKEN;
}

/**
 * Verify a Meta Cloud API webhook signature (`X-Hub-Signature-256`). The raw
 * request body is HMAC-SHA256'd with the webhook token; `sha256=<digest>`
 * compares constant-time. Returns false when the token is not configured (the
 * caller decides whether that is acceptable).
 */
export function verifyWaSignature(
  signatureHeader: string | null,
  rawBody: string,
  secret = WA_WEBHOOK_TOKEN
): boolean {
  if (!secret || !signatureHeader) return false;
  const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const a = Buffer.from(signatureHeader.trim());
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export interface WaTextMessage {
  to: string; // E.164 number
  text: string;
}

/** Send a plain text WhatsApp message. */
export async function sendWaText(input: WaTextMessage): Promise<{ ok: boolean; error?: string }> {
  if (!waConfigured()) return { ok: false, error: "WhatsApp API not configured." };

  const to = input.to.startsWith("+") ? input.to : `+${input.to.replace(/[^\d]/g, "")}`;

  try {
    const res = await fetch(`${WA_API_URL}/${WA_PHONE || ""}/messages`.replace("//", "/"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WA_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: input.text },
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: body?.error?.message ?? `HTTP ${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

/** Send a WhatsApp template message (pre-approved for high deliverability). */
export async function sendWaTemplate(input: {
  to: string;
  templateName: string;
  langCode?: string;
  components?: unknown[];
}): Promise<{ ok: boolean; error?: string }> {
  if (!waConfigured()) return { ok: false, error: "WhatsApp API not configured." };

  const to = input.to.startsWith("+") ? input.to : `+${input.to.replace(/[^\d]/g, "")}`;

  try {
    const res = await fetch(`${WA_API_URL}/${WA_PHONE || ""}/messages`.replace("//", "/"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WA_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: input.templateName,
          language: { code: input.langCode ?? "en" },
          ...(input.components ? { components: input.components } : {}),
        },
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: body?.error?.message ?? `HTTP ${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

/**
 * Keyword-based lead funnel auto-reply. Returns a message for the incoming
 * customer text, and a flag for whether to notify the admin.
 */
export function autoReplyFor(text: string): { message: string; lead: boolean; category?: string } {
  const t = (text || "").toLowerCase().trim();

  if (/(demo|free class|trial|book)/.test(t)) {
    return {
      message:
        "Great choice! 🎉 You can book your free demo class right now at https://" + host() + "/#reviews or tell me your name, preferred course (Spoken English / IELTS / PTE / Duolingo), and a good time. I'll set you up!",
      lead: true,
      category: "demo",
    };
  }

  if (/(fee|price|cost|kitnay|kitne|charges)/.test(t)) {
    return {
      message:
        "Our monthly fees are: Spoken English Rs 8,000 · IELTS Rs 12,000 · PTE Rs 12,000 · Duolingo Rs 6,000. Which course are you interested in?",
      lead: true,
      category: "pricing",
    };
  }

  if (/(ielts|band|score)/.test(t)) {
    return {
      message:
        "IELTS is one of our most popular courses! We help students reach Band 6.5+ with weekly mocks and one-on-one speaking reviews. Want a free demo to see how it works?",
      lead: true,
      category: "ielts",
    };
  }

  if (/(pte)/.test(t)) {
    return {
      message:
        "Our PTE course makes the computer-marked test feel routine with AI-scored practice and timed drills. Want to book a free demo?",
      lead: true,
      category: "pte",
    };
  }

  if (/(duolingo|det)/.test(t)) {
    return {
      message:
        "The Duolingo English Test course is a 6-week sprint with daily lessons and adaptive mocks to lift your score fast. Interested in a free demo?",
      lead: true,
      category: "duolingo",
    };
  }

  if (/(spoken|english|urdu)/.test(t)) {
    return {
      message:
        "Spoken English is where most students start — small batches where you actually speak every session. Want to try a free demo?",
      lead: true,
      category: "spoken",
    };
  }

  if (/(hi|hello|salam|salaam|assalam|help|assist)/.test(t)) {
    return {
      message:
        "Assalam o alaikum! 👋 Welcome to Language Hub. I can help you book a free demo, check fees, or pick a course. What would you like to know?",
      lead: false,
    };
  }

  // Default fallback.
  return {
    message:
      "Thanks for reaching out to Language Hub! 💬 I can help with: 1) Book a free demo, 2) Course fees, 3) IELTS/PTE/Duolingo prep. Just tell me what you need! (Or a team member will reply shortly.)",
    lead: false,
  };
}

function host(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    "localhost:3000"
  ).replace(/^https?:\/\//, "");
}
