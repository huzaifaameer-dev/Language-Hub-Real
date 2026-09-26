"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Bot,
  CalendarClock,
  Clock,
  ExternalLink,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Library,
  LogOut,
  MessageCircle,
  MessageSquareText,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UserRoundPlus,
  Users,
  X,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { useLiveSync } from "@/lib/use-live";
import type { AdminCounts, AdminRegistration, AdminStats, AdminUser } from "./types";
import { deriveAdminStats } from "./stats";
import { AdminRegistrations } from "./AdminRegistrations";
import { AdminCourses } from "./AdminCourses";
import { AdminUsers } from "./AdminUsers";
import { AdminTeachers } from "./AdminTeachers";
import { AdminDemoBookings } from "./AdminDemoBookings";
import { AdminTestimonials } from "./AdminTestimonials";
import { AdminTeam } from "./AdminTeam";
import { AdminAuditLog } from "./AdminAuditLog";
import { AdminStatCard, GlassPanel, ProgressRing, StatusPill } from "./ui";

// Heavy sections are lazy-loaded so the admin shell paints and responds fast —
// the JS and data fetches for a tab only load once you actually open it.
import dynamic from "next/dynamic";
const AdminNews = dynamic(() => import("./AdminNews").then((m) => m.AdminNews), { ssr: false });
const AdminNewsComments = dynamic(() => import("./AdminNewsComments").then((m) => m.AdminNewsComments), { ssr: false });
const AdminAi = dynamic(() => import("./AdminAi").then((m) => m.AdminAi), { ssr: false });
const AdminAgent = dynamic(() => import("./AdminAgent").then((m) => m.AdminAgent), { ssr: false });
const AdminAnalyticsCharts = dynamic(() => import("./AdminAnalyticsCharts").then((m) => m.AdminAnalyticsCharts), { ssr: false });
const AdminFeedback = dynamic(() => import("./AdminFeedback").then((m) => m.AdminFeedback), { ssr: false });

type Tab =
  | "agent"
  | "overview"
  | "registrations"
  | "feedback"
  | "news"
  | "newsmod"
  | "audit"
  | "courses"
  | "users"
  | "teachers"
  | "demos"
  | "testimonials"
  | "team"
  | "ai";

const TABS: { key: Tab; label: string; icon: LucideIcon }[] = [
  { key: "agent", label: "AI Agent", icon: Bot },
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "registrations", label: "Registrations", icon: FileText },
  { key: "feedback", label: "Feedback", icon: MessageSquareText },
  { key: "news", label: "Daily News", icon: BookOpen },
  { key: "newsmod", label: "Comments", icon: MessageCircle },
  { key: "audit", label: "Activity Log", icon: ShieldCheck },
  { key: "demos", label: "Demo Bookings", icon: CalendarClock },
  { key: "testimonials", label: "Testimonials", icon: Star },
  { key: "team", label: "Team", icon: Users },
  { key: "users", label: "Students", icon: UserRoundPlus },
  { key: "teachers", label: "Teachers", icon: GraduationCap },
  { key: "courses", label: "Courses", icon: Library },
  { key: "ai", label: "AI Reports", icon: Sparkles },
];

const ease = [0.16, 1, 0.3, 1] as const;

