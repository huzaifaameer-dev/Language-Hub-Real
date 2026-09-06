"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bot,
  BotMessageSquare,
  Check,
  RefreshCw,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionTitle, GlassPanel } from "./ui";
import { Markdown } from "@/components/ai/Markdown";

interface AiDraft {
  title: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  tags: string[];
  slug: string;
}

interface AgentStatus {
  mode: string;
  aiConfigured: boolean;
  model: string | null;
  jobs: { queued: number; done: number; failed: number };
  lastLogs: Array<{ kind: string; action: string; refKey: string; ok: boolean; createdAt: string }>;
}

interface QueueItem {
  id: string;
  kind: string;
  refKey: string;
  status: string;
  createdAt: string;
}

interface LogItem {
  id: string;
  kind: string;
  action: string;
  refKey: string;
  detail: string | null;
  ok: boolean;
  offline: boolean;
  createdAt: string;
}

export function AdminAgent() {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [log, setLog] = useState<LogItem[]>([]);
  const [shield, setShield] = useState<{ total: number; events: Array<{ id: string; kind: string; path: string; createdAt: string }> } | null>(null);
  const [topic, setTopic] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [publishBusy, setPublishBusy] = useState(false);
  const [aiDraft, setAiDraft] = useState<AiDraft | null>(null);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/ai/agent/jobs")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        if (d.status) setStatus(d.status as AgentStatus);
        if (d.queue) setQueue(d.queue as QueueItem[]);
        if (d.log) setLog(d.log as LogItem[]);
      })
      .catch(() => {});
  }, []);

  useEffect(load, [load]);
  useEffect(() => {
    const id = window.setInterval(load, 12000);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    fetch("/api/security/event")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setShield(d as typeof shield))
      .catch(() => {});
  }, []);

  const writeBlog = async () => {
    if (aiBusy || topic.trim().length < 4) return;
    setAiBusy(true);
    setPublishedUrl(null);
    setAiDraft(null);
    setErr(null);
    try {
      const res = await fetch("/api/ai/agent/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(d.message ?? "Generation failed.");
      }
      const d = (await res.json()) as { post: AiDraft };
      setAiDraft(d.post);
      setTopic("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not generate the post.");
    } finally {
      setAiBusy(false);
    }
  };

  const publishDraft = async () => {
    if (!aiDraft || publishBusy) return;
    setPublishBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/ai/agent/blog/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...aiDraft }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(d.message ?? "Publish failed.");
      }
      const d = (await res.json()) as { article: string };
      setPublishedUrl(d.article);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not publish.");
    } finally {
      setPublishBusy(false);
    }
  };

  const online = status?.aiConfigured;

  return (
    <section className="flex flex-col gap-5">
      {/* Header + always-active strip */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionTitle kicker="Autonomous AI admin" title="AI Operations Agent" />
          <p className="mt-1.5 flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-widest text-ink-3">
            <span className={cn("inline-flex h-1.5 w-1.5 rounded-full", status?.jobs.queued ? "animate-pulse bg-emerald-500" : "bg-emerald-400")} />
            Running continuously in the background — applications → enroll → payment → demos → blog, no manual run needed.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 font-mono text-[0.6rem] font-bold uppercase tracking-widest text-emerald-700">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          Always active
        </span>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Mode" value={status?.mode ?? "…"} accent={status?.mode === "paused" ? "amber" : "brand"} />
        <Stat label="AI model" value={online ? (status?.model ?? "configured") : "offline rules"} accent={online ? "emerald" : "neutral"} />
        <Stat label="Queued jobs" value={status?.jobs.queued ?? "…"} accent="sky" />
        <Stat label="Done / Failed" value={`${status?.jobs.done ?? 0} / ${status?.jobs.failed ?? 0}`} accent="brand" />
      </div>

      {/* Fortress shield */}
      <GlassPanel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle kicker="Fortress shield" title="Blocked attacks" />
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 font-mono text-[0.58rem] font-bold uppercase tracking-widest text-rose-600">
            <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
            {shield?.total ?? 0} blocked
          </span>
        </div>
        {!shield?.events?.length ? (
          <p className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-6 text-center font-mono text-[0.78rem] text-emerald-700">
            No attacks logged — the wall stands. 🛡️
          </p>
        ) : (
          <div className="mt-4 flex max-h-44 flex-col gap-1.5 overflow-y-auto pr-1">
            {shield.events.map((e) => (
              <div key={e.id} className="flex items-start gap-2.5 rounded-xl border border-ink/[0.08] bg-white/60 px-3 py-2">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-400" />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[0.66rem] font-bold uppercase tracking-widest text-ink">
                    {e.kind} <span className="text-ink-3">· {e.path}</span>
                  </p>
                  <p className="font-mono text-[0.56rem] text-ink-3">{new Date(e.createdAt).toLocaleString("en-GB")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>

      {err && <p className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 font-mono text-[0.72rem] font-bold text-rose-600">{err}</p>}

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Queue */}
        <GlassPanel>
          <div className="flex items-center justify-between">
            <SectionTitle kicker="Work queue" title="Pending jobs" />
            <button type="button" onClick={load} className="grid h-8 w-8 place-items-center rounded-full border border-ink/12 bg-white/70 text-ink-2 hover:text-brand-deep" aria-label="Refresh queue">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
          {queue.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-ink/12 py-10 text-center font-mono text-[0.78rem] text-ink-3">
              Queue is empty — the agent is up to date. 🎉
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              {queue.map((j) => (
                <div key={j.id} className="flex items-center gap-3 rounded-xl border border-ink/10 bg-white/70 px-3 py-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand/[0.08] text-brand-deep">
                    {j.kind === "BLOG" ? <BotMessageSquare className="h-4 w-4" /> : <WandSparkles className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[0.66rem] font-bold uppercase tracking-widest text-ink-2">{j.kind}</p>
                    <p className="truncate font-mono text-[0.6rem] text-ink-3">{j.refKey}</p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 font-mono text-[0.56rem] font-bold uppercase tracking-widest",
                      j.status === "running" ? "bg-amber-50 text-amber-700" : "bg-sky-50 text-sky-700"
                    )}
                  >
                    {j.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </GlassPanel>

        {/* Agent log feed */}
        <GlassPanel>
          <SectionTitle kicker="Audit feed" title="Agent actions" />
          {log.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-ink/12 py-10 text-center font-mono text-[0.78rem] text-ink-3">
              No agent actions recorded yet.
            </p>
          ) : (
            <div className="mt-4 flex max-h-80 flex-col gap-1.5 overflow-y-auto pr-1">
              {log.map((l) => (
                <div key={l.id} className="flex items-start gap-2.5 rounded-xl border border-ink/[0.08] bg-white/60 px-3 py-2">
                  <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", l.ok ? "bg-emerald-400" : "bg-rose-400")} />
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[0.66rem] font-bold uppercase tracking-widest text-ink">
                      {l.kind} · {l.action} <span className="text-ink-3">· {l.refKey}</span>
                    </p>
                    <p className="truncate text-[0.72rem] text-ink-2">{l.detail}</p>
                    <p className="font-mono text-[0.56rem] text-ink-3">{new Date(l.createdAt).toLocaleString("en-GB")}{l.offline ? " · offline" : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassPanel>
      </div>

      {/* AI blog studio */}
      <GlassPanel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle kicker="AI content" title="Blog studio — write & publish" />
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-mono text-[0.58rem] font-bold uppercase tracking-widest text-emerald-700">
            <Bot className="h-3.5 w-3.5" /> Aina writes it · adds cover art · publishes
          </span>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void writeBlog()}
              placeholder="e.g. How to ace IELTS Writing Task 2"
              className="h-11 flex-1 rounded-xl border border-ink/12 bg-white/80 px-4 text-[0.9rem] outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/[0.08]"
            />
            <button
              type="button"
              onClick={() => void writeBlog()}
              disabled={aiBusy || topic.trim().length < 4}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-deep to-brand-magenta px-6 font-display text-[0.72rem] font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-40"
            >
              {aiBusy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {aiBusy ? "Writing…" : "Generate blog post"}
            </button>
          </div>

          {/* AI draft preview */}
          {aiDraft && (
            <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
              {aiDraft.coverImage && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={aiDraft.coverImage} alt="cover" className="h-40 w-full object-cover" />
              )}
              <div className="p-5">
                <p className="font-display text-[1.15rem] font-extrabold leading-tight text-ink">{aiDraft.title}</p>
                <p className="mt-1.5 font-serif text-[0.9rem] italic text-ink-2">{aiDraft.excerpt}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {aiDraft.tags.map((t) => (
                    <span key={t} className="rounded-full border border-brand/20 bg-brand/[0.05] px-2.5 py-0.5 font-mono text-[0.58rem] font-bold text-brand-deep">
                      #{t}
                    </span>
                  ))}
                </div>
                <div className="mt-4 max-h-56 overflow-y-auto rounded-xl border border-ink/[0.07] bg-[#faf8f4] px-4 py-3">
                  <Markdown text={aiDraft.content} />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void publishDraft()}
                    disabled={publishBusy}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 font-display text-[0.72rem] font-bold text-white transition-all hover:-translate-y-0.5 hover:brightness-105 disabled:opacity-50"
                  >
                    {publishBusy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {publishBusy ? "Publishing…" : "Publish post"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAiDraft(null); setPublishedUrl(null); }}
                    className="inline-flex h-10 items-center rounded-xl border border-ink/12 px-4 font-display text-[0.7rem] font-bold text-ink-2 transition-all hover:border-rose-300 hover:text-rose-600"
                  >
                    Discard
                  </button>
                  {publishedUrl && (
                    <a href={publishedUrl} className="inline-flex items-center gap-1.5 font-mono text-[0.7rem] font-bold text-emerald-600 hover:underline">
                      Published ✓ View post →
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </GlassPanel>
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent: "brand" | "emerald" | "amber" | "sky" | "neutral" }) {
  const map: Record<string, string> = {
    brand: "from-brand to-brand-magenta",
    emerald: "from-emerald-500 to-emerald-600",
    amber: "from-amber-500 to-amber-600",
    sky: "from-sky-500 to-sky-600",
    neutral: "from-slate-500 to-slate-600",
  };
  return (
    <div className="rounded-2xl border border-ink/10 bg-white/70 px-4 py-3">
      <p className={`bg-gradient-to-r ${map[accent]} bg-clip-text font-display text-[1.2rem] font-extrabold leading-none text-transparent`}>
        {value}
      </p>
      <p className="mt-1 font-mono text-[0.56rem] font-bold uppercase tracking-[0.18em] text-ink-3">{label}</p>
    </div>
  );
}