import { streamText } from "ai";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { rateLimitDb } from "@/lib/rate-limit";
import { aiConfigured, getChatModel } from "@/lib/ai/config";
import { sseEvent, SSE_HEADERS } from "@/lib/ai/sse";
import { tutorSystemPrompt, offlineTutorReply } from "@/lib/ai/prompts";
import {
  buildTutorMessages,
  retrieveContext,
  type TutorChatMessage,
} from "@/lib/ai/tutor";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_HISTORY = 8;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  const rl = await rateLimitDb(`ai-tutor:${session.user.id}`, 40, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { message: "You've used your AI tutor quota for the hour. Try again later." },
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

  const history: TutorChatMessage[] = messages
    .flatMap((m): TutorChatMessage[] => {
      if (!m || typeof m !== "object") return [];
      const role = (m as { role?: unknown }).role;
      if (role !== "user" && role !== "assistant") return [];
      return [{ role, content: String((m as { content?: unknown }).content ?? "").slice(0, 4000) }];
    })
    .slice(-MAX_HISTORY);

  const lastUser = [...history].reverse().find((m) => m.role === "user");
  const question = lastUser?.content?.trim() ?? "";
  if (!question) {
    return NextResponse.json({ message: "Please type a question." }, { status: 400 });
  }

  // Ground the answer: embed the question, retrieve syllabus/FAQ/blog context.
  // A DB or embedding outage must never break the chat — fall back to an empty
  // context so the LLM (or offline tutor) can still respond.
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
  const name = session.user.name ?? undefined;

  if (!aiConfigured()) {
    // Offline deterministic tutor — still sent as SSE so the UI is identical.
    const stream = new TransformStream<Uint8Array, Uint8Array>();
    const writer = stream.writable.getWriter();
    void (async () => {
      try {
        await writer.write(
          sseEvent("delta", { text: offlineTutorReply(question, ctx.sources.map((s) => s.title)) })
        );
        await writer.write(sseEvent("sources", { sources: ctx.sources, vector: ctx.vector }));
        await writer.write(sseEvent("done", { ok: true }));
      } catch {
        await writer.write(sseEvent("error", { message: "Tutor unavailable." })).catch(() => {});
      } finally {
        await writer.close().catch(() => {});
      }
    })();
    return new Response(stream.readable, { headers: SSE_HEADERS });
  }

  const result = streamText({
    model: getChatModel(),
    system: tutorSystemPrompt(ctx.context, name),
    messages: buildTutorMessages(history),
    temperature: 0.7,
    maxOutputTokens: 700,
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
      await writer.write(sseEvent("error", { message: "Sorry, the tutor hit a snag. Try again." })).catch(() => {});
    } finally {
      await writer.close().catch(() => {});
    }
  })();

  return new Response(stream.readable, { headers: SSE_HEADERS });
}