"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BarChart3,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  CreditCard,
  Download,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  PlayCircle,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Trophy,
  Upload,
  Users,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { RegistrationWizard } from "@/components/dashboard/RegistrationWizard";
import { NotificationsBell } from "@/components/dashboard/NotificationsBell";
import { REGISTRATION_COURSES_BY_KEY } from "@/lib/registration-config";
import { resizeImage } from "@/components/dashboard/ui";

/* ─────────────────────────────── types ─────────────────────────────────── */

export interface DashUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  image: string | null;
  referralCode: string | null;
  createdAt: string;
}

export interface DashEnrollment {
  id: string;
  course: string;
  courseSlug: string;
  batch: string;
  instructor: string;
  status: string;
  enrolledAt: string;
  percent: number;
}

export interface DashProgress {
  enrollmentId: string;
  course: string;
  courseSlug: string;
  batch: string;
  chapters: Array<{ id: string; title: string; completed: boolean }>;
  attendance: Array<{ date: string; attended: boolean; topic: string }>;
  percent: number;
}

export interface DashClass {
  id: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingLink: string;
  platform: string;
  instructor: string;
  course: string;
  batch: string;
}

export interface DashCertificate {
  id: string;
  certificateId: string;
  course: string;
  batch: string;
  issuedAt: string;
  completionPercent: number;
}

export interface DashRegistration {
  id: string;
  ref: string;
  courseSlug: string;
  status: string;
  createdAt: string;
}

export interface DashNotification {
  id: string;
  title: string;
  body: string;
  kind: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

interface Props {
  user: DashUser;
  stats: {
    courses: number;
    chaptersDone: number;
    chaptersTotal: number;
    percent: number;
    certificates: number;
    unread: number;
  };
  enrollments: DashEnrollment[];
  progress: DashProgress[];
  upcomingClasses: DashClass[];
  certificates: DashCertificate[];
  registrations: DashRegistration[];
  notifications: DashNotification[];
}

type TabKey =
  | "overview"
  | "learning"
  | "certificates"
  | "admissions"
  | "settings"
  | "support";

const TABS: Array<{ key: TabKey; label: string; icon: typeof LayoutDashboard }> = [
  { key: "overview", label: "Dashboard", icon: LayoutDashboard },
  { key: "learning", label: "My Courses", icon: BookOpen },
  { key: "certificates", label: "My Certificates", icon: Award },
  { key: "admissions", label: "Admissions", icon: GraduationCap },
  { key: "settings", label: "Settings", icon: Settings },
  { key: "support", label: "Help & Support", icon: Headphones },
];

/* ───────────────────────────── helpers ─────────────────────────────────── */

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

function initials(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "LH"
  );
}

const STATUS_TONE: Record<string, string> = {
  NEW: "bg-amber/15 text-[#8a5a00]",
  CONTACTED: "bg-brand/12 text-brand-deep",
  ENROLLED: "bg-emerald-500/12 text-emerald-700",
  REJECTED: "bg-coral/12 text-coral-deep",
  ACTIVE: "bg-emerald-500/12 text-emerald-700",
  COMPLETED: "bg-brand/12 text-brand-deep",
  PAUSED: "bg-amber/15 text-[#8a5a00]",
};

function Badge({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[0.6rem] font-bold uppercase tracking-[0.14em]",
        tone ?? "bg-ink/[0.06] text-ink-2"
      )}
    >
      {children}
    </span>
  );
}

function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(16,43,37,0.04)]",
        className
      )}
    >
      {children}
    </section>
  );
}

function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-ink/[0.07]", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand-deep to-brand-fern transition-[width] duration-700"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/* ─────────────────────────────── shell ─────────────────────────────────── */

