"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bot, Send, Sparkles, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { Markdown } from "./Markdown";

interface ChatSource {
  title: string;
  kind: string;
  source: string;
  snippet: string;
}

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
}

const SUGGESTIONS = [
  "How do I get a Band 7 in IELTS Writing?",
  "What is the difference between PTE and IELTS?",
  "I keep mixing up present perfect and past simple — explain?",
  "What does the Spoken English course cover?",
];

let seq = 0;
const nextId = () => `m-${++seq}`;

export function TutorChat({ name }: { name?: string }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const setLastAssistant = (patch: Partial<ChatMsg>) => {
    setMessages((prev) => {
      const copy = [...prev];
      for (let i = copy.length - 1; i >= 0; i--) {
        if (copy[i].role === "assistant") {
          copy[i] = { ...copy[i], ...patch, content: (copy[i].content || "") + (patch.content ?? "") };
          return copy;
        }
      }
      return copy;
    });
  };

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || streaming) return;
    setError(null);
    setInput("");

    const history = messages.map(({ role, content: c }) => ({ role, content: c }));
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "user", content },
      { id: nextId(), role: "assistant", content: "" },
    ]);
    setStreaming(true);

    try {
      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...history, { role: "user", content }] }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setError((data as { message?: string }).message ?? "The tutor is unavailable right now.");
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
          const lines = frame.split("\n");
          let event = "message";
          let data = "";
          for (const l of lines) {
            if (l.startsWith("event:")) event = l.slice(6).trim();
            else if (l.startsWith("data:")) data += l.slice(5).trim();
          }
          if (!data) continue;
          const payload = JSON.parse(data) as { text?: string; sources?: ChatSource[]; message?: string };
          if (event === "delta" && payload.text !== undefined) {
            setLastAssistant({ content: payload.text });
          } else if (event === "sources" && payload.sources) {
            setLastAssistant({ sources: payload.sources });
          } else if (event === "error") {
            setError(payload.message ?? "Something went wrong. Please retry.");
          }
        }
      }
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setStreaming(false);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      });
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-10">
      {/* Header */}
      <header className="mb-4 flex items-center justify-between gap-3">
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
              AI English Tutor
            </p>
            <h1 className="font-display text-[1.35rem] font-extrabold tracking-[-0.02em] text-ink">
              Chat with your {name ? `${name.split(" ")[0]}'s ` : ""}syllabus
            </h1>
          </div>
        </div>
        <span className="hidden items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50/80 px-4 py-2 font-mono text-[0.62rem] font-black uppercase tracking-widest text-emerald-700 sm:inline-flex">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          RAG-powered · grounded in course data
        </span>
      </header>

      {/* Chat body */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-white/70 bg-white/70 shadow-[0_24px_70px_-30px_rgb(15_23_42/0.25)] backdrop-blur-xl">
        <div ref={scrollRef} className="chat-scroll flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-8">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-brand to-brand-magenta text-white shadow-[0_18px_40px_-14px_rgb(110_90_224/0.7)]">
                <Sparkles className="h-7 w-7" strokeWidth={1.8} />
              </span>
              <h2 className="mt-5 font-display text-[1.35rem] font-extrabold tracking-[-0.02em] text-ink">
                Ask me anything about your English journey
              </h2>
              <p className="mt-2 max-w-md text-[0.88rem] leading-relaxed text-ink-2">
                Grammar, IELTS &amp; PTE strategy, Spoken English, Duolingo, fees, batches —
                I answer from Language Hub&apos;s real syllabus and material.
              </p>
              <div className="mt-6 flex max-w-xl flex-wrap items-center justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border border-ink/10 bg-white/80 px-4 py-2 text-[0.82rem] font-semibold text-ink-2 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:text-brand-deep"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "flex max-w-[88%] gap-3 sm:max-w-[78%]",
                  m.role === "user" && "flex-row-reverse"
                )}
              >
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-2xl",
                    m.role === "user"
                      ? "bg-gradient-to-br from-ink to-slate-700 text-ivory"
                      : "bg-gradient-to-br from-brand to-brand-magenta text-white"
                  )}
                >
                  {m.role === "user" ? <UserRound className="h-4.5 w-4.5" /> : <Bot className="h-4.5 w-4.5" />}
                </span>
                <div
                  className={cn(
                    "rounded-3xl px-4.5 py-3.5",
                    m.role === "user"
                      ? "rounded-tr-md bg-ink text-ivory"
                      : "rounded-tl-md border border-ink/8 bg-white text-ink shadow-sm"
                  )}
                >
                  {m.role === "assistant" ? (
                    m.content ? (
                      <Markdown text={m.content} />
                    ) : (
                      <span className="flex items-center gap-1.5 py-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-brand" style={{ animationDelay: "0ms" }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-brand" style={{ animationDelay: "120ms" }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-brand" style={{ animationDelay: "240ms" }} />
                      </span>
                    )
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}

                  {m.role === "assistant" && m.sources && m.sources.length > 0 && m.content && (
                    <div className="mt-3 flex flex-wrap gap-1.5 border-t border-ink/[0.07] pt-3">
                      <span className="mr-1 font-mono text-[0.56rem] uppercase tracking-widest text-ink-3">
                        Sources
                      </span>
                      {m.sources.map((s, i) => (
                        <span
                          key={i}
                          title={s.snippet}
                          className="rounded-full border border-brand/20 bg-brand/[0.05] px-2.5 py-1 font-mono text-[0.6rem] font-bold text-brand-deep"
                        >
                          {s.kind} · {s.title.slice(0, 32)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {error && (
            <div className="flex justify-center">
              <p className="rounded-full border border-rose-300 bg-rose-50 px-4 py-2 font-mono text-[0.72rem] font-bold text-rose-600">
                {error}
              </p>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-ink/[0.07] bg-white/80 px-5 py-4 backdrop-blur-xl sm:px-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex items-end gap-3"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              rows={1}
              placeholder="Ask about IELTS, PTE, grammar, courses…"
              className="max-h-36 min-h-[3rem] flex-1 resize-y rounded-2xl border border-ink/10 bg-[#faf8f4] px-4 py-3 text-[0.92rem] text-ink outline-none transition-all placeholder:text-ink-3/70 focus:border-brand focus:ring-4 focus:ring-brand/[0.08]"
            />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-deep to-brand-magenta text-white shadow-[0_14px_30px_-12px_rgb(110_90_224/0.8)] transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-40 disabled:hover:translate-y-0"
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
          <p className="mt-2 font-mono text-[0.56rem] uppercase tracking-[0.2em] text-ink-3">
            {streaming ? "Tutor is answering…" : "AI tutor grounds answers in Language Hub's syllabus, FAQ & blog."}
          </p>
        </div>
      </div>
    </div>
  );
}