import { streamText } from "ai";
import { NextResponse } from "next/server";

import { clientKey, rateLimitDb } from "@/lib/rate-limit";
import { aiConfigured, getChatModel } from "@/lib/ai/config";
import { sseEvent, SSE_HEADERS } from "@/lib/ai/sse";
import {
  practiceSystemPrompt,
  PRACTICE_TOPICS,
  offlinePracticeReply,
  type PracticeTopic,
  type PracticeLang,
} from "@/lib/growth/practice";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_TURNS = 6;

export async function POST(request: Request) {
  const rl = await rateLimitDb(await clientKey(request, "practice"), 40, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ message: "Practice limit reached. Try again in a bit." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const { text, topic, lang, turn } = (body ?? {}) as {
    text?: unknown;
    topic?: unknown;
    lang?: unknown;
    turn?: unknown;
  };
  const userText = String(text ?? "").trim().slice(0, 1200);
  if (!userText) {
    return NextResponse.json({ message: "Say something first." }, { status: 400 });
  }
  const currentTopic: PracticeTopic = PRACTICE_TOPICS.includes(topic as PracticeTopic)
    ? (topic as PracticeTopic)
    : "introduce-yourself";
  const practiceLang: PracticeLang = lang === "ur" ? "ur" : "en";
  const turnNum = Math.max(1, Math.min(MAX_TURNS, Number(turn) || 1));

  if (!aiConfigured()) {
    const stream = new TransformStream<Uint8Array, Uint8Array>();
    const writer = stream.writable.getWriter();
    void (async () => {
      try {
        await writer.write(sseEvent("delta", { text: offlinePracticeReply(userText, turnNum) }));
        await writer.write(sseEvent("done", { ok: true }));
      } catch {
        await writer.write(sseEvent("error", { message: "Practice unavailable right now." })).catch(() => {});
      } finally {
        await writer.close().catch(() => {});
      }
    })();
    return new Response(stream.readable, { headers: SSE_HEADERS });
  }

  const result = streamText({
    model: getChatModel(),
    system: practiceSystemPrompt(currentTopic, practiceLang, turnNum),
    messages: [
      { role: "user", content: userText },
    ],
    temperature: 0.8,
    maxOutputTokens: 180,
  });

  const stream = new TransformStream<Uint8Array, Uint8Array>();
  const writer = stream.writable.getWriter();
  void (async () => {
    try {
      for await (const chunk of result.textStream) {
        if (chunk) await writer.write(sseEvent("delta", { text: chunk }));
      }
      await writer.write(sseEvent("done", { ok: true }));
    } catch {
      await writer.write(sseEvent("error", { message: "Sorry, Aina lost her words. Try again." })).catch(() => {});
    } finally {
      await writer.close().catch(() => {});
    }
  })();

  return new Response(stream.readable, { headers: SSE_HEADERS });
}