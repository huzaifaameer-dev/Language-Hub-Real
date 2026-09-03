"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  BookOpen,
  CalendarClock,
  Clock,
  CreditCard,
  ExternalLink,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Radar,
  RefreshCw,
  ShieldCheck,
  Star,
  UserRoundPlus,
  Users,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { useLiveSync } from "@/lib/use-live";
import type { AdminApplication, AdminCounts, AdminEnrollment, AdminStats, AdminUser } from "./types";
import { deriveAdminStats } from "./stats";
import { AdminApplications } from "./AdminApplications";
import { AdminEnrollments } from "./AdminEnrollments";
import { AdminCourses } from "./AdminCourses";
import { AdminUsers } from "./AdminUsers";
import { AdminDemoBookings } from "./AdminDemoBookings";
import { AdminTestimonials } from "./AdminTestimonials";
import { AdminPayments } from "./AdminPayments";
import { AdminBlog } from "./AdminBlog";
import { AdminAuditLog } from "./AdminAuditLog";
import { AdminStatCard, GlassPanel, ProgressRing, StatusPill } from "./ui";
import { AdminAnalyticsCharts } from "./AdminAnalyticsCharts";

type Tab = "overview" | "applications" | "enrollments" | "payments" | "blog" | "audit" | "courses" | "users" | "demos" | "testimonials";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "applications", label: "Applications", icon: FileText },
  { key: "enrollments", label: "Enrollments", icon: GraduationCap },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "blog", label: "Blog", icon: BookOpen },
  { key: "audit", label: "Activity Log", icon: ShieldCheck },
  { key: "demos", label: "Demo Bookings", icon: CalendarClock },
  { key: "testimonials", label: "Testimonials", icon: Star },
  { key: "users", label: "Students", icon: Users },
  { key: "courses", label: "Courses", icon: GraduationCap },
];

const ease = [0.16, 1, 0.3, 1] as const;

interface Toast {
  id: number;
  title: string;
  kind: "apps" | "enrs";
}

let toastSeq = 0;

