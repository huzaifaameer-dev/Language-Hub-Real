"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck,
  BotMessageSquare,
  CalendarClock,
  CircleX,
  Compass,
  FileText,
  Lightbulb,
  MessageCircleMore,
  RefreshCw,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionTitle, GlassPanel } from "./ui";
import { Markdown } from "@/components/ai/Markdown";

interface WeeklyMetrics {
  signups: number;
  applications: { total: number; pending: number; approved: number; rejected: number };
  enrollments: { total: number; enrolled: number; awaitingPayment: number; byCourse: Array<{ course: string; count: number }> };
  revenue: { amount: number; transactions: number; withdrawals: number };
  leads: { placementTests: number; demoBookings: number; whatsapp: number };
  assignments: { submitted: number; graded: number };
  progress: { activeLearners: number; avgCompletionPct: number };
  certificates: { issued: number };
}

interface WeeklyReport {
  id: string;
  period: string;
  text: string;
  metrics: WeeklyMetrics;
  offline: boolean;
  model: string | null;
  requestedBy: string;
  createdAt: string;
}

interface ReportLite {
  id: string;
  period: string;
  headline: string;
  offline: boolean;
  createdAt: string;
}

export function AdminAi() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latest, setLatest] = useState<WeeklyReport | null>(null);
  const [history, setHistory] = useState<ReportLite[]>([]);

  const loadHistory = useCallback(() => {
    fetch("/api/admin/ai/reports")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.reports) setHistory(d.reports as ReportLite[]);
      })
      .catch(() => {});
  }, []);

  useEffect(loadHistory, [loadHistory]);

  const generate = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setLatest(null);
    try {
      const res = await fetch("/api/admin/ai/weekly-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: 7 }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(d.message ?? "Generation failed.");
      }
      const d = (await res.json()) as { report: WeeklyReport };
      setLatest(d.report);
      setHistory((prev) => [
        {
          id: d.report.id,
          period: d.report.period,
          headline: d.report.text.split("\n").find((l) => l.trim().startsWith("#"))?.replace(/^#+\s*/, "") ?? "Weekly report",
          offline: d.report.offline,
          createdAt: d.report.createdAt,
        },
        ...prev,
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate the report.");
    } finally {
      setBusy(false);
    }
  };

  const m = latest?.metrics;

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionTitle kicker="AI teacher assistant" title="Weekly Performance Report" />
        <button
          type="button"
          onClick={() => void generate()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-deep to-brand-magenta px-6 py-2.5 font-display text-[0.78rem] font-bold text-white shadow-[0_14px_30px_-12px_rgb(110_90_224/0.8)] transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-50"
        >
          {busy ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {busy ? "AI agent is gathering data…" : "Generate weekly summary"}
        </button>
      </div>

      <p className="flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-widest text-ink-3">
        <CalendarClock className="h-4 w-4 text-brand-deep" />
        The agent pulls enrollments, revenue, leads, assignments &amp; progress through function calls, then writes the narrative.
      </p>

      {error && (
        <p className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 font-mono text-[0.72rem] font-bold text-rose-600">
          {error}
        </p>
      )}

      {busy && !latest && (
        <GlassPanel className="grid place-items-center py-20 text-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand/25 border-t-brand-deep" />
          <p className="mt-4 font-display text-[0.9rem] font-bold text-ink">AI agent is running…</p>
          <p className="mt-1 font-mono text-[0.68rem] text-ink-3">tool calling → narrative → persisted report</p>
        </GlassPanel>
      )}

      {latest && (
        <GlassPanel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-magenta text-white">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-[1.05rem] font-extrabold text-ink">Latest weekly report</p>
                <p className="font-mono text-[0.62rem] uppercase tracking-widest text-ink-3">{latest.period}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {latest.offline ? (
                <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 font-mono text-[0.58rem] font-bold uppercase tracking-widest text-amber-700">
                  offline fallback
                </span>
              ) : (
                <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 font-mono text-[0.58rem] font-bold uppercase tracking-widest text-emerald-700">
                  live · {latest.model}
                </span>
              )}
              <span className="rounded-full border border-ink/12 bg-white/70 px-3 py-1 font-mono text-[0.58rem] text-ink-3">
                {new Date(latest.createdAt).toLocaleString("en-GB")}
              </span>
            </div>
          </div>

          {m && (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
              <Metric label="Signups" value={m.signups} />
              <Metric label="Applications" value={m.applications.total} />
              <Metric label="Enrolled" value={m.enrollments.enrolled} />
              <Metric label="Revenue (PKR)" value={m.revenue.amount.toLocaleString("en-PK")} prefix="Rs " />
              <Metric label="Leads" value={m.leads.placementTests + m.leads.demoBookings + m.leads.whatsapp} />
              <Metric label="Active learners" value={m.progress.activeLearners} />
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-ink/10 bg-[#faf8f4] p-5 sm:p-6">
            <Markdown text={latest.text} />
          </div>
        </GlassPanel>
      )}

      {/* Growth & AI assistants */}
      <QuerySection />
      <TriageSection />
      <RecapSection />
      <FlywheelSection />
      <DemoBriefSection />

      {/* History */}
      <GlassPanel>
        <div className="flex items-center justify-between">
          <p className="font-display text-[0.62rem] font-bold uppercase tracking-[0.34em] text-brand-deep">
            Report history
          </p>
          <button
            type="button"
            onClick={loadHistory}
            className="grid h-8 w-8 place-items-center rounded-full border border-ink/12 bg-white/70 text-ink-2 transition-all hover:text-brand-deep"
            aria-label="Refresh history"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
        {history.length === 0 ? (
          <div className="mt-4 grid place-items-center rounded-2xl border border-dashed border-ink/12 py-12 text-center">
            <p className="font-mono text-[0.8rem] text-ink-3">
              No reports yet — generate your first weekly summary above.
            </p>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            {history.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={async () => {
                  if (latest?.id === r.id) return;
                  setError(null);
                  try {
                    const res = await fetch(`/api/admin/ai/reports/${r.id}`);
                    if (res.ok) {
                      const d = (await res.json()) as { report: WeeklyReport };
                      setLatest(d.report);
                    }
                  } catch {}
                }}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-4 py-3 text-start transition-all hover:bg-white/70",
                  latest?.id === r.id ? "border-brand/40 bg-brand/[0.05]" : "border-ink/10 bg-white/60"
                )}
              >
                <FileText className="h-4 w-4 shrink-0 text-brand-deep" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-[0.84rem] font-extrabold text-ink">{r.headline}</p>
                  <p className="font-mono text-[0.6rem] uppercase tracking-widest text-ink-3">{r.period}</p>
                </div>
                {r.offline ? (
                  <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 font-mono text-[0.52rem] font-bold uppercase text-amber-700">offline</span>
                ) : (
                  <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 font-mono text-[0.52rem] font-bold uppercase text-emerald-700">ai</span>
                )}
              </button>
            ))}
          </div>
        )}
      </GlassPanel>
    </section>
  );
}

export function QuerySection() {
  const [query, setQuery] = useState("");
  const [days, setDays] = useState(7);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<{ answer: string; offline: boolean; model: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (busy || !query.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, days }),
      });
      if (!res.ok) throw new Error("Query failed.");
      const d = (await res.json()) as { result: { answer: string; offline: boolean; model: string | null } };
      setOut(d.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not answer.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <GlassPanel>
      <SectionTitle kicker="Ask your data" title="Natural-language analytics" />
      <div className="mt-4 flex flex-col gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void run()}
          placeholder='e.g. "How much revenue did IELTS bring this month?"'
          className="h-11 rounded-xl border border-ink/12 bg-white/80 px-4 text-[0.9rem] outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/[0.08]"
        />
        <div className="flex flex-wrap items-center gap-2">
          <label className="font-mono text-[0.6rem] font-bold uppercase tracking-widest text-ink-3">Window</label>
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`rounded-full px-3 py-1 font-mono text-[0.6rem] font-bold uppercase tracking-widest transition-all ${days === d ? "bg-brand-deep text-white" : "border border-ink/12 text-ink-2 hover:border-brand/40"}`}
            >
              {d}d
            </button>
          ))}
          <button
            type="button"
            onClick={() => void run()}
            disabled={busy || !query.trim()}
            className="ml-auto inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-brand-deep to-brand-magenta px-5 font-display text-[0.7rem] font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-40"
          >
            {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <MessageCircleMore className="h-4 w-4" />}
            {busy ? "Thinking…" : "Ask"}
          </button>
        </div>
        {error && <p className="font-mono text-[0.72rem] font-bold text-rose-600">{error}</p>}
        {out && (
          <div className="rounded-2xl border border-ink/10 bg-[#faf8f4] p-5">
            <div className="mb-3 flex items-center gap-2">
              {out.offline ? (
                <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 font-mono text-[0.55rem] font-bold uppercase text-amber-700">offline</span>
              ) : (
                <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 font-mono text-[0.55rem] font-bold uppercase text-emerald-700">live · {out.model}</span>
              )}
            </div>
            <Markdown text={out.answer} />
          </div>
        )}
      </div>
    </GlassPanel>
  );
}

