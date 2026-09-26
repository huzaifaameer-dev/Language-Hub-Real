"use client";

import { useEffect, useState } from "react";
import { BellRing, CalendarClock, FileCheck2, FolderKanban, GraduationCap, Inbox, MessageSquareText, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MgUserLite } from "./types";
import { CsvButton, EmptyState, SkeletonRows, Spinner, StatusBadge, fmtWhen } from "./ui";

interface Kpis {
  role: "ADMIN" | "TEACHER" | "STUDENT";
  groups: number;
  students: number;
  teachers: number;
  assignments: number;
  openAssignments: number;
  dueToday: number;
  overdue: number;
  messages: number;
  messagesSent: number;
  scheduledMessages: number;
  attendanceToday: number;
}

function useReports() {
  const [k, setK] = useState<Kpis | null>(null);
  const [busy, setBusy] = useState(true);
  const load = () => {
    setBusy(true);
    fetch("/api/management/reports")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setK((d as Kpis) ?? null))
      .catch(() => setK(null))
      .finally(() => setBusy(false));
  };
  useEffect(() => {
    queueMicrotask(() => load());
  }, []);
  return { k, busy, load };
}

function Stat({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent: string }) {
  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-18px_rgb(37_99_235/0.4)]">
      <div className="flex items-start justify-between gap-2">
        <p className="font-display text-[1.7rem] font-extrabold leading-none tracking-tight text-slate-900">{value}</p>
        <span className={cn("grid h-9 w-9 place-items-center rounded-xl", accent)}>{icon}</span>
      </div>
      <p className="mt-2.5 font-display text-[0.64rem] font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
    </div>
  );
}