export function AdminPanel({
  adminEmail, counts, applications, enrollments, users,
}: {
  adminEmail: string;
  counts: AdminCounts;
  applications: AdminApplication[];
  enrollments: AdminEnrollment[];
  users: AdminUser[];
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [appList, setAppList] = useState(applications);
  const [enrList, setEnrList] = useState(enrollments);
  const [countsState, setCountsState] = useState<AdminCounts>(counts);
  const [syncing, setSyncing] = useState(false);
  const [freshApps, setFreshApps] = useState<Set<string>>(new Set());
  const [freshEnrs, setFreshEnrs] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const router = useRouter();

  const stat = useMemo(
    () => deriveAdminStats(appList, enrList, countsState),
    [appList, enrList, countsState]
  );

  const knownIds = useRef({ apps: new Set(applications.map((a) => a.id)), enrs: new Set(enrollments.map((e) => e.id)) });
  const pendingRef = useRef({
    apps: applications.filter((a) => a.status === "PENDING").length,
    enrs: enrollments.filter((e) => e.status === "PENDING").length,
  });

  const pushToast = useCallback((title: string, kind: Toast["kind"]) => {
    const id = ++toastSeq;
    setToasts((t) => [...t, { id, title, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5200);
  }, []);

  const flash = useCallback((kind: "apps" | "enrs", ids: string[]) => {
    if (ids.length === 0) return;
    const apply = kind === "apps" ? setFreshApps : setFreshEnrs;
    apply((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
    setTimeout(() => {
      apply((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    }, 6500);
  }, []);

  const refresh = useCallback(
    async (silent = false) => {
      if (!silent) setSyncing(true);
      try {
        const [sa, se] = await Promise.all([
          fetch("/api/admin/applications").then((r) => (r.ok ? r.json() : null)),
          fetch("/api/admin/enrollments").then((r) => (r.ok ? r.json() : null)),
        ]);

        const apps = (sa?.applications ?? null) as AdminApplication[] | null;
        const enrs = (se?.enrollments ?? null) as AdminEnrollment[] | null;

        if (sa?.counts) setCountsState((prev) => ({ ...prev, ...sa.counts }));
        if (se?.counts) setCountsState((prev) => ({ ...prev, ...se.counts }));

        if (apps) {
          const nextPending = apps.filter((a) => a.status === "PENDING").length;
          const delta = nextPending - pendingRef.current.apps;
          if (delta > 0) {
            const freshIds = apps
              .filter((a) => a.status === "PENDING" && !knownIds.current.apps.has(a.id))
              .map((a) => a.id);
            pushToast(`${delta} new application${delta > 1 ? "s" : ""} queued`, "apps");
            flash("apps", freshIds);
          }
          pendingRef.current.apps = nextPending;
          apps.forEach((a) => knownIds.current.apps.add(a.id));
          setAppList(apps);
        }

        if (enrs) {
          const nextPending = enrs.filter((e) => e.status === "PENDING").length;
          const delta = nextPending - pendingRef.current.enrs;
          if (delta > 0) {
            const freshIds = enrs
              .filter((e) => e.status === "PENDING" && !knownIds.current.enrs.has(e.id))
              .map((e) => e.id);
            pushToast(`${delta} new enrollment request`, "enrs");
            flash("enrs", freshIds);
          }
          pendingRef.current.enrs = nextPending;
          enrs.forEach((e) => knownIds.current.enrs.add(e.id));
          setEnrList(enrs);
        }
      } finally {
        if (!silent) setSyncing(false);
      }
    },
    [pushToast, flash]
  );

  const live = useLiveSync(() => refresh(true));

  const decideApp = useCallback(
    async (id: string, action: "APPROVE" | "REJECT", message: string) => {
      const res = await fetch("/api/admin/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, message }),
      });
      if (!res.ok) return;
      const next = action === "APPROVE" ? "APPROVED" : "REJECTED";
      setAppList((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: next, adminMessage: message || a.adminMessage } : a))
      );
      refresh(true);
    },
    [refresh]
  );

  const decideEnr = useCallback(
    async (
      id: string,
      action: "REQUEST_PAYMENT" | "CONFIRM" | "REJECT",
      message: string,
      paymentInstructions?: string
    ) => {
      const res = await fetch("/api/admin/enrollments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, message, paymentInstructions }),
      });
      if (!res.ok) return;
      const statusMap: Record<string, AdminEnrollment["status"]> = {
        REQUEST_PAYMENT: "AWAITING_PAYMENT",
        CONFIRM: "ENROLLED",
        REJECT: "REJECTED",
      };
      const next = statusMap[action];
      setEnrList((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                status: next,
                adminMessage: message || e.adminMessage,
                paymentInstructions: paymentInstructions || e.paymentInstructions,
              }
            : e
        )
      );
      refresh(true);
    },
    [refresh]
  );

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#faf8f4] text-ink">
      {/* backdrop scenery */}
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 opacity-60" style={{ maskImage: "radial-gradient(ellipse at 30% 0%, black 0%, transparent 70%)", WebkitMaskImage: "radial-gradient(ellipse at 30% 0%, black 0%, transparent 70%)" }} />
      <div aria-hidden className="orb left-[-6%] top-[6%] h-80 w-80 bg-brand/80/25" />
      <div aria-hidden className="orb right-[-8%] top-[30%] h-96 w-96 bg-brand-deep/20" style={{ animationDelay: "-6s" }} />
      <div aria-hidden className="orb bottom-[-10%] left-[24%] h-80 w-80 bg-brand-magenta/8" style={{ animationDelay: "-11s" }} />

      {/* toasts */}
      <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[min(92vw,340px)] flex-col gap-2">
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.35, ease }}
            className={cn(
              "glass-dash pointer-events-auto flex items-center gap-3 rounded-2xl px-4 py-3 shadow-[0_20px_48px_-18px_rgb(110_90_224/0.5)]",
              t.kind === "apps" ? "ring-1 ring-brand/45" : "ring-1 ring-brand-magenta/35"
            )}
          >
            <span className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
              t.kind === "apps" ? "bg-brand/80/15 text-brand-deep" : "bg-brand-magenta/15 text-brand-magenta"
            )}>
              {t.kind === "apps" ? <FileText className="h-4 w-4" /> : <GraduationCap className="h-4 w-4" />}
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-[0.82rem] font-extrabold text-ink">{t.title}</p>
              <p className="font-mono text-[0.6rem] uppercase tracking-widest text-ink-3">live stream</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[15.5rem] flex-col border-r border-white/60 bg-white/45 backdrop-blur-2xl lg:flex">
        <div className="flex items-center gap-3 border-b border-ink/8 px-6 py-5">
          <Logo mode="chip" size="xs" />
          <div className="leading-tight">
            <p className="font-display text-[0.85rem] font-extrabold tracking-[0.06em] text-ink">
              LH
              <span className="indigo-text-shimmer">·OPS</span>
            </p>
            <p className="font-mono text-[0.55rem] uppercase tracking-[0.3em] text-ink-3">control suite</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1.5 px-3 py-5">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            const badge =
              (t.key === "applications" && stat.pending > 0)
                ? stat.pending
                : (t.key === "enrollments" && stat.enrPending > 0)
                  ? stat.enrPending
                  : null;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  "group relative flex items-center gap-3 overflow-hidden rounded-xl px-4 py-3 text-start font-display text-[0.84rem] font-bold transition-all duration-300",
                  active
                    ? "bg-gradient-to-r from-brand-deep to-brand-deep text-white shadow-[0_14px_30px_-12px_rgb(110_90_224/0.8)]"
                    : "text-ink-2 hover:bg-white/70 hover:text-ink"
                )}
              >
                <Icon className={cn("h-4.5 w-4.5", active ? "text-white" : "text-ink-3")} strokeWidth={1.9} />
                {t.label}
                {badge ? (
                  <span
                    className={cn(
                      "ml-auto grid min-w-6 place-items-center rounded-full px-1.5 py-0.5 font-mono text-[0.6rem] font-black",
                      active ? "bg-white/25 text-white" : "bg-brand-deep text-white"
                    )}
                  >
                    {badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-ink/8 px-6 py-5">
          <p className="truncate font-mono text-[0.7rem] font-bold text-ink">{adminEmail}</p>
          <div className="mt-2 flex items-center gap-2 font-mono text-[0.55rem] uppercase tracking-[0.24em] text-emerald-600">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Root session active
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="relative z-10 flex min-h-screen flex-1 flex-col lg:pl-[15.5rem]">
        {/* TOPBAR */}
        <header className="sticky top-0 z-20 border-b border-white/60 bg-[#faf8f4]/70 backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-4 px-5 py-3.5 lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <Logo mode="chip" size="xs" />
            </div>
            <div className="hidden items-center gap-2 font-mono text-[0.6rem] font-bold uppercase tracking-[0.3em] text-ink-2 lg:flex">
              <Radar className="h-4 w-4 text-brand/80" />
              <span>Language Hub · Operations</span>
            </div>
            <LiveBadge live={live} syncTicker={syncing} />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => refresh(false)}
                disabled={syncing}
                className="inline-flex items-center gap-2 rounded-full border border-ink/12 bg-white/70 px-4 py-2 font-display text-[0.72rem] font-bold text-ink-2 transition-all hover:border-brand/45 hover:text-brand-deep disabled:opacity-50 backdrop-blur-md"
              >
                <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
                <span className="hidden sm:inline">Sync</span>
              </button>
              <Link
                href="/"
                className="hidden items-center gap-1.5 rounded-full border border-ink/12 bg-white/70 px-4 py-2 font-display text-[0.72rem] font-bold text-ink-2 transition-all hover:border-brand/45 hover:text-brand-deep sm:inline-flex"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Site
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await fetch("/api/admin/logout", { method: "POST" });
                  router.push("/");
                  router.refresh();
                }}
                className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50/70 px-4 py-2 font-display text-[0.72rem] font-bold text-rose-600 transition-all hover:bg-rose-100"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex flex-col gap-7 px-5 pb-28 pt-7 lg:px-8 lg:pb-10 lg:pt-9">
          {tab === "overview" ? (
            <Overview stats={stat} applications={appList} enrollments={enrList} onNavigate={setTab} />
          ) : null}

          {tab === "applications" ? (
            <AdminApplications items={appList} onDecide={decideApp} freshIds={freshApps} />
          ) : null}

          {tab === "enrollments" ? (
            <AdminEnrollments items={enrList} onDecide={decideEnr} freshIds={freshEnrs} />
          ) : null}

          {tab === "payments" ? (
            <AdminPayments />
          ) : null}

          {tab === "blog" ? (
            <AdminBlog />
          ) : null}

          {tab === "audit" ? (
            <AdminAuditLog />
          ) : null}

          {tab === "demos" ? (
            <AdminDemoBookings />
          ) : null}

          {tab === "testimonials" ? (
            <AdminTestimonials />
          ) : null}

          {tab === "courses" ? (
            <AdminCourses />
          ) : null}

          {tab === "users" ? (
            <AdminUsers items={users} />
          ) : null}
        </main>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <nav className="fixed inset-x-3 bottom-3 z-40 flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-white/70 bg-white/80 px-2 py-2 shadow-[0_18px_44px_-18px_rgb(15_23_42/0.4)] backdrop-blur-2xl no-scrollbar lg:hidden">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          const badge =
            (t.key === "applications" && stat.pending > 0)
              ? stat.pending
              : (t.key === "enrollments" && stat.enrPending > 0)
                ? stat.enrPending
                : null;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 font-display text-[0.6rem] font-bold uppercase tracking-wider transition-all",
                active ? "bg-gradient-to-r from-brand-deep to-brand-deep text-white" : "text-ink-2"
              )}
            >
              <Icon className="h-4.5 w-4.5" strokeWidth={1.9} />
              <span className="whitespace-nowrap">{t.label}</span>
              {badge ? (
                <span className={cn(
                  "absolute right-1.5 top-0.5 grid min-w-4 place-items-center rounded-full px-1 font-mono text-[0.5rem] font-black",
                  active ? "bg-white/25 text-white" : "bg-brand-deep text-white"
                )}>
                  {badge}
                </span>
              ) : null}
            </button>
          );
        })}
        <button
          type="button"
          aria-label="Sign out"
          onClick={async () => {
            await fetch("/api/admin/logout", { method: "POST" });
            router.push("/");
            router.refresh();
          }}
          className="grid h-10 w-12 place-items-center rounded-xl text-rose-500 transition-colors hover:bg-rose-50"
        >
          <LogOut className="h-4.5 w-4.5" />
        </button>
      </nav>
    </div>
  );
}

