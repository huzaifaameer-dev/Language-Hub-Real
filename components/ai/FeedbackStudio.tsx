"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpenCheck, FilePen, Mic, RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Markdown } from "./Markdown";

type Kind = "essay" | "speaking";

interface HistoryItem {
  id: string;
  kind: Kind;
  taskPrompt: string | null;
  preview: string;
  feedback: string;
  grade: string | null;
  offline: boolean;
  createdAt: string;
}

const KIND_META: Record<Kind, { label: string; icon: React.ReactNode; hint: string }> = {
  essay: {
    label: "Essay",
    icon: <FilePen className="h-4 w-4" />,
    hint: "Paste an IELTS Task 2 essay or any English writing (150–400 words).",
  },
  speaking: {
    label: "Speaking",
    icon: <Mic className="h-4 w-4" />,
    hint: "Paste a speaking transcript — e.g. a 1–2 minute answer you recorded.",
  },
};

/** Read the SSE stream and dispatch events to the handler map. */
async function streamSSE(
  body: unknown,
  handlers: { delta: (t: string) => void; done: (d: { grade?: string | null; offline?: boolean }) => void; error: (m?: string) => void }
): Promise<void> {
  const res = await fetch("/api/ai/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    handlers.error((data as { message?: string }).message ?? "Feedback service unavailable.");
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) >= 0) {
      const frame = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      let event = "message";
      let data = "";
      for (const l of frame.split("\n")) {
        if (l.startsWith("event:")) event = l.slice(6).trim();
        else if (l.startsWith("data:")) data += l.slice(5).trim();
      }
      if (!data) continue;
      const payload = JSON.parse(data) as { text?: string; message?: string; grade?: string | null; offline?: boolean };
      if (event === "delta" && payload.text !== undefined) handlers.delta(payload.text);
      else if (event === "done") handlers.done({ grade: payload.grade, offline: payload.offline });
      else if (event === "error") handlers.error(payload.message);
    }
  }
}

