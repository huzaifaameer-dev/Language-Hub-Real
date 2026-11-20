"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  CalendarClock,
  ChevronDown,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Newspaper,
  RefreshCw,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  Star,
  Target,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { api } from "@/components/admin/ui";
import { OverviewSection, SecuritySection, SettingsSection } from "@/components/admin/sections/system";
import { UsersSection, CoursesSection, ClassesSection } from "@/components/admin/sections/learning";
import { RegistrationsSection, DemosSection, LeadsSection } from "@/components/admin/sections/admissions";
import { FeedbackSection, TestimonialsSection } from "@/components/admin/sections/content";
import { StudentReviewsSection } from "@/components/admin/sections/studentReviews";
import { BlogSection } from "@/components/admin/blog/BlogSection";

type TabKey =
  | "overview"
  | "registrations"
  | "demo"
  | "leads"
  | "users"
  | "courses"
  | "classes"
  | "testimonials"
  | "student-reviews"
  | "blog"
  | "feedback"
  | "security"
  | "settings";

const GROUPS: Array<{
  label: string;
  items: Array<{ key: TabKey; label: string; icon: typeof LayoutDashboard }>;
}> = [
  {
    label: "Workspace",
    items: [{ key: "overview", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Front desk",
    items: [
      { key: "registrations", label: "Admissions", icon: ClipboardList },
      { key: "demo", label: "Demo Classes", icon: CalendarClock },
      { key: "leads", label: "Placement Leads", icon: Target },
    ],
  },
  {
    label: "Academy",
    items: [
      { key: "users", label: "User Accounts", icon: Users },
      { key: "courses", label: "Courses", icon: BookOpen },
      { key: "classes", label: "Live Classes", icon: GraduationCap },
    ],
  },
  {
    label: "Content",
    items: [
      { key: "blog", label: "Blog Studio", icon: Newspaper },
      { key: "student-reviews", label: "Student Reviews", icon: Star },
      { key: "testimonials", label: "Testimonials", icon: Sparkles },
      { key: "feedback", label: "Feedback", icon: MessageSquare },
    ],
  },
  {
    label: "System",
    items: [
      { key: "security", label: "Security", icon: ShieldAlert },
      { key: "settings", label: "Settings", icon: Settings },
    ],
  },
];

const TITLES: Record<TabKey, { eyebrow: string; title: string }> = {
  overview: { eyebrow: "Welcome back", title: "Admin Dashboard" },
  registrations: { eyebrow: "Front desk", title: "Admissions" },
  demo: { eyebrow: "Front desk", title: "Demo Classes" },
  leads: { eyebrow: "Front desk", title: "Placement Leads" },
  users: { eyebrow: "Academy", title: "User Accounts" },
  courses: { eyebrow: "Academy", title: "Courses" },
  classes: { eyebrow: "Academy", title: "Live Classes" },
  testimonials: { eyebrow: "Content", title: "Testimonials" },
  "student-reviews": { eyebrow: "Content", title: "Student Reviews" },
  blog: { eyebrow: "Content", title: "Blog Studio" },
  feedback: { eyebrow: "Content", title: "Feedback" },
  security: { eyebrow: "System", title: "Security" },
  settings: { eyebrow: "System", title: "Settings" },
};

const SIDEBAR = "#0b4f45";

/* ───────────────────────────── notifications ───────────────────────────── */

type NotificationItem = {
  id: string;
  kind: "registration" | "demo" | "comment" | "feedback" | "review";
  title: string;
  detail: string;
  tab: TabKey;
  createdAt: string;
};

type NotificationFeed = {
  total: number;
  counts: Partial<
    Record<"registrations" | "demos" | "comments" | "feedback" | "studentReviews", number>
  >;
  items: NotificationItem[];
};

const NOTIFICATION_META: Record<
  NotificationItem["kind"],
  { icon: typeof Bell; tint: string; label: string }
> = {
  registration: { icon: UserPlus, tint: "bg-[#eaf7f3] text-[#0d6a58]", label: "Admissions" },
  demo: { icon: CalendarClock, tint: "bg-[#fff5e0] text-[#a97a10]", label: "Demo" },
  comment: { icon: MessageSquare, tint: "bg-[#eef2ff] text-[#4f5bbd]", label: "Comment" },
  feedback: { icon: Sparkles, tint: "bg-[#fdeee8] text-[#c14f2e]", label: "Feedback" },
  review: { icon: Star, tint: "bg-[#fff6dc] text-[#a97a10]", label: "Student review" },
};

function formatStamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminConsole({
  admin,
}: {
  admin: { id: string; email: string | null; name: string; role?: string };
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("overview");
  const [navOpen, setNavOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifFeed, setNotifFeed] = useState<NotificationFeed | null>(null);
  const [notifBusy, setNotifBusy] = useState(false);
  const notifRef = useRef<HTMLDivElement | null>(null);

  const loadNotifications = async () => {
    setNotifBusy(true);
    try {
      setNotifFeed(await api<NotificationFeed>("/api/admin/notifications"));
    } catch {
      /* keep the last feed — the bell must never break the console */
    } finally {
      setNotifBusy(false);
    }
  };

  /* Refresh the badge whenever the admin moves between sections. */
  useEffect(() => {
    let alive = true;
    api<NotificationFeed>("/api/admin/notifications")
      .then((feed) => {
        if (alive) setNotifFeed(feed);
      })
      .catch(() => null);
    return () => {
      alive = false;
    };
  }, [tab]);

  useEffect(() => {
    if (!notifOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!notifRef.current?.contains(event.target as Node)) setNotifOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNotifOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [notifOpen]);

  const meta = TITLES[tab];
  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const signOut = async () => {
    setSigningOut(true);
    await api("/api/admin/session", { method: "DELETE" }).catch(() => null);
    router.refresh();
    router.push("/admin-panel");
  };

  const go = (next: TabKey) => {
    setTab(next);
    setNavOpen(false);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const notifItems = notifFeed?.items ?? [];
  const notifTotal = notifFeed?.total ?? 0;

  return (
    <div className="min-h-screen bg-[#f4fbf8] text-[#10231f]">
      {/* ── sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[252px] flex-col overflow-hidden transition-transform duration-300 lg:translate-x-0",
          navOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ backgroundColor: SIDEBAR }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-24 h-48 w-48 rounded-full bg-white/[0.05]"
        />

        <div className="relative flex items-center justify-between px-5 pb-2 pt-7">
          <Link href="/admin-panel" className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-white ring-1 ring-white/30">
              <Logo size="xs" eager />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-[0.98rem] font-bold tracking-tight text-white">
                Language Hub
              </span>
              <span className="block font-sans text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/45">
                Admin Panel
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setNavOpen(false)}
            className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav
          className="relative mt-6 flex-1 space-y-5 overflow-y-auto px-3.5 pb-4"
          aria-label="Admin sections"
        >
          {GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 font-sans text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white/35">
                {group.label}
              </p>
              <div className="mt-2 space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = item.key === tab;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => go(item.key)}
                      className={cn(
                        "group flex w-full items-center gap-3 rounded-full px-3.5 py-2.5 text-left font-sans text-[0.85rem] font-semibold transition-all duration-200",
                        active
                          ? "bg-white text-[#0b4f45] shadow-[0_10px_20px_-14px_rgba(0,0,0,0.6)]"
                          : "text-white/65 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-[1.05rem] w-[1.05rem] shrink-0",
                          active ? "text-[#0b4f45]" : "text-white/50 group-hover:text-white"
                        )}
                        strokeWidth={active ? 2.2 : 1.9}
                      />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="relative mx-3.5 mb-4 rounded-2xl bg-white/[0.08] p-4 ring-1 ring-white/10">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#8fe0c6] font-display text-[0.68rem] font-extrabold text-[#0b4f45]">
              {admin.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "AD"}
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-[0.82rem] font-bold text-white">
                {admin.name}
              </p>
              <p className="truncate font-sans text-[0.64rem] text-white/50">{admin.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-white/15 py-2 font-sans text-[0.72rem] font-semibold text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>

        <Link
          href="/"
          className="relative mx-3.5 mb-6 flex items-center justify-between rounded-full px-3.5 py-2 font-sans text-[0.72rem] font-semibold text-white/45 transition hover:text-white"
        >
          View website
          <span aria-hidden>↗</span>
        </Link>
      </aside>

      {navOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-40 bg-[#062e28]/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* ── main ────────────────────────────────────────────────────────── */}
      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-30 border-b border-[#e8f2ed] bg-[#f4fbf8]/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-[1280px] items-center gap-3 px-5 py-3.5 sm:px-8">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              className="rounded-xl border border-[#e3ede9] bg-white p-2 text-[#44615a] lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="hidden min-w-0 sm:block">
              <p className="font-sans text-[0.66rem] font-semibold text-[#7b8f89]">
                {meta.eyebrow}
              </p>
              <h1 className="truncate font-display text-[1.05rem] font-extrabold tracking-[-0.02em] text-[#10231f]">
                {meta.title}
              </h1>
            </div>

            {/* search */}
            <label className="ml-auto hidden h-10 w-full max-w-[16rem] items-center gap-2 rounded-full border border-[#e3ede9] bg-white px-4 md:flex">
              <Search className="h-4 w-4 shrink-0 text-[#8ba19b]" strokeWidth={2} />
              <input
                type="search"
                placeholder="Search anything..."
                aria-label="Search the admin panel"
                className="w-full bg-transparent font-sans text-[0.82rem] text-[#10231f] outline-none placeholder:text-[#9aada7]"
              />
            </label>

            <span className="hidden h-9 items-center rounded-full border border-[#e3ede9] bg-white px-4 font-sans text-[0.76rem] font-semibold text-[#44615a] sm:inline-flex">
              {today}
            </span>

            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((open) => {
                    if (!open) void loadNotifications();
                    return !open;
                  });
                }}
                aria-label={notifTotal > 0 ? `${notifTotal} new notifications` : "Notifications"}
                aria-expanded={notifOpen}
                aria-haspopup="dialog"
                className={cn(
                  "relative grid h-10 w-10 place-items-center rounded-full border bg-white transition",
                  notifOpen
                    ? "border-[#9fd8cb] text-[#0d6a58]"
                    : "border-[#e3ede9] text-[#44615a] hover:text-[#0d6a58]"
                )}
              >
                <Bell className="h-[1.05rem] w-[1.05rem]" strokeWidth={1.9} />
                {notifTotal > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-4 min-w-[1rem] place-items-center rounded-full bg-[#f26a4a] px-1 font-sans text-[0.52rem] font-bold leading-none text-white ring-2 ring-[#f4fbf8]">
                    {notifTotal > 9 ? "9+" : notifTotal}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div
                  role="dialog"
                  aria-label="Notifications"
                  className="absolute right-0 top-[calc(100%+0.65rem)] z-50 w-[min(22.5rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-[#e8f2ed] bg-white shadow-[0_30px_60px_-30px_rgba(13,71,60,0.5)]"
                >
                  <div className="flex items-center justify-between border-b border-[#f0f6f3] px-4 py-3">
                    <div>
                      <p className="font-display text-[0.86rem] font-bold text-[#10231f]">
                        Notifications
                      </p>
                      <p className="font-sans text-[0.66rem] text-[#8ba19b]">
                        {notifTotal > 0
                          ? `${notifTotal} item${notifTotal === 1 ? "" : "s"} need attention`
                          : "You are all caught up"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void loadNotifications()}
                      aria-label="Refresh notifications"
                      disabled={notifBusy}
                      className="grid h-8 w-8 place-items-center rounded-full text-[#7b8f89] transition hover:bg-[#f1f8f4] hover:text-[#0d6a58] disabled:opacity-50"
                    >
                      <RefreshCw className={cn("h-3.5 w-3.5", notifBusy && "animate-spin")} strokeWidth={2.1} />
                    </button>
                  </div>

                  <div className="max-h-[21rem] overflow-y-auto thin-scroll">
                    {notifItems.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 px-6 py-9 text-center">
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-[#eaf7f3] text-[#0d6a58]">
                          <Bell className="h-4 w-4" strokeWidth={1.9} />
                        </span>
                        <p className="font-sans text-[0.78rem] font-semibold text-[#10231f]">
                          Nothing waiting
                        </p>
                        <p className="font-sans text-[0.7rem] leading-relaxed text-[#8ba19b]">
                          New admissions, demo bookings, journal comments, feedback and
                          student reviews will appear here.
                        </p>
                      </div>
                    ) : (
                      notifItems.map((item) => {
                        const meta = NOTIFICATION_META[item.kind];
                        const Icon = meta.icon;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              go(item.tab);
                              setNotifOpen(false);
                            }}
                            className="flex w-full items-start gap-3 border-b border-[#f6fbf9] px-4 py-3 text-left transition last:border-0 hover:bg-[#f7fcfa]"
                          >
                            <span
                              className={cn(
                                "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                                meta.tint
                              )}
                            >
                              <Icon className="h-4 w-4" strokeWidth={2} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-sans text-[0.79rem] font-semibold text-[#10231f]">
                                {item.title}
                              </span>
                              <span className="mt-0.5 block truncate font-sans text-[0.7rem] text-[#7b8f89]">
                                {item.detail}
                              </span>
                              <span className="mt-1 flex items-center gap-1.5 font-sans text-[0.6rem] uppercase tracking-[0.1em] text-[#9aada7]">
                                <span>{meta.label}</span>
                                <span aria-hidden>·</span>
                                <span>{formatStamp(item.createdAt)}</span>
                              </span>
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="border-t border-[#f0f6f3] bg-[#fbfefd] px-4 py-2.5">
                    <p className="font-sans text-[0.64rem] text-[#8ba19b]">
                      Tap an item to open its section.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-white/70"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full text-[0.66rem] font-extrabold text-white" style={{ backgroundColor: SIDEBAR }}>
                  {admin.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "AD"}
                </span>
                <ChevronDown className="hidden h-4 w-4 text-[#6c837c] sm:block" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-12 z-40 w-52 overflow-hidden rounded-2xl border border-[#e8f2ed] bg-white p-1.5 shadow-[0_24px_50px_-28px_rgba(13,71,60,0.5)]">
                  <div className="px-3 py-2">
                    <p className="truncate font-display text-[0.82rem] font-bold text-[#10231f]">
                      {admin.name}
                    </p>
                    <p className="truncate font-sans text-[0.7rem] text-[#7b8f89]">{admin.email}</p>
                  </div>
                  <span className="block h-px bg-[#eef5f1]" />
                  <button
                    type="button"
                    onClick={() => go("settings")}
                    className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left font-sans text-[0.82rem] font-semibold text-[#315a50] hover:bg-[#f1f8f4]"
                  >
                    <Settings className="h-4 w-4" /> Settings
                  </button>
                  <button
                    type="button"
                    onClick={signOut}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left font-sans text-[0.82rem] font-semibold text-[#b2432c] hover:bg-[#fdf2ed]"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1280px] px-5 pb-16 pt-6 sm:px-8">
          {tab === "overview" && <OverviewSection onOpen={(next) => setTab(next as TabKey)} />}
          {tab === "registrations" && <RegistrationsSection />}
          {tab === "demo" && <DemosSection />}
          {tab === "leads" && <LeadsSection />}
          {tab === "users" && <UsersSection />}
          {tab === "courses" && <CoursesSection />}
          {tab === "classes" && <ClassesSection />}
          {tab === "testimonials" && <TestimonialsSection />}
          {tab === "student-reviews" && <StudentReviewsSection />}
          {tab === "blog" && <BlogSection />}
          {tab === "feedback" && <FeedbackSection />}
          {tab === "security" && <SecuritySection />}
          {tab === "settings" && <SettingsSection />}
        </main>
      </div>
    </div>
  );
}