export function AdminPanel({
  adminEmail,
  counts,
  registrations,
  users,
}: {
  adminEmail: string;
  counts: AdminCounts;
  registrations: AdminRegistration[];
  users: AdminUser[];
}) {
  const [tab, setTab] = useState<Tab>("registrations");
  const [countsState, setCountsState] = useState<AdminCounts>(counts);
  const [registrationList, setRegistrationList] = useState(registrations);
  const [feedbackNew, setFeedbackNew] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [palette, setPalette] = useState(false);
  const router = useRouter();

  // Throttle auto-refreshes: live events can burst, and every refresh is a DB
  // round-trip — never run two inside a 2.5s window, and never run a second
  // while one is already in flight.
  const lastRefresh = useRef(0);
  const inflight = useRef(false);

  // Keep the funnel metrics live without owning the queue list (the
  // Registrations tab owns its own full state via the admin API).
  const refresh = useCallback(async (opts?: { force?: boolean }) => {
    const now = Date.now();
    if (!opts?.force && (inflight.current || now - lastRefresh.current < 2500)) return;
    inflight.current = true;
    lastRefresh.current = now;
    setSyncing(true);
    try {
      const [r, fr] = await Promise.all([
        fetch("/api/admin/registrations", { cache: "no-store" }),
        fetch("/api/admin/feedback?counts=1", { cache: "no-store" }),
      ]);
      if (r.ok) {
        const d = (await r.json()) as {
          registrations?: AdminRegistration[];
          counts?: Partial<AdminCounts>;
        };
        if (d.counts) setCountsState((prev) => ({ ...prev, ...d.counts }));
        if (d.registrations?.length) setRegistrationList(d.registrations);
      }
      if (fr.ok) {
        const fd = (await fr.json()) as { counts?: { fbNew?: number } };
        if (typeof fd.counts?.fbNew === "number") setFeedbackNew(fd.counts.fbNew);
      }
    } catch {
      // network blip — keep whatever is on screen
    } finally {
      inflight.current = false;
      setSyncing(false);
    }
  }, []);

  const live = useLiveSync(() => void refresh());

  // First paint is SSR-free; populate counts + funnel from the API on mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh({ force: true });
  }, [refresh]);

  const stat = useMemo(
    () => deriveAdminStats(registrationList, countsState),
    [registrationList, countsState]
  );

  const knownIds = useRef(new Set(registrationList.map((r) => r.id)));
  useEffect(() => {
    for (const r of registrationList) knownIds.current.add(r.id);
  }, [registrationList]);

  const badgeFor = (key: Tab): number | null =>
    key === "registrations"
      ? stat.newCount > 0
        ? stat.newCount
        : null
      : key === "feedback"
        ? feedbackNew > 0
          ? feedbackNew
          : null
        : null;

  const goTab = (t: Tab) => {
    setTab(t);
    setPalette(false);
  };

  return (
    <div id="lh-admin" className="relative min-h-screen overflow-x-clip bg-[#f3f4fb] text-slate-900">
      {/* ambient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 460px at 12% -8%, rgb(99 102 241 / 0.14), transparent 60%), radial-gradient(1000px 520px at 105% 24%, rgb(217 70 239 / 0.08), transparent 55%), radial-gradient(700px 500px at 44% 110%, rgb(14 165 233 / 0.08), transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: "radial-gradient(rgb(79 70 229 / 0.07) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage: "radial-gradient(ellipse at 20% 0%, black 5%, transparent 65%)",
          WebkitMaskImage: "radial-gradient(ellipse at 20% 0%, black 5%, transparent 65%)",
        }}
      />

      {/* ======================= HEADER ======================= */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[90rem] items-center justify-between gap-3 px-4 py-3 pl-[4.5rem] sm:px-6 sm:pl-[4.5rem] lg:pl-[5.75rem] lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 transition-shadow hover:ring-indigo-300"
              aria-label="Language Hub home"
            >
              <Logo size="xs" eager />
            </Link>
            <div className="hidden leading-tight sm:block">
              <p className="font-display text-[0.82rem] font-extrabold tracking-[0.04em] text-slate-900">
                LH<span className="indigo-text-shimmer">·OPS</span>
              </p>
              <p className="font-mono text-[0.55rem] uppercase tracking-[0.3em] text-slate-500">
                admin control suite
              </p>
            </div>
          </div>

          {/* Command search */}
          <button
            type="button"
            onClick={() => setPalette(true)}
            className="group hidden h-10 flex-1 max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 text-start text-[0.82rem] text-slate-400 transition-all duration-300 hover:border-indigo-300 hover:bg-white md:flex"
          >
            <Search className="h-4 w-4 text-slate-400 transition-colors group-hover:text-indigo-500" strokeWidth={2} />
            <span className="flex-1 truncate">Search sections…</span>
            <kbd className="hidden shrink-0 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[0.6rem] font-bold text-slate-400 sm:inline-flex">
              Ctrl K
            </kbd>
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <LiveBadge live={live} syncTicker={syncing} />
            <button
              type="button"
              onClick={() => void refresh({ force: true })}
              disabled={syncing}
              aria-label="Sync data"
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-50"
            >
              <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
            </button>
            <Link
              href="/"
              aria-label="Open site"
              className="hidden h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-600 sm:grid"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
            <div className="hidden items-center gap-2.5 rounded-xl border border-slate-200 bg-white py-1 pl-1 pr-3 shadow-sm lg:flex">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-deep to-brand-magenta font-display text-[0.8rem] font-black text-white">
                {(adminEmail || "A").charAt(0).toUpperCase()}
              </span>
              <div className="leading-tight">
                <p className="max-w-[9rem] truncate font-display text-[0.72rem] font-bold text-slate-800">
                  {adminEmail}
                </p>
                <p className="flex items-center gap-1 font-mono text-[0.55rem] font-bold uppercase tracking-widest text-emerald-600">
                  <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-500" /> Root session
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                await fetch("/api/admin/logout", { method: "POST" });
                router.push("/");
                router.refresh();
              }}
              aria-label="Sign out"
              className="grid h-10 w-10 place-items-center rounded-xl border border-rose-200 bg-rose-50/60 text-rose-600 transition-all duration-300 hover:-translate-y-0.5 hover:bg-rose-100"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ======================= DESKTOP DOCK ======================= */}
      <aside className="fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 lg:block">
        <nav
          aria-label="Sections"
          className="group/dock flex flex-col gap-1.5 rounded-3xl border border-slate-200/80 bg-white/85 p-2 shadow-[0_30px_70px_-30px_rgb(79_70_229/0.45)] backdrop-blur-xl transition-all duration-500 w-[3.4rem] hover:w-60"
        >
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            const badge = badgeFor(t.key);
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => goTab(t.key)}
                aria-label={t.label}
                className={cn(
                  "relative flex h-11 items-center gap-3 overflow-hidden rounded-2xl px-2.5 text-start transition-all duration-300",
                  active
                    ? "bg-gradient-to-r from-brand-deep to-brand-deep text-white shadow-[0_12px_24px_-10px_rgb(79_70_229/0.8)]"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className={cn("h-[1.15rem] w-[1.15rem] shrink-0", active ? "text-white" : "text-slate-500")} strokeWidth={1.9} />
                <span className="whitespace-nowrap font-display text-[0.78rem] font-bold opacity-0 transition-opacity duration-300 group-hover/dock:opacity-100">
                  {t.label}
                </span>
                {badge ? (
                  <span
                    className={cn(
                      "ml-auto grid min-w-5 place-items-center rounded-full px-1.5 py-0.5 font-mono text-[0.58rem] font-black",
                      active ? "bg-white/25 text-white" : "bg-brand-deep text-white",
                      "opacity-0 transition-opacity duration-300 group-hover/dock:opacity-100"
                    )}
                  >
                    {badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ======================= MAIN ======================= */}
      <main className="relative z-10 lg:pl-[5.25rem]">
        <div className="mx-auto max-w-[90rem] px-4 pb-32 pt-7 sm:px-6 lg:px-8 lg:pb-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease }}
            >
              {tab === "overview" ? <Overview stats={stat} registrations={registrationList} onNavigate={goTab} /> : null}
              {tab === "registrations" ? <AdminRegistrations initial={registrationList} /> : null}
              {tab === "feedback" ? <AdminFeedback /> : null}
              {tab === "news" ? <AdminNews /> : null}
              {tab === "newsmod" ? <AdminNewsComments /> : null}
              {tab === "audit" ? <AdminAuditLog /> : null}
              {tab === "demos" ? <AdminDemoBookings /> : null}
              {tab === "testimonials" ? <AdminTestimonials /> : null}
              {tab === "team" ? <AdminTeam /> : null}
              {tab === "courses" ? <AdminCourses /> : null}
              {tab === "users" ? <AdminUsers items={users} /> : null}
              {tab === "teachers" ? <AdminTeachers /> : null}
              {tab === "ai" ? <AdminAi /> : null}
              {tab === "agent" ? <AdminAgent /> : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ======================= MOBILE DOCK ======================= */}
      <nav
        aria-label="Sections"
        className="fixed inset-x-3 bottom-3 z-40 flex items-center gap-1 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/90 px-2 py-2 shadow-[0_18px_44px_-18px_rgb(15_23_42/0.35)] backdrop-blur-2xl no-scrollbar lg:hidden"
      >
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          const badge = badgeFor(t.key);
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => goTab(t.key)}
              className={cn(
                "relative flex min-w-[3.4rem] flex-1 flex-col items-center gap-0.5 rounded-xl py-2 font-display text-[0.56rem] font-bold uppercase tracking-wide transition-all",
                active ? "bg-gradient-to-r from-brand-deep to-brand-deep text-white" : "text-slate-400 hover:text-slate-700"
              )}
            >
              <Icon className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.9} />
              <span className="whitespace-nowrap">{t.label.split(" ")[0]}</span>
              {badge ? (
                <span className={cn(
                  "absolute right-1 top-0.5 grid min-w-4 place-items-center rounded-full px-1 font-mono text-[0.5rem] font-black",
                  active ? "bg-white/25 text-white" : "bg-brand-deep text-white"
                )}>
                  {badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* command palette */}
      <CmdPalette
        open={palette}
        busy={syncing}
        onClose={() => setPalette(false)}
        onSelect={goTab}
        current={tab}
      />
    </div>
  );
}

/** Floating command palette — Ctrl/Cmd+K to open, type to filter, Enter to jump. */
function CmdPalette({
  open,
  busy,
  onClose,
  onSelect,
  current,
}: {
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onSelect: (t: Tab) => void;
  current: Tab;
}) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Render-time reset so the query clears each time the palette opens.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setQ("");
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const matches = TABS.filter((t) => t.label.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-start justify-center bg-slate-900/40 px-4 pt-[16vh] backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_40px_90px_-30px_rgb(15_23_42/0.5)]"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5">
              <Search className="h-5 w-5 text-brand-deep" strokeWidth={2} />
              <input
                ref={inputRef}
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Jump to a section…"
                className="flex-1 bg-transparent text-[0.95rem] text-slate-900 outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[46vh] overflow-y-auto p-2">
              {matches.length === 0 ? (
                <p className="px-4 py-8 text-center font-mono text-[0.78rem] text-slate-400">
                  No sections match “{q}”.
                </p>
              ) : (
                matches.map((t) => {
                  const Icon = t.icon;
                  const active = current === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => onSelect(t.key)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition-colors",
                        active ? "bg-brand/[0.06]" : "hover:bg-slate-50"
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-9 w-9 place-items-center rounded-lg",
                          active ? "bg-brand-deep text-white" : "bg-slate-100 text-slate-500"
                        )}
                      >
                        <Icon className="h-4.5 w-4.5" strokeWidth={1.9} />
                      </span>
                      <span className="flex-1 font-display text-[0.85rem] font-bold text-slate-800">
                        {t.label}
                      </span>
                      {active ? (
                        <span className="rounded-full bg-brand/10 px-2.5 py-1 font-mono text-[0.58rem] font-black uppercase tracking-widest text-brand-deep">
                          current
                        </span>
                      ) : (
                        <span className="font-mono text-[0.62rem] text-slate-300">{TABS.indexOf(t) + 1}</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex items-center gap-4 border-t border-slate-100 px-4 py-2.5 font-mono text-[0.58rem] uppercase tracking-widest text-slate-400">
              <span className="flex items-center gap-1.5">
                <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-bold">↵</kbd> jump
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-bold">esc</kbd> close
              </span>
              <span className="ml-auto text-slate-300">{busy ? "syncing…" : "LH·OPS"}</span>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function LiveBadge({ live, syncTicker }: { live: boolean; syncTicker: boolean }) {
  return (
    <span
      className={cn(
        "hidden items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[0.6rem] font-black uppercase tracking-[0.2em] md:inline-flex",
        live && !syncTicker
          ? "border-emerald-300 bg-emerald-50/80 text-emerald-600"
          : "border-slate-200 bg-white/70 text-slate-500"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", live && !syncTicker ? "bg-emerald-500 animate-pulse" : live ? "bg-slate-300" : "bg-amber-400 animate-pulse")} />
      {live ? (syncTicker ? "Syncing" : "Live") : "Connecting…"}
    </span>
  );
}

function Overview({
  stats,
  registrations,
  onNavigate,
}: {
  stats: AdminStats;
  registrations: AdminRegistration[];
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
    for (const r of registrations) {
      const idx = Math.floor((new Date(r.createdAt).getTime() - (todayStart - 6 * 86400000)) / 86400000);
      if (idx >= 0 && idx < 7) days[idx].count += 1;
    }
    return days;
  }, [registrations]);

  const maxDay = Math.max(1, ...week.map((d) => d.count));
  const recent = [...registrations].slice(0, 6);

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
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-ink-3" suppressHydrationWarning>
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* HUD STATS */}
      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <AdminStatCard label="Registrations" value={stats.total} accent="indigo" sub="lifetime" icon={<FileText className="h-5 w-5" />} onClick={() => onNavigate("registrations")} />
        <AdminStatCard label="New" value={stats.newCount} accent="amber" sub="needs review" icon={<Clock className="h-5 w-5" />} onClick={() => onNavigate("registrations")} />
        <AdminStatCard label="Contacted" value={stats.contacted} accent="violet" sub="in touch" icon={<MessageCircle className="h-5 w-5" />} onClick={() => onNavigate("registrations")} />
        <AdminStatCard label="Enrolled" value={stats.enrolled} accent="emerald" sub="confirmed seats" icon={<CheckCircle2 className="h-5 w-5" />} onClick={() => onNavigate("registrations")} />
        <AdminStatCard label="Students" value={stats.users} accent="sky" sub="accounts" icon={<UserRoundPlus className="h-5 w-5" />} onClick={() => onNavigate("users")} />
        <AdminStatCard label="Courses" value={stats.courses} accent="emerald" sub="live catalog" icon={<Library className="h-5 w-5" />} onClick={() => onNavigate("courses")} />
      </section>

      {/* Analytics: revenue, students, retention */}
      <AdminAnalyticsCharts />

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Enrolment funnel */}
        <GlassPanel>
          <p className="font-display text-[0.62rem] font-bold uppercase tracking-[0.34em] text-brand-deep">Response rate</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-6 sm:justify-start">
            <ProgressRing value={stats.responseRate} />
            <div className="flex-1 space-y-3.5">
              <Funnel label="Registered" value={stats.total} total={stats.total || 1} />
              <Funnel label="Enrolled" value={stats.enrolled} total={stats.total || 1} />
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
                <span key={d.label} className="text-[0.6rem] uppercase tracking-wider" suppressHydrationWarning>
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
            {stats.thisWeek} registration{stats.thisWeek === 1 ? "" : "s"} this week
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
              <p className="font-mono text-[0.8rem] text-ink-3">No registrations yet — the feed will light up in real time.</p>
            </div>
          ) : (
            recent.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -14 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, ease, delay: Math.min(0.3, i * 0.06) }}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/60"
              >
                <span className="font-mono text-[0.6rem] font-black text-brand">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-[0.84rem] font-extrabold text-ink">{r.name}</p>
                  <p className="truncate font-mono text-[0.62rem] text-ink-3">{r.course} · {r.ref}</p>
                </div>
                <StatusPill status={r.status} />
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