export function FeedbackStudio() {
  const [kind, setKind] = useState<Kind>("essay");
  const [text, setText] = useState("");
  const [taskPrompt, setTaskPrompt] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [grade, setGrade] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [viewing, setViewing] = useState<HistoryItem | null>(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const loadHistory = useCallback(() => {
    fetch("/api/ai/feedback/history")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.feedback) setHistory(d.feedback as HistoryItem[]);
      })
      .catch(() => {});
  }, []);

  useEffect(loadHistory, [loadHistory]);

  const submit = async () => {
    if (!text.trim() || streaming) return;
    setStreaming(true);
    setError(null);
    setFeedback(null);
    setGrade(null);
    setOffline(false);
    setViewing(null);

    await streamSSE(
      { kind, text: text.trim(), taskPrompt: taskPrompt.trim() || undefined },
      {
        delta: (t) => setFeedback((prev) => (prev ?? "") + t),
        done: (d) => {
          setGrade(d.grade ?? null);
          setOffline(!!d.offline);
          loadHistory();
        },
        error: (m) => setError(m ?? "Something went wrong. Please retry."),
      }
    ).catch(() => setError("Network error — please try again."));

    setStreaming(false);
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="grid h-11 w-11 place-items-center rounded-2xl border border-ink/10 bg-white/70 text-ink-2 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:text-brand-deep"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="font-display text-[0.6rem] font-bold uppercase tracking-[0.32em] text-brand-deep">
              AI Feedback Studio
            </p>
            <h1 className="font-display text-[1.35rem] font-extrabold tracking-[-0.02em] text-ink">
              Get your writing &amp; speaking graded
            </h1>
          </div>
        </div>
        <span className="hidden items-center gap-2 rounded-full border border-violet-300 bg-violet-50/80 px-4 py-2 font-mono text-[0.62rem] font-black uppercase tracking-widest text-violet-700 sm:inline-flex">
          <Sparkles className="h-3.5 w-3.5" />
          Examiner-style feedback
        </span>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.72fr]">
        {/* LEFT: submit */}
        <section className="flex flex-col gap-5">
          <div className="glass-dash relative overflow-hidden rounded-3xl p-6 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-[1.1rem] font-extrabold text-ink">New submission</h2>
              <div className="flex gap-1.5 rounded-full border border-ink/10 bg-white/70 p-1">
                {(Object.keys(KIND_META) as Kind[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-display text-[0.78rem] font-bold transition-all",
                      kind === k
                        ? "bg-gradient-to-r from-brand-deep to-brand-magenta text-white shadow"
                        : "text-ink-2 hover:text-brand-deep"
                    )}
                  >
                    {KIND_META[k].icon}
                    {KIND_META[k].label}
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-4 text-[0.86rem] text-ink-2">{KIND_META[kind].hint}</p>

            <input
              value={taskPrompt}
              onChange={(e) => setTaskPrompt(e.target.value)}
              placeholder="Optional prompt — e.g. “Some people think cities should ban cars. Discuss both views.”"
              className="mt-4 w-full rounded-2xl border border-ink/10 bg-[#faf8f4] px-4 py-3 text-[0.9rem] text-ink outline-none transition-all placeholder:text-ink-3/70 focus:border-brand focus:ring-4 focus:ring-brand/[0.08]"
            />

            <div className="relative mt-4">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={kind === "essay" ? "Paste your essay here…" : "Paste your speaking transcript here…"}
                className="min-h-[260px] w-full resize-y rounded-2xl border border-ink/10 bg-[#faf8f4] px-4 py-3 text-[0.92rem] leading-relaxed text-ink outline-none transition-all placeholder:text-ink-3/70 focus:border-brand focus:ring-4 focus:ring-brand/[0.08]"
              />
              <span className="pointer-events-none absolute bottom-3 right-4 rounded-full bg-white/80 px-2.5 py-1 font-mono text-[0.6rem] font-bold text-ink-3">
                {wordCount} words
              </span>
            </div>

            {error && (
              <p className="mt-3 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 font-mono text-[0.72rem] font-bold text-rose-600">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={() => void submit()}
              disabled={streaming || text.trim().length < 20}
              className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-brand-deep to-brand-magenta px-8 font-display text-[0.88rem] font-bold text-white shadow-[0_16px_36px_-14px_rgb(110_90_224/0.8)] transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-40 disabled:hover:translate-y-0"
            >
              {streaming ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Grading…
                </>
              ) : (
                <>
                  <BookOpenCheck className="h-4.5 w-4.5" />
                  Get AI feedback
                </>
              )}
            </button>
          </div>

          {feedback && (
            <div className="glass-dash overflow-hidden rounded-3xl p-6 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-display text-[1.1rem] font-extrabold text-ink">
                  <Sparkles className="h-4.5 w-4.5 text-brand-deep" />
                  Your feedback
                </h2>
                <div className="flex items-center gap-2">
                  {grade && (
                    <span className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-1.5 font-display text-[0.78rem] font-extrabold text-emerald-700">
                      {grade}
                    </span>
                  )}
                  {offline && (
                    <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 font-mono text-[0.6rem] font-bold text-amber-700">
                      offline fallback
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-5">
                <Markdown text={feedback} />
              </div>
            </div>
          )}
        </section>

        {/* RIGHT: history */}
        <aside className="glass-dash flex h-fit flex-col overflow-hidden rounded-3xl p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-display text-[0.95rem] font-extrabold text-ink">
              <RefreshCw className="h-4 w-4 text-brand-deep" />
              Past feedback
            </h2>
            <button
              type="button"
              onClick={loadHistory}
              className="grid h-8 w-8 place-items-center rounded-full border border-ink/10 bg-white/70 text-ink-2 transition-all hover:text-brand-deep"
              aria-label="Refresh history"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          {history.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-ink/15 py-12 text-center">
              <p className="font-mono text-[0.8rem] text-ink-3">
                No feedback yet — submit your first essay or transcript.
              </p>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              {history.slice(0, 8).map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setViewing(h)}
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-start transition-all",
                    viewing?.id === h.id
                      ? "border-brand/40 bg-brand/[0.06]"
                      : "border-ink/10 bg-white/70 hover:border-brand/30"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[0.56rem] font-bold uppercase tracking-widest",
                        h.kind === "essay" ? "bg-brand/10 text-brand-deep" : "bg-emerald-50 text-emerald-600"
                      )}
                    >
                      {KIND_META[h.kind]?.icon}
                      {h.kind}
                    </span>
                    {h.grade && <span className="font-display text-[0.72rem] font-extrabold text-brand-deep">{h.grade}</span>}
                  </div>
                  <p className="mt-1.5 truncate text-[0.8rem] text-ink-2">{h.preview}</p>
                  <p className="mt-1 font-mono text-[0.56rem] text-ink-3">
                    {new Date(h.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </p>
                </button>
              ))}
            </div>
          )}

          {viewing && (
            <div className="mt-4 rounded-2xl border border-ink/10 bg-[#faf8f4] p-4">
              <p className="font-mono text-[0.58rem] uppercase tracking-widest text-ink-3">Viewing saved feedback</p>
              <div className="mt-2 max-h-80 overflow-y-auto">
                <Markdown text={viewing.feedback} />
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}