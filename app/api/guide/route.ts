import { streamText } from "ai";
import { NextResponse } from "next/server";

import { rateLimitDb, clientKey } from "@/lib/rate-limit";
import { aiConfigured, getChatModel } from "@/lib/ai/config";
import { sseEvent, SSE_HEADERS } from "@/lib/ai/sse";
import { guideSystemPrompt } from "@/lib/guide/persona";
import { offlineGuideReply } from "@/lib/guide/guide";
import { retrieveContext } from "@/lib/ai/tutor";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_HISTORY = 8;

export async function POST(request: Request) {
  const rl = await rateLimitDb(await clientKey(request, "guide"), 40, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { message: "The guide is taking a short break. Please try again in a moment." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const messages = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ message: "A message is required." }, { status: 400 });
  }

  const lang = (body as { lang?: unknown })?.lang === "ur" ? "ur" : "en";

  const history = messages.flatMap(
    (m): Array<{ role: "user" | "assistant"; content: string }> => {
      if (!m || typeof m !== "object") return [];
      const role = (m as { role?: unknown }).role;
      if (role !== "user" && role !== "assistant") return [];
      return [{ role, content: String((m as { content?: unknown }).content ?? "").slice(0, 4000) }];
    }
  ).slice(-MAX_HISTORY);

  const lastUser = [...history].reverse().find((m) => m.role === "user");
  const question = lastUser?.content?.trim() ?? "";
  if (!question) {
    return NextResponse.json({ message: "Please say or type something." }, { status: 400 });
  }

  // Ground the reply with the same knowledge base the tutor uses. Any outage
  // falls back to an empty context so the guide can still answer honestly.
  let ctx: Awaited<ReturnType<typeof retrieveContext>> = {
    sources: [],
    context: "",
    vector: false,
  };
  try {
    ctx = await retrieveContext(question);
  } catch {
    ctx = { sources: [], context: "", vector: false };
  }

  if (!aiConfigured()) {
    // Offline deterministic guide — still streamed as SSE so the UI is identical.
    const stream = new TransformStream<Uint8Array, Uint8Array>();
    const writer = stream.writable.getWriter();
    void (async () => {
      try {
        await writer.write(
          sseEvent("delta", { text: offlineGuideReply(question, lang) })
        );
        await writer.write(sseEvent("sources", { sources: ctx.sources, vector: ctx.vector }));
        await writer.write(sseEvent("done", { ok: true }));
      } catch {
        await writer.write(sseEvent("error", { message: "The guide is unavailable right now." })).catch(() => {});
      } finally {
        await writer.close().catch(() => {});
      }
    })();
    return new Response(stream.readable, { headers: SSE_HEADERS });
  }

  const result = streamText({
    model: getChatModel(),
    system: guideSystemPrompt(ctx.context, lang),
    messages: history,
    temperature: 0.7,
    maxOutputTokens: 360,
  });

  const stream = new TransformStream<Uint8Array, Uint8Array>();
  const writer = stream.writable.getWriter();

  void (async () => {
    try {
      for await (const chunk of result.textStream) {
        if (chunk) await writer.write(sseEvent("delta", { text: chunk }));
      }
      await writer.write(sseEvent("sources", { sources: ctx.sources, vector: ctx.vector }));
      await writer.write(sseEvent("done", { ok: true }));
    } catch {
      await writer.write(sseEvent("error", { message: "Sorry, Aina hit a snag. Try again." })).catch(() => {});
    } finally {
      await writer.close().catch(() => {});
    }
  })();

  return new Response(stream.readable, { headers: SSE_HEADERS });
}