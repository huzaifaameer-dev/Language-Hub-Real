"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, FileText, RefreshCw, Sparkles } from "lucide-react";
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