interface TriageRow {
  id: string;
  name: string;
  course: string;
  place: string;
  createdAt: string;
  triage: { decision: string; reason: string; suggestedBatch: string | null; notes: string; offline: boolean; at: string } | null;
}

export function TriageSection() {
  const [rows, setRows] = useState<TriageRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/admin/ai/triage")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.applications) setRows(d.applications as TriageRow[]);
      })
      .catch(() => {});
  }, []);
  useEffect(load, [load]);

  const suggest = async (id: string) => {
    if (busyId) return;
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/ai/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: id }),
      });
      if (res.ok) {
        const d = (await res.json()) as { triage: TriageRow["triage"] };
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, triage: d.triage } : r)));
      }
    } finally {
      setBusyId(null);
    }
  };

  const pending = rows.filter((r) => !r.triage);

  return (
    <GlassPanel>
      <SectionTitle kicker="Admissions assistant" title="Application triage suggestions" />
      <p className="mt-2 font-mono text-[0.6rem] uppercase tracking-widest text-ink-3">
        {pending.length} pending applications without a suggestion
      </p>
      {rows.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-ink/12 py-8 text-center font-mono text-[0.78rem] text-ink-3">
          No pending applications.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-2.5">
          {rows.map((r) => (
            <div key={r.id} className="rounded-2xl border border-ink/10 bg-white/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-display text-[0.9rem] font-extrabold text-ink">
                    {r.name} · <span className="text-brand-deep">{r.course}</span>
                  </p>
                  <p className="font-mono text-[0.58rem] uppercase tracking-widest text-ink-3">
                    {r.place || "no city"} · {new Date(r.createdAt).toLocaleDateString("en-GB")}
                  </p>
                </div>
                {r.triage ? (
                  <span
                    className={`rounded-full px-3 py-1 font-display text-[0.6rem] font-bold uppercase tracking-widest ${
                      r.triage.decision === "APPROVE"
                        ? "bg-emerald-50 text-emerald-700"
                        : r.triage.decision === "WAITLIST"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-rose-50 text-rose-600"
                    }`}
                  >
                    {r.triage.decision}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => void suggest(r.id)}
                    disabled={busyId === r.id}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-ink px-4 font-display text-[0.66rem] font-bold uppercase tracking-widest text-ivory transition-all hover:bg-brand-deep disabled:opacity-50"
                  >
                    <WandSparkles className="h-3.5 w-3.5" />
                    {busyId === r.id ? "…" : "Suggest"}
                  </button>
                )}
              </div>
              {r.triage ? (
                <div className="mt-3 space-y-1 border-t border-ink/[0.06] pt-3 text-[0.82rem]">
                  <p className="text-ink-2"><span className="font-bold">Reason:</span> {r.triage.reason}</p>
                  {r.triage.suggestedBatch && (
                    <p className="text-ink-2"><span className="font-bold">Suggested batch:</span> {r.triage.suggestedBatch}</p>
                  )}
                  <p className="text-ink-3"><span className="font-bold">Verify:</span> {r.triage.notes}</p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </GlassPanel>
  );
}

interface RecapResult {
  id: string;
  course: string;
  summary: string;
  homework: string;
  gaps: Array<{ student: string; gap: string; suggestion: string }>;
  offline: boolean;
  model: string | null;
}

export function RecapSection() {
  const [form, setForm] = useState({ course: "", batch: "", topics: "", notes: "", emails: "" });
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<RecapResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (busy || !form.course.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ai/session-recap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course: form.course,
          batch: form.batch || undefined,
          topics: form.topics.split(",").map((t) => t.trim()).filter(Boolean),
          notes: form.notes,
          studentEmails: form.emails.split(",").map((e) => e.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error("Recap failed.");
      const d = (await res.json()) as { recap: RecapResult };
      setOut(d.recap);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate.");
    } finally {
      setBusy(false);
    }
  };

  const field = "rounded-xl border border-ink/12 bg-white/80 px-3.5 py-2.5 text-[0.86rem] outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/[0.08]";
  return (
    <GlassPanel>
      <SectionTitle kicker="Teaching assistant" title="AI session recap" />
      <div className="mt-4 grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} placeholder="Course (e.g. Spoken English)" className={field} />
          <input value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} placeholder="Batch (optional)" className={field} />
        </div>
        <input value={form.topics} onChange={(e) => setForm({ ...form, topics: e.target.value })} placeholder="Topics covered (comma separated)" className={field} />
        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Paste your session notes here…" rows={3} className={field} />
        <input value={form.emails} onChange={(e) => setForm({ ...form, emails: e.target.value })} placeholder="Student emails (comma separated) — they'll be notified" className={field} />
        <button
          type="button"
          onClick={() => void run()}
          disabled={busy || !form.course.trim()}
          className="inline-flex h-10 w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-brand-deep to-brand-magenta px-5 font-display text-[0.7rem] font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-40"
        >
          {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BotMessageSquare className="h-4 w-4" />}
          {busy ? "Generating…" : "Generate recap"}
        </button>
        {error && <p className="font-mono text-[0.72rem] font-bold text-rose-600">{error}</p>}
        {out && (
          <div className="rounded-2xl border border-ink/10 bg-[#faf8f4] p-5">
            <p className="font-display text-[0.9rem] font-extrabold text-ink">{out.course} — recap</p>
            <p className="mt-2 text-[0.86rem] leading-relaxed text-ink-2">{out.summary}</p>
            <p className="mt-3 font-display text-[0.62rem] font-bold uppercase tracking-[0.2em] text-brand-deep">Homework</p>
            <p className="text-[0.86rem] text-ink-2">{out.homework}</p>
            {out.gaps.length > 0 && (
              <>
                <p className="mt-3 font-display text-[0.62rem] font-bold uppercase tracking-[0.2em] text-brand-deep">Per-student gaps</p>
                <ul className="mt-1.5 flex flex-col gap-1.5">
                  {out.gaps.map((g, i) => (
                    <li key={i} className="text-[0.8rem] text-ink-2">
                      <span className="font-bold text-ink">{g.student}</span>: {g.gap} — {g.suggestion}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </GlassPanel>
  );
}

interface Draft {
  id: string;
  title: string;
  faq: string;
  source: string;
  offline: boolean;
  createdAt: string;
}

export function FlywheelSection() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/admin/growth/knowledge-drafts")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.drafts) setDrafts(d.drafts as Draft[]);
      })
      .catch(() => {});
  }, []);
  useEffect(load, [load]);

  const mine = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/admin/growth/knowledge-drafts", { method: "POST" });
      load();
    } finally {
      setBusy(false);
    }
  };

  const decide = async (id: string, action: "approve" | "reject") => {
    setBusyId(id);
    try {
      await fetch(`/api/admin/growth/knowledge-drafts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <GlassPanel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle kicker="Knowledge flywheel" title="Teach the tutor" />
        <button
          type="button"
          onClick={() => void mine()}
          disabled={busy}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-brand/30 bg-brand/[0.06] px-4 font-display text-[0.7rem] font-bold text-brand-deep transition-all hover:bg-brand/[0.12] disabled:opacity-50"
        >
          {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
          Mine recent submissions
        </button>
      </div>
      <p className="mt-2 font-mono text-[0.6rem] uppercase tracking-widest text-ink-3">
        Approve drafts → they become RAG knowledge the tutor &amp; guide can answer from.
      </p>
      {drafts.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-ink/12 py-8 text-center font-mono text-[0.78rem] text-ink-3">
          No drafts in the queue.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-2.5">
          {drafts.map((d) => (
            <div key={d.id} className="rounded-2xl border border-ink/10 bg-white/70 p-4">
              <p className="font-display text-[0.88rem] font-extrabold text-ink">{d.title}</p>
              <p className="mt-1 text-[0.82rem] leading-relaxed text-ink-2">{d.faq}</p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void decide(d.id, "approve")}
                  disabled={busyId === d.id}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 font-display text-[0.64rem] font-bold text-white transition-all hover:bg-emerald-700 disabled:opacity-50"
                >
                  <BadgeCheck className="h-3.5 w-3.5" /> Approve
                </button>
                <button
                  type="button"
                  onClick={() => void decide(d.id, "reject")}
                  disabled={busyId === d.id}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-ink/12 px-3 font-display text-[0.64rem] font-bold text-ink-2 transition-all hover:border-rose-300 hover:text-rose-600 disabled:opacity-50"
                >
                  <CircleX className="h-3.5 w-3.5" /> Reject
                </button>
                {d.offline && (
                  <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 font-mono text-[0.52rem] font-bold uppercase text-amber-700">offline</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassPanel>
  );
}

interface DemoOption { id: string; name: string; course: string; preferredDate: string; preferredTime: string }

export function DemoBriefSection() {
  const [options, setOptions] = useState<DemoOption[]>([]);
  const [demoId, setDemoId] = useState("");
  const [busy, setBusy] = useState(false);
  const [brief, setBrief] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/admin/demo-bookings?status=PENDING")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const list = (d?.bookings ?? []) as DemoOption[];
        setOptions(list);
        if (list[0] && !demoId) setDemoId(list[0].id);
      })
      .catch(() => {});
  }, [demoId]);
  useEffect(load, [load]);

  const run = async () => {
    if (busy || !demoId) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/ai/demo-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoId }),
      });
      if (!res.ok) throw new Error("Brief failed.");
      const d = (await res.json()) as {
        brief: { leadSummary: string; recommendedCourse: string; talkingPoints: string[]; nextStep: string };
      };
      setBrief(
        `**Lead:** ${d.brief.leadSummary}\n\n**Recommended course:** ${d.brief.recommendedCourse}\n\n**Talking points:**\n${d.brief.talkingPoints.map((p) => `- ${p}`).join("\n")}\n\n**Next step:** ${d.brief.nextStep}`
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not build.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <GlassPanel>
      <SectionTitle kicker="Demo prep" title="AI pre-call brief" />
      <div className="mt-4 flex flex-col gap-3">
        <select
          value={demoId}
          onChange={(e) => setDemoId(e.target.value)}
          className="h-11 rounded-xl border border-ink/12 bg-white/80 px-3 text-[0.86rem] outline-none focus:border-brand"
        >
          {options.length === 0 && <option value="">No pending demos</option>}
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} · {o.course} · {o.preferredDate}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void run()}
          disabled={busy || !demoId}
          className="inline-flex h-10 w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-brand-deep to-brand-magenta px-5 font-display text-[0.7rem] font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-40"
        >
          {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Compass className="h-4 w-4" />}
          Build brief
        </button>
        {err && <p className="font-mono text-[0.72rem] font-bold text-rose-600">{err}</p>}
        {brief && (
          <div className="rounded-2xl border border-ink/10 bg-[#faf8f4] p-5">
            <Markdown text={brief} />
          </div>
        )}
      </div>
    </GlassPanel>
  );
}

function Metric({ label, value, prefix = "" }: { label: string; value: string | number; prefix?: string }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white/70 px-4 py-3">
      <p className="font-display text-[1.25rem] font-extrabold leading-none text-ink">
        {prefix}
        {value}
      </p>
      <p className="mt-1 font-mono text-[0.56rem] font-bold uppercase tracking-[0.18em] text-ink-3">{label}</p>
    </div>
  );
}