export function DashboardWorkspace(props: Props) {
  const { user } = props;
  const [tab, setTab] = useState<TabKey>("overview");
  const [navOpen, setNavOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (next: TabKey) => {
    setTab(next);
    setNavOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#f4fbf8] text-[#10231f]">
      {/* ambient mint field */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <span className="absolute -right-40 -top-40 h-[38rem] w-[38rem] rounded-full bg-[#e2f5ea]" />
        <span className="absolute -right-24 top-1/3 h-[22rem] w-[22rem] rounded-full bg-[#eaf8f1]" />
        <span className="absolute -bottom-48 left-1/3 h-[30rem] w-[30rem] rounded-full bg-[#e7f7ef]" />
      </div>

      {/* ── sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-[#e8f2ed] bg-white transition-transform duration-300 lg:translate-x-0",
          navOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 pt-7 lg:justify-center">
          <Link href="/" className="flex flex-col items-center gap-2.5">
            <Logo size="md" mode="chip" eager />
            <span className="font-display text-[1.02rem] font-bold tracking-[-0.02em] text-[#10231f]">
              Language Hub
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setNavOpen(false)}
            className="rounded-lg p-1.5 text-[#7d948e] hover:bg-[#f1f8f4] lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="mt-8 flex-1 space-y-1.5 px-4" aria-label="Dashboard">
          {TABS.map((item) => {
            const Icon = item.icon;
            const isActive = item.key === tab;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => go(item.key)}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-full px-4 py-3 text-left font-sans text-[0.87rem] font-semibold transition-all duration-200",
                  isActive
                    ? "bg-[#0d5c4d] text-white shadow-[0_12px_22px_-16px_rgba(13,92,77,0.9)]"
                    : "text-[#44615a] hover:bg-[#f1f8f4] hover:text-[#0d6a58]"
                )}
              >
                <Icon
                  className={cn(
                    "h-[1.15rem] w-[1.15rem] shrink-0",
                    isActive ? "text-white" : "text-[#5d7a72] group-hover:text-[#0d6a58]"
                  )}
                  strokeWidth={1.9}
                />
                {item.label}
                {item.key === "admissions" && props.registrations.length > 0 && (
                  <span
                    className={cn(
                      "ml-auto rounded-full px-2 py-0.5 font-sans text-[0.65rem] font-bold",
                      isActive ? "bg-white/20 text-white" : "bg-[#e7f5ee] text-[#0d6a58]"
                    )}
                  >
                    {props.registrations.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* premium card */}
        <div className="mx-4 mb-6 rounded-2xl bg-[#eaf8f1] px-4 pb-5 pt-6 text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-white/70 text-[#0d6a58]">
            <GraduationCap className="h-5 w-5" strokeWidth={1.9} />
          </span>
          <p className="mt-3 font-display text-[0.95rem] font-bold leading-snug text-[#10231f]">
            Upgrade to
            <br />
            Premium Plan
          </p>
          <p className="mt-1.5 font-sans text-[0.68rem] leading-relaxed text-[#63796f]">
            Unlock more features and get the best learning experience.
          </p>
          <Link
            href="/courses"
            className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-[#0d5c4d] px-4 font-display text-[0.72rem] font-bold text-white transition hover:bg-[#0a4e43]"
          >
            Go Premium <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="px-4 pb-6 text-center">
          <p className="font-sans text-[0.72rem] font-semibold text-[#44615a]">Language Hub</p>
          <p className="mt-0.5 font-sans text-[0.64rem] text-[#9aada7]">
            © {new Date().getFullYear()}. All rights reserved.
          </p>
        </div>
      </aside>

      {navOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-40 bg-[#062e28]/30 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* ── main ────────────────────────────────────────────────────────── */}
      <div className="relative z-10 lg:pl-[264px]">
        <header className="flex items-center justify-end gap-4 px-5 pt-6 sm:px-8">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            className="mr-auto rounded-xl border border-[#e3ede9] bg-white p-2.5 text-[#44615a] lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </button>

          <NotificationsBell userId={user.id} />

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition hover:bg-white/70"
            >
              <Avatar user={user} size={40} />
              <span className="hidden text-left sm:block">
                <span className="block max-w-[9rem] truncate font-display text-[0.82rem] font-bold text-[#10231f]">
                  {user.name}
                </span>
              </span>
              <ChevronDown className="h-4 w-4 text-[#6c837c]" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-12 z-40 w-52 overflow-hidden rounded-2xl border border-[#e8f2ed] bg-white p-1.5 shadow-[0_24px_50px_-28px_rgba(13,71,60,0.5)]">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    go("settings");
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left font-sans text-[0.82rem] font-semibold text-[#315a50] hover:bg-[#f1f8f4]"
                >
                  <Settings className="h-4 w-4" /> Account settings
                </button>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left font-sans text-[0.82rem] font-semibold text-[#b2432c] hover:bg-[#fdf2ed]"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-[1180px] px-5 pb-16 pt-6 sm:px-8">
          {tab === "overview" && <OverviewTab {...props} onOpenTab={setTab} />}
          {tab === "learning" && <LearningTab {...props} />}
          {tab === "certificates" && (
            <CertificatesTab
              certificates={props.certificates}
              user={props.user}
              eligible={props.enrollments.some((e) => e.percent >= 80)}
            />
          )}
          {tab === "admissions" && <AdmissionsTab {...props} />}
          {tab === "settings" && <SettingsTab {...props} />}
          {tab === "support" && <SupportTab user={props.user} />}
        </main>
      </div>
    </div>
  );
}

/* ─────────────────────────────── avatar ────────────────────────────────── */

function Avatar({
  user,
  size = 36,
}: {
  user: DashUser;
  size?: number;
}) {
  return (
    <span
      className="grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-brand to-brand-fern font-display text-xs font-extrabold text-white ring-1 ring-white/20"
      style={{ width: size, height: size }}
    >
      {user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
      ) : (
        initials(user.name)
      )}
    </span>
  );
}

/* ─────────────────────────────── overview ──────────────────────────────── */

function OverviewTab({
  user,
  stats,
  enrollments,
  upcomingClasses,
  onOpenTab,
}: Props & { onOpenTab: (tab: TabKey) => void }) {
  const nextClass = upcomingClasses[0];

  return (
    <div className="space-y-7">
      {/* ── welcome + stats ─────────────────────────────────────────── */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.72fr)_minmax(0,0.95fr)]">
        <section className="relative overflow-hidden rounded-[1.75rem] bg-[linear-gradient(120deg,#eafaf1_0%,#ddf5e8_58%,#cff0df_100%)] px-6 py-8 sm:px-9 sm:py-9">
          <span aria-hidden className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-white/45" />
          <span aria-hidden className="absolute -bottom-24 left-1/4 h-56 w-56 rounded-full bg-white/30" />

          <div className="relative max-w-[26rem]">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-1.5 font-sans text-[0.76rem] font-semibold text-[#2a6a58] shadow-[0_2px_10px_-6px_rgba(13,71,60,0.4)]">
              <span aria-hidden>👋</span> Welcome back!
            </span>

            <h1 className="mt-3 font-display text-[clamp(1.85rem,3.3vw,2.55rem)] font-extrabold leading-[1.12] tracking-[-0.04em] text-[#10231f]">
              Hello, <span className="text-[#0d6a58]">{user.name}!</span>
            </h1>
            <p className="mt-2 font-sans text-[0.94rem] text-[#48625b]">
              Continue your learning journey with Language Hub.
            </p>

            <button
              type="button"
              onClick={() => onOpenTab(enrollments.length === 0 ? "admissions" : "learning")}
              className="group mt-5 inline-flex h-12 items-center gap-2.5 rounded-full bg-[#0d5c4d] px-6 font-display text-[0.86rem] font-bold text-white shadow-[0_16px_28px_-18px_rgba(13,92,77,0.95)] transition-transform duration-300 hover:-translate-y-0.5"
            >
              {enrollments.length === 0 ? "Browse Courses" : "Continue Learning"}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>

          <Image
            src="/brand/dashboard-welcome.png"
            alt=""
            aria-hidden
            width={1118}
            height={924}
            priority
            sizes="(min-width: 768px) 240px, 0px"
            className="pointer-events-none absolute -bottom-3 right-2 hidden h-[14.5rem] w-auto select-none drop-shadow-[0_18px_28px_rgba(13,71,60,0.16)] md:block lg:right-5"
          />
        </section>

        <section className="rounded-[1.75rem] bg-white p-6 shadow-[0_18px_40px_-34px_rgba(13,71,60,0.5)] ring-1 ring-[#eef5f1]">
          <h2 className="flex items-center gap-2.5 font-display text-[1rem] font-bold text-[#10231f]">
            <BarChart3 className="h-[1.15rem] w-[1.15rem] text-[#0d6a58]" strokeWidth={2.1} />
            Your Learning Stats
          </h2>

          <div className="mt-5 grid grid-cols-3 divide-x divide-[#eef5f1] text-center">
            {[
              {
                icon: PlayCircle,
                value: stats.courses,
                label: "Courses Enrolled",
                tone: "bg-[#e2f6ec] text-[#0d6a58]",
              },
              {
                icon: Trophy,
                value: stats.certificates,
                label: "Certificates",
                tone: "bg-[#fff4d9] text-[#d59a13]",
              },
              {
                icon: Star,
                value: `${stats.percent}%`,
                label: "Overall Progress",
                tone: "bg-[#fff7dc] text-[#e0a91b]",
              },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="px-2">
                  <span className={cn("mx-auto grid h-12 w-12 place-items-center rounded-full", stat.tone)}>
                    <Icon className="h-5 w-5" strokeWidth={1.9} />
                  </span>
                  <p className="mt-3 font-display text-[1.4rem] font-extrabold leading-none text-[#10231f]">
                    {stat.value}
                  </p>
                  <p className="mt-1.5 font-sans text-[0.72rem] leading-snug text-[#5c706a]">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ── my courses ──────────────────────────────────────────────── */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-3 font-display text-[1.35rem] font-extrabold tracking-[-0.02em] text-[#10231f]">
            <span aria-hidden className="h-[3px] w-7 rounded-full bg-[#f26a4a]" />
            My Courses
          </h2>
          <button
            type="button"
            onClick={() => onOpenTab("learning")}
            className="inline-flex items-center gap-1.5 font-sans text-[0.82rem] font-semibold text-[#0d6a58] transition-colors hover:text-[#0a4e43]"
          >
            View All Courses <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4">
          {enrollments.length === 0 ? (
            <div className="relative overflow-hidden rounded-[1.75rem] bg-[linear-gradient(115deg,#effaf4_0%,#e2f6ec_100%)] px-6 py-7 sm:px-9 sm:py-8">
              <span aria-hidden className="absolute -left-10 -bottom-14 h-40 w-40 rounded-full bg-white/40" />
              <div className="relative grid items-center gap-6 sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.5fr)]">
                <Image
                  src="/brand/dashboard-empty.png"
                  alt="A laptop showing the Language Hub dashboard"
                  width={1505}
                  height={844}
                  sizes="(min-width: 640px) 320px, 78vw"
                  className="mx-auto h-auto w-full max-w-[20rem] select-none drop-shadow-[0_16px_26px_rgba(13,71,60,0.12)] sm:max-w-[22rem]"
                />
                <div className="text-center sm:text-left">
                  <h3 className="font-display text-[1.35rem] font-extrabold tracking-[-0.02em] text-[#10231f]">
                    No Courses Enrolled Yet!
                  </h3>
                  <p className="mt-2 font-sans text-[0.9rem] leading-relaxed text-[#5c706a]">
                    Explore our courses and start your learning journey today.
                  </p>
                  <Link
                    href="/courses"
                    className="group mt-4 inline-flex h-11 items-center gap-2.5 rounded-full bg-[#0d5c4d] px-6 font-display text-[0.82rem] font-bold text-white shadow-[0_14px_24px_-18px_rgba(13,92,77,0.9)] transition-transform duration-300 hover:-translate-y-0.5"
                  >
                    Browse Courses
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {enrollments.map((e) => (
                <article
                  key={e.id}
                  className="rounded-2xl bg-white p-5 shadow-[0_14px_34px_-30px_rgba(13,71,60,0.55)] ring-1 ring-[#eef5f1]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e4f6ee] text-[#0d6a58]">
                      <BookOpen className="h-5 w-5" strokeWidth={1.9} />
                    </span>
                    <Badge tone={STATUS_TONE[e.status]}>{e.status}</Badge>
                  </div>
                  <h3 className="mt-3 font-display text-[1rem] font-bold leading-snug text-[#10231f]">
                    {e.course}
                  </h3>
                  <p className="mt-1 font-sans text-[0.76rem] text-[#7b8f89]">
                    {e.batch || "Batch to be assigned"}
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <ProgressBar value={e.percent} />
                    <span className="font-sans text-[0.72rem] font-bold text-[#0d6a58]">{e.percent}%</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── next class (only when scheduled) ────────────────────────── */}
      {nextClass ? (
        <section className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-5 shadow-[0_14px_34px_-32px_rgba(13,71,60,0.5)] ring-1 ring-[#eef5f1]">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e4f6ee] text-[#0d6a58]">
            <CalendarDays className="h-5 w-5" strokeWidth={1.9} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-sans text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#7b8f89]">
              Next live class
            </p>
            <p className="truncate font-display text-[0.95rem] font-bold text-[#10231f]">{nextClass.title}</p>
            <p className="font-sans text-[0.78rem] text-[#5c706a]">
              {fmtTime(nextClass.scheduledAt)} · {nextClass.platform}
            </p>
          </div>
          {nextClass.meetingLink ? (
            <a
              href={nextClass.meetingLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#0d5c4d] px-5 font-display text-[0.78rem] font-bold text-white hover:bg-[#0a4e43]"
            >
              <PlayCircle className="h-4 w-4" /> Join
            </a>
          ) : null}
        </section>
      ) : null}

      {/* ── closing quote ───────────────────────────────────────────── */}
      <section className="flex flex-wrap items-center gap-5 rounded-[1.6rem] bg-[#eaf8f1] px-6 py-6">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#cdeedd] text-[#2f8a74]">
          <MessageCircle className="h-5 w-5" strokeWidth={2} />
        </span>
        <p className="flex-1 font-serif text-[clamp(1.05rem,2vw,1.35rem)] italic text-[#315a50]">
          “Learn today, lead tomorrow.”
        </p>
        <span aria-hidden className="hidden h-px w-16 bg-[#b9dccb] sm:block" />
        <span className="font-display text-[0.82rem] font-bold text-[#315a50]">Language Hub</span>
      </section>
    </div>
  );
}

function SupportTab({ user }: { user: DashUser }) {
  const cards = [
    {
      icon: MessageCircle,
      title: "Chat on WhatsApp",
      body: "Fastest route to the admissions desk for schedule, fee or batch questions.",
      href: "https://wa.me/923001234567",
      label: "Open WhatsApp",
    },
    {
      icon: Mail,
      title: "Email the team",
      body: "Share documents or ask for a detailed reply — we answer within one working day.",
      href: `mailto:hello@languagehub.pk?subject=Support%20request%20—%20${encodeURIComponent(user.name)}`,
      label: "Send email",
    },
    {
      icon: BookOpen,
      title: "Course catalogue",
      body: "Compare programmes, batch timings and what each course includes.",
      href: "/courses",
      label: "Browse courses",
    },
    {
      icon: Lightbulb,
      title: "Share feedback",
      body: "Tell us what to improve — every note reaches the academic team.",
      href: "/feedback",
      label: "Give feedback",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] bg-[linear-gradient(120deg,#eafaf1,#ddf5e8)] px-7 py-8">
        <h1 className="font-display text-[1.7rem] font-extrabold tracking-[-0.03em] text-[#10231f]">
          Help &amp; Support
        </h1>
        <p className="mt-1.5 max-w-xl font-sans text-[0.9rem] leading-relaxed text-[#48625b]">
          A real person from the Language Hub team is one message away. Pick the channel
          that suits you best.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <a
              key={card.title}
              href={card.href}
              className="group rounded-2xl bg-white p-5 shadow-[0_14px_34px_-32px_rgba(13,71,60,0.5)] ring-1 ring-[#eef5f1] transition-transform duration-300 hover:-translate-y-1"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e4f6ee] text-[#0d6a58]">
                <Icon className="h-5 w-5" strokeWidth={1.9} />
              </span>
              <h2 className="mt-3 font-display text-[1rem] font-bold text-[#10231f]">{card.title}</h2>
              <p className="mt-1.5 font-sans text-[0.82rem] leading-relaxed text-[#5c706a]">{card.body}</p>
              <span className="mt-3 inline-flex items-center gap-1.5 font-sans text-[0.78rem] font-semibold text-[#0d6a58]">
                {card.label} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────── learning ──────────────────────────────── */

function LearningTab({
  progress,
  enrollments,
}: Pick<Props, "progress" | "enrollments">) {
  const [state, setState] = useState(progress);
  const [busy, setBusy] = useState<string | null>(null);

  const toggle = async (enrollmentId: string, chapterId: string) => {
    setBusy(chapterId);
    try {
      const res = await fetch("/api/dashboard/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId }),
      });
      if (!res.ok) return;
      setState((prev) =>
        prev.map((p) =>
          p.enrollmentId !== enrollmentId
            ? p
            : (() => {
                const chapters = p.chapters.map((c) =>
                  c.id === chapterId ? { ...c, completed: !c.completed } : c
                );
                const done = chapters.filter((c) => c.completed).length;
                return {
                  ...p,
                  chapters,
                  percent: chapters.length ? Math.round((done / chapters.length) * 100) : 0,
                };
              })()
        )
      );
    } finally {
      setBusy(null);
    }
  };

  if (state.length === 0) {
    return (
      <Panel className="px-6 py-14 text-center">
        <GraduationCap className="mx-auto h-8 w-8 text-brand" />
        <h2 className="mt-3 font-display text-lg font-extrabold">No course yet</h2>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-3">
          Once your admission is confirmed, your syllabus and progress tracker appear here.
        </p>
      </Panel>
    );
  }

  return (
    <div className="space-y-5">
      {state.map((p) => {
        const enrollment = enrollments.find((e) => e.id === p.enrollmentId);
        const done = p.chapters.filter((c) => c.completed).length;
        return (
          <Panel key={p.enrollmentId} className="overflow-hidden">
            <div className="border-b border-line bg-cream/60 px-5 py-4 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-base font-extrabold tracking-tight">{p.course}</h3>
                  <p className="mt-0.5 text-xs text-ink-3">
                    {p.batch || "Batch to be assigned"}
                    {enrollment?.instructor ? ` · ${enrollment.instructor}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={STATUS_TONE[enrollment?.status ?? "ACTIVE"]}>
                    {enrollment?.status ?? "ACTIVE"}
                  </Badge>
                  <span className="font-display text-lg font-extrabold text-brand-deep">
                    {p.percent}%
                  </span>
                </div>
              </div>
              <ProgressBar value={p.percent} className="mt-3" />
            </div>

            <div className="grid gap-6 px-5 py-5 sm:px-6 lg:grid-cols-[1.5fr_1fr]">
              <div>
                <p className="font-mono text-[0.58rem] font-bold uppercase tracking-[0.2em] text-ink-3">
                  Syllabus · {done}/{p.chapters.length} complete
                </p>
                <ul className="mt-3 space-y-1">
                  {p.chapters.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => toggle(p.enrollmentId, c.id)}
                        disabled={busy === c.id}
                        className="group flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition hover:bg-cream disabled:opacity-60"
                      >
                        <span
                          className={cn(
                            "grid h-5 w-5 shrink-0 place-items-center rounded-md border transition",
                            c.completed
                              ? "border-brand bg-brand text-white"
                              : "border-ink/20 bg-white text-transparent group-hover:border-brand/50"
                          )}
                        >
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                        <span
                          className={cn(
                            "text-sm",
                            c.completed ? "text-ink-3 line-through" : "font-medium text-ink"
                          )}
                        >
                          {c.title}
                        </span>
                      </button>
                    </li>
                  ))}
                  {p.chapters.length === 0 && (
                    <li className="text-xs text-ink-3">
                      Your instructor will publish the syllabus soon.
                    </li>
                  )}
                </ul>
              </div>

              <div>
                <p className="font-mono text-[0.58rem] font-bold uppercase tracking-[0.2em] text-ink-3">
                  Attendance
                </p>
                <ul className="mt-3 space-y-2">
                  {p.attendance.slice(0, 6).map((a, i) => (
                    <li
                      key={`${a.date}-${i}`}
                      className="flex items-start gap-2.5 rounded-lg border border-line px-3 py-2"
                    >
                      {a.attended ? (
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      ) : (
                        <CircleDashed className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-3" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-ink">{a.topic}</p>
                        <p className="font-mono text-[0.55rem] uppercase tracking-[0.08em] text-ink-3">
                          {fmt(a.date)}
                        </p>
                      </div>
                    </li>
                  ))}
                  {p.attendance.length === 0 && (
                    <li className="text-xs text-ink-3">Attendance appears after your first class.</li>
                  )}
                </ul>
              </div>
            </div>
          </Panel>
        );
      })}
    </div>
  );
}

/* ───────────────────────────── certificates ────────────────────────────── */

function CertificatesTab({
  certificates,
  user,
  eligible,
}: {
  certificates: DashCertificate[];
  user: DashUser;
  eligible: boolean;
}) {
  const router = useRouter();
  const [list, setList] = useState(certificates);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const issue = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/certificates", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message ?? "Could not issue the certificate yet.");
        return;
      }
      setList((prev) => [
        {
          id: data.certificate.id,
          certificateId: data.certificate.certificateId,
          course: data.certificate.course,
          batch: "",
          issuedAt: data.certificate.issuedAt,
          completionPercent: data.certificate.completionPercent,
        },
        ...prev,
      ]);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <Panel className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-base font-extrabold tracking-tight">
            Certificates & verified results
          </h2>
          <p className="mt-1 text-sm text-ink-3">
            Certificates unlock at 80% course completion. Each one has a public verification page.
          </p>
        </div>
        <button
          type="button"
          onClick={issue}
          disabled={busy}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-deep px-4 py-2.5 text-sm font-bold text-white transition hover:bg-night disabled:opacity-60"
        >
          <Award className="h-4 w-4" />
          {busy ? "Checking…" : eligible ? "Issue certificate" : "Check eligibility"}
        </button>
      </Panel>

      {error && (
        <p className="rounded-xl border border-coral/30 bg-coral/[0.06] px-4 py-3 text-sm text-coral-deep">
          {error}
        </p>
      )}

      {list.length === 0 ? (
        <Panel className="px-6 py-14 text-center">
          <Award className="mx-auto h-8 w-8 text-brand" />
          <h2 className="mt-3 font-display text-lg font-extrabold">No certificate yet</h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-3">
            Keep going, {user.name.split(" ")[0]}. Your first certificate is closer than you think.
          </p>
        </Panel>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((c) => (
            <Panel key={c.id} className="overflow-hidden">
              <div className="bg-gradient-to-br from-night to-[#0b574a] px-5 py-4 text-white">
                <p className="font-mono text-[0.55rem] font-bold uppercase tracking-[0.24em] text-brand-cyan">
                  Certificate of completion
                </p>
                <p className="mt-1.5 font-display text-lg font-extrabold tracking-tight">{c.course}</p>
              </div>
              <div className="px-5 py-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-3">Completion</span>
                  <span className="font-bold text-ink">{c.completionPercent}%</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-ink-3">Issued</span>
                  <span className="font-bold text-ink">{fmt(c.issuedAt)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-ink-3">Verified ID</span>
                  <span className="font-mono text-[0.68rem] font-bold text-brand-deep">
                    {c.certificateId}
                  </span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/result/${c.certificateId}`}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-cream px-3 py-2 text-xs font-bold text-brand-deep hover:bg-parchment"
                  >
                    View <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                  <a
                    href={`/result/${c.certificateId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-xs font-bold text-white hover:bg-night"
                  >
                    <Download className="h-3.5 w-3.5" /> Share
                  </a>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────── admissions ────────────────────────────── */

function AdmissionsTab({
  registrations,
  user,
}: Pick<Props, "registrations" | "user">) {
  const [picking, setPicking] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const courses = useMemo(() => Object.values(REGISTRATION_COURSES_BY_KEY), []);
  const activeCourse = activeKey ? REGISTRATION_COURSES_BY_KEY[activeKey] : null;

  return (
    <div className="space-y-5">
      <Panel className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-base font-extrabold tracking-tight">Admissions</h2>
          <p className="mt-1 text-sm text-ink-3">
            Your registration requests and their live status. Start a new admission any time.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setPicking(true);
            setDone(null);
          }}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-deep px-4 py-2.5 text-sm font-bold text-white transition hover:bg-night"
        >
          <Plus className="h-4 w-4" /> New registration
        </button>
      </Panel>

      {done && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <p className="flex items-center gap-2 text-sm font-bold text-emerald-800">
            <CheckCircle2 className="h-4 w-4" /> Registration {done} submitted
          </p>
          <p className="mt-1 text-xs text-emerald-700">
            Our admissions team replies within 24 hours. You can track the status on this page.
          </p>
        </div>
      )}

      {picking && !activeCourse && (
        <div className="grid gap-3 sm:grid-cols-2">
          {courses.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setActiveKey(c.key)}
              className="group flex items-start justify-between gap-3 rounded-2xl border border-line bg-white p-5 text-left transition hover:border-brand/40 hover:shadow-[0_12px_28px_-18px_rgba(10,78,67,0.5)]"
            >
              <div>
                <p className="font-display text-sm font-extrabold tracking-tight text-ink">{c.name}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-3">{c.tagline}</p>
              </div>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-cream text-brand-deep transition group-hover:bg-brand-deep group-hover:text-white">
                <ArrowRight className="h-4 w-4" />
              </span>
            </button>
          ))}
        </div>
      )}

      {registrations.length === 0 ? (
        <Panel className="px-6 py-14 text-center">
          <CreditCard className="mx-auto h-8 w-8 text-brand" />
          <h2 className="mt-3 font-display text-lg font-extrabold">No registration yet</h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-3">
            Choose a programme above to begin. The form takes about five minutes.
          </p>
        </Panel>
      ) : (
        <Panel className="overflow-hidden">
          <div className="border-b border-line px-5 py-3.5">
            <p className="font-mono text-[0.58rem] font-bold uppercase tracking-[0.2em] text-ink-3">
              Submitted registrations
            </p>
          </div>
          <ul className="divide-y divide-line">
            {registrations.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-cream text-brand-deep">
                  <GraduationCap className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold capitalize text-ink">
                    {r.courseSlug.replace(/-/g, " ")}
                  </p>
                  <p className="font-mono text-[0.58rem] uppercase tracking-[0.12em] text-ink-3">
                    {r.ref} · {fmt(r.createdAt)}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {activeCourse && (
        <RegistrationWizard
          course={activeCourse}
          userName={user.name}
          userEmail={user.email}
          onExit={() => {
            setActiveKey(null);
            setPicking(false);
          }}
          onSuccess={(ref) => {
            setDone(ref);
            setActiveKey(null);
            setPicking(false);
          }}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────── settings ──────────────────────────────── */

function SettingsTab({ user }: Pick<Props, "user">) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileBusy, setProfileBusy] = useState(false);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePass, setDeletePass] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileBusy(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, whatsapp: phone }),
      });
      const data = await res.json().catch(() => null);
      setProfileMsg(res.ok ? "Profile saved." : (data?.message ?? "Could not save."));
      if (res.ok) router.refresh();
    } finally {
      setProfileBusy(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwBusy(true);
    setPwError(null);
    setPwMsg(null);
    try {
      const res = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current, next }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setPwError(data?.message ?? "Could not change the password.");
        return;
      }
      setCurrent("");
      setNext("");
      // The server bumps token_version, which revokes every older session —
      // including this one. Sign out cleanly so the next sign-in is fresh.
      if (data?.reauth) {
        setPwMsg("Password updated. Signing you out…");
        await signOut({ callbackUrl: "/login?passwordChanged=1" });
        return;
      }
      setPwMsg("Password updated.");
    } finally {
      setPwBusy(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    setAvatarBusy(true);
    try {
      const dataUrl = await resizeImage(file, 512);
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      if (res.ok) {
        setAvatarVersion((v) => v + 1);
        router.refresh();
      }
    } finally {
      setAvatarBusy(false);
    }
  };

  const deleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);
    const res = await fetch("/api/profile", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: deletePass }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setDeleteError(data?.message ?? "Could not delete the account.");
      return;
    }
    await signOut({ callbackUrl: "/" });
  };

  const avatarSrc = user.image ? `${user.image}?v=${avatarVersion}` : null;

  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-5">
        <Panel className="p-5 sm:p-6">
          <h2 className="font-display text-base font-extrabold tracking-tight">Profile</h2>
          <div className="mt-4 flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-brand-fern font-display text-lg font-extrabold text-white">
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarSrc} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                initials(user.name)
              )}
            </span>
            <div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={avatarBusy}
                className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs font-bold text-ink transition hover:border-brand/40 disabled:opacity-60"
              >
                <Upload className="h-3.5 w-3.5" />
                {avatarBusy ? "Uploading…" : "Change photo"}
              </button>
              <p className="mt-1.5 text-[0.68rem] text-ink-3">JPG, PNG or WebP · up to 2.5 MB</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadAvatar(file);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          <form onSubmit={saveProfile} className="mt-5 space-y-3">
            <label className="block">
              <span className="font-mono text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-3">
                Full name
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-3">
                WhatsApp number
              </span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 0000000"
                className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-3">
                Email
              </span>
              <input
                value={user.email}
                readOnly
                className="mt-1.5 w-full cursor-not-allowed rounded-xl border border-line bg-cream px-3.5 py-2.5 text-sm text-ink-3"
              />
            </label>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={profileBusy}
                className="rounded-xl bg-brand-deep px-4 py-2.5 text-sm font-bold text-white transition hover:bg-night disabled:opacity-60"
              >
                {profileBusy ? "Saving…" : "Save changes"}
              </button>
              {profileMsg && <span className="text-xs font-semibold text-brand-deep">{profileMsg}</span>}
            </div>
          </form>
        </Panel>

        <Panel className="p-5 sm:p-6">
          <h2 className="font-display text-base font-extrabold tracking-tight">Password</h2>
          <form onSubmit={changePassword} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="font-mono text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-3">
                Current password
              </span>
              <input
                type="password"
                required
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-3">
                New password
              </span>
              <input
                type="password"
                required
                value={next}
                onChange={(e) => setNext(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
              />
            </label>
            <div className="sm:col-span-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={pwBusy}
                className="rounded-xl border border-line px-4 py-2.5 text-sm font-bold text-ink transition hover:border-brand/40 disabled:opacity-60"
              >
                {pwBusy ? "Updating…" : "Update password"}
              </button>
              {pwMsg && <span className="text-xs font-semibold text-brand-deep">{pwMsg}</span>}
              {pwError && <span className="text-xs font-semibold text-coral-deep">{pwError}</span>}
            </div>
          </form>
        </Panel>
      </div>

      <div className="space-y-5">
        <Panel className="p-5">
          <h3 className="font-display text-base font-extrabold tracking-tight">Refer a friend</h3>
          <p className="mt-1 text-xs leading-relaxed text-ink-3">
            Share your code — your friend gets 10% off their first month.
          </p>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-brand/30 bg-cream px-3 py-2.5">
            <Sparkles className="h-4 w-4 text-brand" />
            <span className="font-mono text-sm font-bold tracking-[0.14em] text-brand-deep">
              {user.referralCode ?? "—"}
            </span>
          </div>
        </Panel>

        <Panel className="p-5">
          <h3 className="font-display text-base font-extrabold tracking-tight">Your data</h3>
          <p className="mt-1 text-xs leading-relaxed text-ink-3">
            Download everything we store about your account as JSON.
          </p>
          <a
            href="/api/profile/export"
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs font-bold text-ink hover:border-brand/40"
          >
            <Download className="h-3.5 w-3.5" /> Export my data
          </a>
        </Panel>

        <Panel className="border-coral/25 p-5">
          <h3 className="flex items-center gap-2 font-display text-base font-extrabold tracking-tight text-coral-deep">
            <ShieldCheck className="h-4 w-4" /> Danger zone
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-ink-3">
            Deleting your account removes your registrations, progress and certificates. This cannot
            be undone.
          </p>
          {!deleteOpen ? (
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-coral/40 px-3 py-2 text-xs font-bold text-coral-deep hover:bg-coral/[0.06]"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete account
            </button>
          ) : (
            <form onSubmit={deleteAccount} className="mt-3 space-y-2">
              <input
                type="password"
                required
                placeholder="Confirm your password"
                value={deletePass}
                onChange={(e) => setDeletePass(e.target.value)}
                className="w-full rounded-lg border border-coral/30 bg-white px-3 py-2 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/15"
              />
              {deleteError && <p className="text-xs font-semibold text-coral-deep">{deleteError}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-lg bg-coral px-3 py-2 text-xs font-bold text-white hover:bg-coral-deep"
                >
                  Permanently delete
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteOpen(false);
                    setDeletePass("");
                    setDeleteError(null);
                  }}
                  className="rounded-lg border border-line px-3 py-2 text-xs font-bold text-ink-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </Panel>

        <Panel className="p-5">
          <h3 className="font-display text-base font-extrabold tracking-tight">Need a hand?</h3>
          <p className="mt-1 text-xs leading-relaxed text-ink-3">
            Our team replies within one working day.
          </p>
          <div className="mt-3 space-y-2 text-xs">
            <Link
              href="/feedback"
              className="flex items-center gap-2 font-semibold text-brand-deep hover:underline"
            >
              <Mail className="h-3.5 w-3.5" /> Send feedback
            </Link>
            <Link
              href="/courses"
              className="flex items-center gap-2 font-semibold text-brand-deep hover:underline"
            >
              <Users className="h-3.5 w-3.5" /> Browse programmes
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}
