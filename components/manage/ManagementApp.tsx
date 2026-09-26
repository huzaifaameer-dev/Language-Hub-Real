"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  BookOpen,
  CalendarCheck,
  CalendarClock,
  FileText,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  NotebookPen,
  Menu as MenuIcon,
  Sparkles,
  Users,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { useBodyScrollLock } from "@/lib/hooks";
import { AssignmentsView, AttendanceView, CommunicationView, CoursesView, DashboardsView, GroupsView, MaterialsView, NotificationsView, ReportsView, ScheduledView, StudentsView, SubmissionsView, TeachersView, TemplatesView } from "./views";

export type MgTab =
  | "dashboard"
  | "students"
  | "teachers"
  | "groups"
  | "courses"
  | "assignments"
  | "submissions"
  | "attendance"
  | "materials"
  | "communication"
  | "scheduled"
  | "templates"
  | "reports"
  | "notifications";

interface Me {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: "ADMIN" | "TEACHER" | "STUDENT";
}

const ease = [0.16, 1, 0.3, 1] as const;

export function ManagementApp() {
  const [me, setMe] = useState<Me | null>(null);
  const [groups, setGroups] = useState<Array<{ id: string; name: string; studentCount: number }>>([]);
  const [tab, setTab] = useState<MgTab>(
    (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("tab") : null) as MgTab | null ?? "dashboard"
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useBodyScrollLock(menuOpen);

  useEffect(() => {
    fetch("/api/management/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setMe(d.me);
          setGroups(d.groups ?? []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F5F7FF]">
        <div className="flex flex-col items-center gap-3">
          <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
            <Logo size="xs" eager className="h-8 w-8 rounded-lg object-contain" />
          </span>
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-slate-400">Loading management…</p>
        </div>
      </div>
    );
  }

  if (!me || me.role === "STUDENT") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F5F7FF] px-6">
        <div className="max-w-sm rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg">
          <p className="font-display text-lg font-extrabold text-slate-900">No access</p>
          <p className="mt-2 text-sm text-slate-500">This area is for admins and teachers only.</p>
          <Link href="/dashboard" className="mt-5 inline-flex h-10 items-center rounded-full bg-[#2563EB] px-5 text-sm font-bold text-white">
            Go to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isAdmin = me.role === "ADMIN";

  const NAV: Array<{ key: MgTab; label: string; icon: typeof Users; adminOnly?: boolean; teacherOnly?: boolean }> = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "students", label: "Students", icon: Users, adminOnly: true },
    { key: "teachers", label: "Teachers", icon: UserRound, adminOnly: true },
    { key: "groups", label: "Groups / Batches", icon: FolderKanban, adminOnly: true },
    { key: "courses", label: "Courses", icon: BookOpen, adminOnly: true },
    { key: "assignments", label: "Assignments", icon: FileText },
    { key: "submissions", label: "Submissions", icon: Inbox },
    { key: "attendance", label: "Attendance", icon: CalendarCheck },
    { key: "materials", label: "Materials", icon: NotebookPen },
    { key: "communication", label: "Communication", icon: MessageSquareText },
    { key: "templates", label: "Templates", icon: MessageSquareText },
    { key: "scheduled", label: "Scheduled", icon: CalendarClock },
    { key: "reports", label: "Reports", icon: Sparkles },
    { key: "notifications", label: "Notifications", icon: Bell },
  ];
  const visible = NAV.filter((n) => (n.adminOnly ? isAdmin : true));

  const go = (key: MgTab) => {
    setTab(key);
    setMenuOpen(false);
    router.replace(`?tab=${key}`, { scroll: false });
  };

  return (
    <div className="relative min-h-screen bg-[#F5F7FF] text-[#0B1B3A] lg:pl-64">
      {/* ambient glow */}
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-indigo-50/80 to-transparent" />

      {/* sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200/80 bg-white/90 backdrop-blur-xl lg:flex">
        <SidebarHeader role={me.role} />
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {visible.map((n) => {
            const Icon = n.icon;
            const active = tab === n.key;
            return (
              <button
                key={n.key}
                type="button"
                onClick={() => go(n.key)}
                className={cn(
                  "mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start font-display text-[0.86rem] font-bold transition-all",
                  active
                    ? "bg-gradient-to-r from-[#2563EB] to-[#6D4AFF] text-white shadow-[0_12px_26px_-12px_rgb(99_102_241/0.8)]"
                    : "text-slate-600 hover:bg-indigo-50/70 hover:text-[#1647C7]"
                )}
              >
                <Icon className="h-[1.15rem] w-[1.15rem]" strokeWidth={2} />
                {n.label}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-display text-[0.84rem] font-bold text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-[#2563EB] to-[#6D4AFF]">
            <Logo size="xs" eager className="h-6 w-6 rounded-lg object-contain" />
          </span>
          <div className="leading-tight">
            <p className="font-display text-[0.85rem] font-extrabold">Management</p>
            <p className="font-mono text-[0.52rem] uppercase tracking-widest text-slate-400">{me.role}</p>
          </div>
        </div>
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
      </header>

      {/* mobile drawer */}
      {menuOpen ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={() => setMenuOpen(false)}>
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="fixed inset-y-0 left-0 flex w-72 flex-col bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-4">
              <SidebarHeader role={me.role} />
              <button type="button" aria-label="Close" onClick={() => setMenuOpen(false)} className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-500">
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 pb-4">
              {visible.map((n) => {
                const Icon = n.icon;
                const active = tab === n.key;
                return (
                  <button
                    key={n.key}
                    type="button"
                    onClick={() => go(n.key)}
                    className={cn(
                      "mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start font-display text-[0.86rem] font-bold",
                      active ? "bg-gradient-to-r from-[#2563EB] to-[#6D4AFF] text-white" : "text-slate-600 hover:bg-indigo-50/70"
                    )}
                  >
                    <Icon className="h-4.5 w-4.5" /> {n.label}
                  </button>
                );
              })}
            </nav>
          </motion.div>
        </motion.div>
      ) : null}

      <main className="mx-auto w-full max-w-[1200px] px-4 pb-24 pt-6 lg:px-8 lg:pt-8">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, ease }}>
          {tab === "dashboard" ? <DashboardsView user={me} /> : null}
          {tab === "students" && isAdmin ? <StudentsView /> : null}
          {tab === "teachers" && isAdmin ? <TeachersView groups={groups} /> : null}
          {tab === "groups" && isAdmin ? <GroupsView /> : null}
          {tab === "courses" && isAdmin ? <CoursesView /> : null}
          {tab === "assignments" ? <AssignmentsView user={me} /> : null}
          {tab === "submissions" ? <SubmissionsView user={me} /> : null}
          {tab === "attendance" ? <AttendanceView user={me} /> : null}
          {tab === "materials" ? <MaterialsView user={me} /> : null}
          {tab === "communication" ? <CommunicationView user={me} /> : null}
          {tab === "templates" ? <TemplatesView /> : null}
          {tab === "scheduled" ? <ScheduledView user={me} /> : null}
          {tab === "reports" ? <ReportsView user={me} /> : null}
          {tab === "notifications" ? <NotificationsView user={me} /> : null}
        </motion.div>
      </main>
    </div>
  );
}

function SidebarHeader({ role }: { role: string }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-4">
      <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-[#2563EB] to-[#6D4AFF]">
        <Logo size="xs" eager className="h-7 w-7 rounded-lg object-contain" />
      </span>
      <div className="leading-tight">
        <p className="font-display text-[0.95rem] font-extrabold tracking-tight">Management</p>
        <p className="font-mono text-[0.5rem] font-bold uppercase tracking-[0.24em] text-slate-400">
          {role === "ADMIN" ? "Dashboard" : "Teacher"}
        </p>
      </div>
    </div>
  );
}