function MiniChart({ label, pct }: { label: string; pct: number }) {
  const p = Math.min(100, Math.max(0, pct));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[0.7rem]">
        <span className="font-display font-bold text-slate-600">{label}</span>
        <span className="font-mono text-[0.62rem] font-bold text-indigo-600">{p}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#6D4AFF] transition-all duration-700" style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

export function DashboardsView({ user }: { user: MgUserLite }) {
  const { k, busy, load } = useReports();
  const first = user.name.split(" ")[0];

  if (busy && !k) {
    return (
      <div className="flex flex-col gap-5">
        <SkeletonRows rows={2} cols={4} />
        <SkeletonRows rows={1} cols={2} />
      </div>
    );
  }
  if (!k) return <EmptyState title="No data yet" hint="Reports will appear here as you add groups, assignments and attendance." />;

  const bars: Array<[string, number]> = k.assignments
    ? [
        ["Open", Math.round((k.openAssignments / Math.max(1, k.assignments)) * 100)],
        ["Due today", Math.round((k.dueToday / Math.max(1, k.assignments)) * 100)],
        ["Overdue", Math.round((k.overdue / Math.max(1, k.assignments)) * 100)],
      ]
    : [];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.3em] text-[#1647C7]">Overview</p>
          <h2 className="mt-1 font-display text-[1.6rem] font-extrabold tracking-tight text-slate-900">Salam, {first} 👋</h2>
          <p className="mt-0.5 text-[0.9rem] text-slate-500">Here is what is happening across your management system.</p>
        </div>
        <button type="button" onClick={load} className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-[0.75rem] font-bold text-slate-600 hover:border-indigo-400 hover:text-[#1647C7]">
          <Spinner className={cn("h-3.5 w-3.5", !busy && "hidden")} /> Refresh
        </button>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Groups" value={k.groups} accent="bg-indigo-50 text-[#1647C7]" icon={<FolderKanban className="h-4 w-4" />} />
        <Stat label={user.role === "ADMIN" ? "Students" : "My students"} value={k.students} accent="bg-emerald-50 text-emerald-600" icon={<GraduationCap className="h-4 w-4" />} />
        <Stat label="Assignments" value={k.assignments} accent="bg-violet-50 text-violet-600" icon={<FileCheck2 className="h-4 w-4" />} />
        <Stat label="Messages sent" value={k.messagesSent} accent="bg-amber-50 text-amber-600" icon={<MessageSquareText className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 backdrop-blur">
          <h3 className="font-display text-[0.95rem] font-extrabold text-slate-900">Assignments health</h3>
          {bars.length ? (
            <div className="mt-4 flex flex-col gap-4">
              {bars.map(([label, pct]) => <MiniChart key={label} label={label} pct={pct} />)}
              <div className="mt-1 flex flex-wrap gap-2">
                <StatusBadge status="OPEN" />
                <span className="font-mono text-[0.6rem] uppercase tracking-widest text-slate-400">{k.overdue > 0 ? `${k.overdue} overdue — follow up!` : "Everything on track ✨"}</span>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-[0.85rem] text-slate-400">Publish an assignment to see its health here.</p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 backdrop-blur">
          <h3 className="flex items-center gap-2 font-display text-[0.95rem] font-extrabold text-slate-900">
            <BellRing className="h-4 w-4 text-[#1647C7]" /> What needs attention
          </h3>
          <ul className="mt-3 flex flex-col gap-2.5 text-[0.85rem]">
            <AttentionRow icon={<Users className="h-4 w-4" />} text={`${k.students} ${k.students === 1 ? "student" : "students"} across ${k.groups} ${k.groups === 1 ? "group" : "groups"}`} />
            <AttentionRow icon={<CalendarClock className="h-4 w-4" />} text={k.dueToday ? `${k.dueToday} assignment${k.dueToday === 1 ? "" : "s"} due today` : "No assignments due today"} wink={!k.dueToday} />
            <AttentionRow icon={<Inbox className="h-4 w-4" />} text={k.scheduledMessages ? `${k.scheduledMessages} scheduled WhatsApp message${k.scheduledMessages === 1 ? "" : "s"} waiting` : "No scheduled messages"} />
            <AttentionRow icon={<MessageSquareText className="h-4 w-4" />} text={`${k.attendanceToday} attendance sheet${k.attendanceToday === 1 ? "" : "s"} marked today`} />
          </ul>
        </section>
      </div>
    </div>
  );
}

function AttentionRow({ icon, text, wink }: { icon: React.ReactNode; text: string; wink?: boolean }) {
  return (
    <li className="flex items-center gap-2.5 text-slate-600">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-[#1647C7]">{icon}</span>
      {text} {wink ? <span aria-hidden>✅</span> : null}
    </li>
  );
}

export function ReportsView({ user }: { user: MgUserLite }) {
  const { k, busy, load } = useReports();

  if (busy && !k) return <SkeletonRows rows={3} cols={4} />;
  if (!k) return <EmptyState title="No report data yet" />;

  const rows: (string | number)[][] = user.role === "ADMIN"
    ? [
        ["Active groups", k.groups],
        ["Active students", k.students],
        ["Active teachers", k.teachers],
        ["Assignments (non-draft)", k.assignments],
        ["Open assignments", k.openAssignments],
        ["Due today", k.dueToday],
        ["Overdue", k.overdue],
        ["Total messages", k.messages],
        ["Messages sent", k.messagesSent],
        ["Scheduled messages", k.scheduledMessages],
        ["Attendance sheets today", k.attendanceToday],
      ]
    : [
        ["My groups", k.groups],
        ["My students", k.students],
        ["Assignments", k.assignments],
        ["Open assignments", k.openAssignments],
        ["Due today", k.dueToday],
        ["Messages sent", k.messagesSent],
        ["Scheduled messages", k.scheduledMessages],
      ];

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.3em] text-[#1647C7]">Reports</p>
          <h2 className="mt-1 font-display text-[1.6rem] font-extrabold tracking-tight text-slate-900">Performance report</h2>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={load} className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-[0.75rem] font-bold text-slate-600 hover:border-indigo-400">
            <Spinner className={cn("h-3.5 w-3.5", !busy && "hidden")} /> Refresh
          </button>
          <CsvButton filename={`management-report-${new Date().toISOString().slice(0, 10)}.csv`} headers={["Metric", "Value"]} rows={rows} />
        </div>
      </header>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 font-mono text-[0.62rem] uppercase tracking-widest text-slate-400">
              <th className="px-5 py-3 text-start">Metric</th>
              <th className="px-5 py-3 text-end">Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label as string} className="border-b border-slate-50 last:border-0">
                <td className="px-5 py-3 font-display text-[0.86rem] font-bold text-slate-700">{label}</td>
                <td className="px-5 py-3 text-end font-mono text-[0.82rem] font-black text-[#1647C7]">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="font-mono text-[0.62rem] uppercase tracking-widest text-slate-400">Generated {fmtWhen(new Date().toISOString())} · scope: {k.role}</p>
    </div>
  );
}