function LiveBadge({ live, syncTicker }: { live: boolean; syncTicker: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[0.6rem] font-black uppercase tracking-[0.2em]",
        live && !syncTicker
          ? "border-emerald-300 bg-emerald-50/80 text-emerald-600"
          : "border-ink/12 bg-white/70 text-ink-2"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", live && !syncTicker ? "bg-emerald-500 animate-pulse" : live ? "bg-slate-300" : "bg-amber-400 animate-pulse")} />
      {live ? (syncTicker ? "Syncing" : "Live") : "Connecting…"}
    </span>
  );
}

function Overview({
  stats,
  applications,
  enrollments,
  onNavigate,
}: {
  stats: AdminStats;
  applications: AdminApplication[];
  enrollments: AdminEnrollment[];
  onNavigate: (t: Tab) => void;
}) {
  const week = useMemo(() => {
    const days = new Array(7).fill(0).map((_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (6 - i));
      return { label: d.toLocaleDateString("en-GB", { weekday: "short" }), count: 0 };
    });
    const todayStart = new Date().setHours(0, 0, 0, 0);
    for (const a of applications) {
      const idx = Math.floor((new Date(a.createdAt).getTime() - (todayStart - 6 * 86400000)) / 86400000);
      if (idx >= 0 && idx < 7) days[idx].count += 1;
    }
    return days;
  }, [applications]);

  const maxDay = Math.max(1, ...week.map((d) => d.count));
  const recent = [...applications].slice(0, 6);
  const liveEnrCount = enrollments.filter((e) => e.status === "PENDING").length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-3 font-display text-[0.62rem] font-bold uppercase tracking-[0.4em] text-brand-deep">
            <span aria-hidden className="h-px w-7 bg-gradient-to-r from-brand/80 to-transparent" />
            Operations overview
          </p>
          <h1 className="mt-1.5 font-display text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold tracking-[-0.03em] text-ink">
            COMMAND <span className="indigo-text-shimmer">CENTER.</span>
          </h1>
        </div>
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-ink-3">
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* HUD STATS */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        <AdminStatCard label="Applications" value={stats.total} accent="indigo" sub="lifetime" icon={<FileText className="h-5 w-5" />} onClick={() => onNavigate("applications")} />
        <AdminStatCard label="Pending" value={stats.pending} accent="amber" sub="needs review" icon={<Clock className="h-5 w-5" />} onClick={() => onNavigate("applications")} />
        <AdminStatCard label="Approved" value={stats.approved} accent="emerald" sub="moved to enroll" icon={<BadgeCheck className="h-5 w-5" />} onClick={() => onNavigate("applications")} />
        <AdminStatCard label="Students" value={stats.users} accent="emerald" sub="accounts" icon={<UserRoundPlus className="h-5 w-5" />} />
        <AdminStatCard label="Courses" value={stats.courses} accent="violet" sub="live catalog" icon={<BookOpen className="h-5 w-5" />} onClick={() => onNavigate("courses")} />
        <AdminStatCard label="Enrolling" value={stats.enrPending} accent="fuchsia" sub="waiting" icon={<GraduationCap className="h-5 w-5" />} onClick={() => onNavigate("enrollments")} />
        <AdminStatCard label="Enrolled" value={stats.enrEnrolled} accent="violet" sub="students onboard" icon={<Users className="h-5 w-5" />} onClick={() => onNavigate("enrollments")} />
        <AdminStatCard label="Payments" value={stats.paymentsTotal} accent="fuchsia" sub="transactions" icon={<CreditCard className="h-5 w-5" />} onClick={() => onNavigate("payments")} />
        <AdminStatCard label="Rejected" value={stats.rejected + stats.enrRejected} accent="rose" sub="total" icon={<XCircle className="h-5 w-5" />} onClick={() => onNavigate("applications")} />
      </section>

      {/* Analytics: revenue, students, retention */}
      <AdminAnalyticsCharts />

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Approval + funnel */}
        <GlassPanel>
          <p className="font-display text-[0.62rem] font-bold uppercase tracking-[0.34em] text-brand-deep">Approval rate</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-6 sm:justify-start">
            <ProgressRing value={stats.approvalRate} />
            <div className="flex-1 space-y-3.5">
              <Funnel label="Applied" value={stats.total} total={stats.total || 1} />
              <Funnel label="Approved" value={stats.approved} total={stats.total || 1} />
              <Funnel label="Enrolled" value={stats.enrEnrolled} total={stats.total || 1} />
            </div>
          </div>
        </GlassPanel>

        {/* Inflow chart */}
        <GlassPanel>
          <div className="flex items-end justify-between">
            <p className="font-display text-[0.62rem] font-bold uppercase tracking-[0.34em] text-brand-deep">
              Inflow · 7 days
            </p>
            <div className="flex flex-wrap justify-end gap-3 font-mono text-[0.62rem] text-ink-3">
              {week.map((d) => (
                <span key={d.label} className="text-[0.6rem] uppercase tracking-wider">
                  {d.label} <b className="text-brand-deep">{d.count}</b>
                </span>
              ))}
            </div>
          </div>
          <div className="mt-6 flex h-28 items-end gap-2.5">
            {week.map((d, i) => (
              <motion.div
                key={i}
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, ease, delay: i * 0.06 }}
                className="flex flex-1 flex-col items-center gap-2"
                style={{ transformOrigin: "bottom" }}
              >
                <motion.div
                  className="w-full rounded-t-xl bg-gradient-to-t from-brand/80 via-brand-deep to-brand-magenta"
                  initial={{ height: 6 }}
                  animate={{ height: `${Math.max(10, (d.count / maxDay) * 100)}%` }}
                  transition={{ duration: 0.7, ease, delay: 0.15 + i * 0.06 }}
                />
              </motion.div>
            ))}
          </div>
          <p className="mt-3 font-mono text-[0.58rem] uppercase tracking-widest text-ink-3">
            {stats.thisWeek} application{stats.thisWeek === 1 ? "" : "s"} this week · {liveEnrCount > 0 ? `${liveEnrCount} enrollment${liveEnrCount === 1 ? "" : "s"} waiting` : "no enrollments waiting"}
          </p>
        </GlassPanel>
      </div>

      {/* Latest signals */}
      <GlassPanel className="p-0!">
        <div className="flex items-center justify-between px-6 pt-6 sm:px-7">
          <p className="font-display text-[0.62rem] font-bold uppercase tracking-[0.34em] text-brand-deep">Latest signals</p>
          <p className="inline-flex items-center gap-1.5 font-mono text-[0.58rem] uppercase tracking-widest text-emerald-600">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> live feed
          </p>
        </div>
        <div className="mt-4 flex flex-col gap-1 p-3">
          {recent.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-ink/12 py-12 text-center">
              <p className="font-mono text-[0.8rem] text-ink-3">No applications yet — the feed will light up in real time.</p>
            </div>
          ) : (
            recent.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -14 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, ease, delay: Math.min(0.3, i * 0.06) }}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/60"
              >
                <span className="font-mono text-[0.6rem] font-black text-brand">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-[0.84rem] font-extrabold text-ink">{a.name}</p>
                  <p className="truncate font-mono text-[0.62rem] text-ink-3">{a.course}</p>
                </div>
                <StatusPill status={a.status} />
              </motion.div>
            ))
          )}
        </div>
      </GlassPanel>
    </>
  );
}

function Funnel({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = Math.round((value / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between font-mono text-[0.62rem] uppercase tracking-widest text-ink-3">
        <span>{label}</span>
        <span className="text-brand-deep">
          {value} <span className="text-ink-3">/ {pct}%</span>
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink/8">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand/80 via-brand-deep to-brand-magenta transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}