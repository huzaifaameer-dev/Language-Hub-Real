"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, IndianRupee, Repeat, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassPanel } from "./ui";

const ease = [0.16, 1, 0.3, 1] as const;

interface Bucket {
  date: string;
  value: number;
}

interface ReqAnalytics {
  revenue: {
    lifetime: number;
    week7: number;
    month30: number;
    series7: Bucket[];
    series30: Bucket[];
  };
  signups: {
    week7: number;
    month30: number;
    series7: Bucket[];
    series30: Bucket[];
  };
  retention: Array<{
    week: string;
    enrolledCount: number;
    activeCount: number;
    retentionRate: number;
  }>;
  providerMix: Array<{ provider: string; count: number }>;
  funnel: { applied: number; approved: number; enrolled: number };
}

function fmtPKR(n: number): string {
  return `Rs ${n.toLocaleString("en-PK")}`;
}

function BarChart({ data, accent, valueFmt }: {
  data: Bucket[];
  accent: string;
  valueFmt?: (v: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="mt-4">
      <div className="flex h-28 items-end gap-1.5">
        {data.map((d, i) => (
          <div key={d.date} className="group flex flex-1 flex-col items-center gap-1.5" style={{ height: "100%", justifyContent: "flex-end" }}>
            <motion.div
              initial={{ height: 0 }}
              whileInView={{ height: `${Math.max(4, (d.value / max) * 100)}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease, delay: i * 0.03 }}
              className="w-full rounded-t-md"
              style={{ background: accent, minHeight: d.value > 0 ? 4 : 2 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[0.55rem] text-ink-3">
        <span>{data[0]?.date?.slice(5)}</span>
        <span>{data[Math.floor(data.length / 2)]?.date?.slice(5)}</span>
        <span>{data[data.length - 1]?.date?.slice(5)}</span>
      </div>
      <div className="mt-2 flex items-center justify-between font-mono text-[0.6rem] text-ink-2">
        <span>total</span>
        <b className={cn("font-bold", accent === "#10b981" ? "text-emerald-600" : "text-brand-deep")}>
          {valueFmt ? valueFmt(data.reduce((s, d) => s + d.value, 0)) : data.reduce((s, d) => s + d.value, 0)}
        </b>
      </div>
    </div>
  );
}

export function AdminAnalyticsCharts() {
  const [analytics, setAnalytics] = useState<ReqAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    fetch("/api/admin/analytics", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (on && d) setAnalytics(d);
      })
      .catch(() => {})
      .finally(() => on && setLoading(false));
    return () => {
      on = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-5 lg:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-52 animate-pulse rounded-2xl bg-slate-200/70" />
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <GlassPanel>
        <p className="font-mono text-[0.8rem] text-ink-3">Analytics unavailable — try again shortly.</p>
      </GlassPanel>
    );
  }

  const totalMix = Math.max(1, analytics.providerMix.reduce((s, p) => s + p.count, 0));

  return (
    <div className="flex flex-col gap-5">
      {/* Revenue + Signups row */}
      <div className="grid gap-5 lg:grid-cols-2">
        <GlassPanel>
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 font-display text-[0.62rem] font-bold uppercase tracking-[0.34em] text-emerald-600">
              <IndianRupee className="h-4 w-4" /> Revenue · 30 days
            </p>
            <span className="font-mono text-[0.6rem] text-ink-3">{analytics.revenue.month30 > 0 ? `${formatSign(analytics.revenue.month30 / Math.max(1, analytics.revenue.week7))}` : ""}</span>
          </div>
          <p className="mt-3 font-display text-[2rem] font-black text-ink">{fmtPKR(analytics.revenue.month30)}</p>
          <p className="font-mono text-[0.58rem] text-ink-3">
            last 7 days: <b className="text-emerald-600">{fmtPKR(analytics.revenue.week7)}</b> · lifetime <b>{fmtPKR(analytics.revenue.lifetime)}</b>
          </p>
          <BarChart data={analytics.revenue.series30} accent="#10b981" valueFmt={fmtPKR} />
        </GlassPanel>

        <GlassPanel>
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 font-display text-[0.62rem] font-bold uppercase tracking-[0.34em] text-indigo-600">
              <Users className="h-4 w-4" /> Student signups · 30 days
            </p>
          </div>
          <p className="mt-3 font-display text-[2rem] font-black text-ink">{analytics.signups.month30}</p>
          <p className="font-mono text-[0.58rem] text-ink-3">
            last 7 days: <b className="text-indigo-600">{analytics.signups.week7}</b>
          </p>
          <BarChart data={analytics.signups.series30} accent="#6366f1" />
        </GlassPanel>
      </div>

      {/* Retention */}
      <GlassPanel>
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 font-display text-[0.62rem] font-bold uppercase tracking-[0.34em] text-fuchsia-600">
            <Repeat className="h-4 w-4" /> Cohort retention · last 8 weeks
          </p>
          <span className="font-mono text-[0.6rem] text-ink-3">% of each cohort still ENROLLED</span>
        </div>
        <div className="mt-5 flex items-end gap-2">
          {analytics.retention.map((c, i) => (
            <div key={c.week} className="group flex flex-1 flex-col items-center gap-2">
              <motion.div
                initial={{ height: 0 }}
                whileInView={{ height: `${Math.max(6, c.retentionRate)}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease, delay: i * 0.04 }}
                className={cn(
                  "w-full max-w-[2.5rem] rounded-t-md",
                  c.retentionRate >= 80 ? "bg-emerald-500" : c.retentionRate >= 50 ? "bg-amber-500" : "bg-rose-400"
                )}
                style={{ minHeight: 6 }}
              />
              <div className="text-center">
                <p className="font-mono text-[0.6rem] font-bold text-ink">{c.retentionRate}%</p>
                <p className="font-mono text-[0.48rem] text-ink-3">{c.week}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 font-mono text-[0.58rem] uppercase tracking-widest text-ink-3">
          {analytics.retention[analytics.retention.length - 1]?.retentionRate ?? 0}% retained from the most recent cohort
        </p>
      </GlassPanel>

      {/* Funnel + Provider mix */}
      <div className="grid gap-5 lg:grid-cols-2">
        <GlassPanel>
          <p className="font-display text-[0.62rem] font-bold uppercase tracking-[0.34em] text-brand-deep">Enrollment funnel</p>
          <div className="mt-5 flex flex-col gap-3">
            <FunnelBar label="Applied" value={analytics.funnel.applied} total={Math.max(1, analytics.funnel.applied)} color="#6366f1" />
            <FunnelBar label="Approved" value={analytics.funnel.approved} total={Math.max(1, analytics.funnel.applied)} color="#8b5cf6" />
            <FunnelBar label="Enrolled" value={analytics.funnel.enrolled} total={Math.max(1, analytics.funnel.applied)} color="#10b981" />
          </div>
        </GlassPanel>

        <GlassPanel>
          <p className="font-display text-[0.62rem] font-bold uppercase tracking-[0.34em] text-brand-deep">Payment method mix</p>
          <div className="mt-5 flex flex-col gap-3">
            {analytics.providerMix.length === 0 ? (
              <p className="font-mono text-[0.8rem] text-ink-3">No payments recorded yet.</p>
            ) : (
              analytics.providerMix.map((p) => (
                <div key={p.provider}>
                  <div className="flex items-center justify-between font-mono text-[0.62rem] uppercase tracking-widest text-ink-3">
                    <span className="flex items-center gap-1.5">
                      <GraduationCap className="h-3 w-3" />
                      {p.provider}
                    </span>
                    <span className="text-ink-2">
                      {p.count} · {Math.round((p.count / totalMix) * 100)}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-ink/[0.07]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-deep to-brand-magenta transition-all duration-700"
                      style={{ width: `${(p.count / totalMix) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

function FunnelBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = Math.round((value / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between font-mono text-[0.62rem] uppercase tracking-widest text-ink-3">
        <span>{label}</span>
        <span className="text-ink-2">
          {value} · {pct}%
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-ink/[0.07]">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function formatSign(v: number): string {
  const round = Math.round(v * 10) / 10;
  return `week/month ${round}x`;
}
