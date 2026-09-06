import { streamText } from "ai";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { rateLimitDb } from "@/lib/rate-limit";
import { aiConfigured, aiModelLabel, getChatModel } from "@/lib/ai/config";
import { sseEvent, SSE_HEADERS } from "@/lib/ai/sse";
import { feedbackSystemPrompt } from "@/lib/ai/prompts";
import {
  offlineFeedback,
  parseGrade,
  saveFeedbackRecord,
  type FeedbackKind,
} from "@/lib/ai/feedback";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_TEXT = 12000;

/**
 * POST — AI essay/speaking feedback. Streams the graded feedback as SSE so the
 * student sees it arrive token by token; the final full feedback is persisted
 * to the student's history for later review.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  const rl = await rateLimitDb(`ai-feedback:${session.user.id}`, 12, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { message: "You've used your AI feedback quota for the hour. Try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const { kind, text, taskPrompt } = (body ?? {}) as {
    kind?: unknown;
    text?: unknown;
    taskPrompt?: unknown;
  };

  if (kind !== "essay" && kind !== "speaking") {
    return NextResponse.json({ message: "kind must be 'essay' or 'speaking'." }, { status: 400 });
  }
  const content = typeof text === "string" ? text.trim() : "";
  if (content.length < 20) {
    return NextResponse.json(
      { message: "Please submit at least a few sentences of writing or speaking." },
      { status: 400 }
    );
  }
  const prompt = typeof taskPrompt === "string" ? taskPrompt.slice(0, 2000) : undefined;

  const doOffline = () => offlineFeedback(content, kind);
  const persist = async (feedback: string, grade: string | null, offline: boolean) => {
    try {
      await saveFeedbackRecord({
        userId: session.user.id,
        kind: kind as FeedbackKind,
        taskPrompt: prompt ?? null,
        text: content,
        feedback,
        grade,
        model: offline ? null : aiModelLabel(),
        offline,
      });
    } catch {
      // saving history is best-effort; feedback already streamed
    }
  };

  const stream = new TransformStream<Uint8Array, Uint8Array>();
  const writer = stream.writable.getWriter();

  void (async () => {
    try {
      if (!aiConfigured()) {
        const { feedback, grade } = doOffline();
        await writer.write(sseEvent("delta", { text: feedback }));
        await persist(feedback, grade, true);
        await writer.write(sseEvent("done", { ok: true, grade, offline: true }));
        return;
      }

      const result = streamText({
        model: getChatModel(),
        system: feedbackSystemPrompt(kind as FeedbackKind, prompt),
        prompt: `Student submission:\n\n${content.slice(0, MAX_TEXT)}`,
        temperature: 0.4,
        maxOutputTokens: 900,
      });

      let full = "";
      for await (const chunk of result.textStream) {
        if (chunk) {
          full += chunk;
          await writer.write(sseEvent("delta", { text: chunk }));
        }
      }
      const grade = parseGrade(full);
      await persist(full, grade, false);
      await writer.write(sseEvent("done", { ok: true, grade, offline: false }));
    } catch {
      await writer.write(
        sseEvent("error", { message: "The grader hit a snag. Please try again." })
      ).catch(() => {});
    } finally {
      await writer.close().catch(() => {});
    }
  })();

  return new Response(stream.readable, { headers: SSE_HEADERS });
}