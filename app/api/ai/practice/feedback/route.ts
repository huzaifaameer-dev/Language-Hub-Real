import { streamText } from "ai";
import { NextResponse } from "next/server";

import { clientKey, rateLimitDb } from "@/lib/rate-limit";
import { aiConfigured, aiModelLabel, getChatModel } from "@/lib/ai/config";
import { sseEvent, SSE_HEADERS } from "@/lib/ai/sse";
import { offlineFeedback } from "@/lib/ai/feedback";
import { practiceFluencyLabel } from "@/lib/growth/practice";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST — grade a finished voice-practice transcript. Streams examiner-style
 * feedback; falls back to the deterministic offline scorer without a key.
 */
export async function POST(request: Request) {
  const rl = await rateLimitDb(await clientKey(request, "practice-feedback"), 20, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ message: "Practice feedback limit reached." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({})) as { text?: unknown };
  const text = String(body.text ?? "").trim().slice(0, 4000);
  if (text.length < 12) {
    return NextResponse.json({ message: "Speak a little more so I can grade you." }, { status: 400 });
  }

  const words = text.split(/\s+/).filter(Boolean).length;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
  const fluency = practiceFluencyLabel(words, sentences);

  if (!aiConfigured()) {
    const offline = offlineFeedback(text, "speaking");
    const stream = new TransformStream<Uint8Array, Uint8Array>();
    const writer = stream.writable.getWriter();
    void (async () => {
      try {
        await writer.write(sseEvent("fluency", { label: fluency, words, sentences }));
        await writer.write(sseEvent("delta", { text: offline.feedback }));
        await writer.write(sseEvent("done", { ok: true }));
      } catch {
        await writer.write(sseEvent("error", { message: "Feedback unavailable." })).catch(() => {});
      } finally {
        await writer.close().catch(() => {});
      }
    })();
    return new Response(stream.readable, { headers: SSE_HEADERS });
  }

  const result = streamText({
    model: getChatModel(),
    system:
      "You are an IELTS Speaking examiner at Language Hub grading a short voice-practice transcript. Give a warm but honest scorecard: an overall fluency label, what the learner said well, 2-3 specific corrections with the corrected sentence, and one next practice task. Plain text, short, no tables.",
    messages: [{
      role: "user",
      content: `Grade this speaking transcript (~${words} words):\n\n"""${text}"""`,
    }],
    temperature: 0.4,
    maxOutputTokens: 420,
  });

  const stream = new TransformStream<Uint8Array, Uint8Array>();
  const writer = stream.writable.getWriter();
  void (async () => {
    try {
      await writer.write(sseEvent("fluency", { label: fluency, words, sentences, model: aiModelLabel() }));
      for await (const chunk of result.textStream) {
        if (chunk) await writer.write(sseEvent("delta", { text: chunk }));
      }
      await writer.write(sseEvent("done", { ok: true }));
    } catch {
      await writer.write(sseEvent("error", { message: "Feedback failed. Try again." })).catch(() => {});
    } finally {
      await writer.close().catch(() => {});
    }
  })();

  return new Response(stream.readable, { headers: SSE_HEADERS });
}