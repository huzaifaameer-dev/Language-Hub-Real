"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GroupLite, MgUserLite } from "./types";
import { EmptyState, MgButton, SkeletonRows, Toasts, useToasts, fmtDay } from "./ui";

const STATUSES = ["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const;
type St = (typeof STATUSES)[number];

interface MemberRow {
  studentId: string;
  name: string;
  status: St;
}

interface AttendanceData {
  date: string;
  groupName: string | null;
  records: MemberRow[];
  history: Array<{ date: string; pct: number; present: number }>;
  studentTotal: number;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function AttendanceView({ user }: { user: MgUserLite }) {
  const [groups, setGroups] = useState<GroupLite[]>([]);
  const [group, setGroup] = useState("");
  const [date, setDate] = useState(todayStr());
  const [data, setData] = useState<AttendanceData | null>(null);
  const [roster, setRoster] = useState<MemberRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const { items, push } = useToasts();

  const loadGroups = () => {
    fetch("/api/management/groups").then((r) => (r.ok ? r.json() : null)).then((d) => setGroups((d?.groups ?? []).filter((g: GroupLite) => g.studentCount > 0) as GroupLite[]));
  };
  useEffect(loadGroups, []);

  const load = (g: string, d: string) => {
    setBusy(true);
    fetch(`/api/management/attendance?group=${g}&date=${d}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(async (x) => {
        setData((x as AttendanceData) ?? null);
        if (!x) return;
        const d2 = x as AttendanceData;
        const res = await fetch(`/api/management/groups/${g}`).catch(() => null);
        const gd = res && res.ok ? await res.json().catch(() => null) : null;
        const members = (gd?.members ?? []).filter((m: { isStudent: boolean }) => m.isStudent).map((m: { id: string; name: string }) => ({ studentId: m.id, name: m.name }) as MemberRow);
        const saved = new Map((d2.records ?? []).map((r: MemberRow) => [r.studentId, r.status]));
        setRoster(members.map((m: MemberRow) => ({ ...m, status: saved.get(m.studentId) ?? "PRESENT" })));
      })
      .catch(() => setData(null))
      .finally(() => setBusy(false));
  };

  const setStatus = (studentId: string, status: St) => {
    setRoster((r) => r.map((m) => (m.studentId === studentId ? { ...m, status } : m)));
  };

  const save = async () => {
    if (!group) return;
    setSaving(true);
    const res = await fetch("/api/management/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: group, date, records: roster }),
    });
    setSaving(false);
    if (res.ok) {
      push(`Attendance marked for ${data?.groupName ?? "group"}`);
      load(group, date);
    } else {
      const d = await res.json().catch(() => ({}));
      push(d.message ?? "Could not save attendance.", "err");
    }
  };

  const pct = roster.length ? Math.round(((roster.filter((r) => r.status === "PRESENT" || r.status === "LATE").length) / roster.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.3em] text-[#1647C7]">Track</p>
          <h2 className="mt-1 font-display text-[1.6rem] font-extrabold tracking-tight text-slate-900">Attendance</h2>
          <p className="mt-0.5 text-[0.82rem] text-slate-500">Marked by {user.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={group} onChange={(e) => { setGroup(e.target.value); if (e.target.value) load(e.target.value, date); }} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[0.82rem] outline-none focus:border-indigo-400">
            <option value="">Choose a group…</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <input type="date" value={date} onChange={(e) => { setDate(e.target.value); if (group) load(group, e.target.value); }} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[0.82rem] outline-none focus:border-indigo-400" />
        </div>
      </header>

      {!group ? (
        <EmptyState title="Pick a group to mark attendance" hint="Choose a group and date, then tap each student's status." />
      ) : busy ? (
        <SkeletonRows rows={4} cols={3} />
      ) : data && roster.length ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-[#1647C7]"><CalendarCheck className="h-4.5 w-4.5" /></span>
              <div>
                <p className="font-display text-[0.95rem] font-extrabold text-slate-900">{data.groupName} · {fmtDay(date)}</p>
                <p className="font-mono text-[0.62rem] text-slate-400">{roster.length} students · {pct}% present</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100 sm:w-40">
                <div className={cn("h-full rounded-full transition-all duration-500", pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-rose-500")} style={{ width: `${pct}%` }} />
              </div>
              <MgButton onClick={() => void save()} disabled={saving || roster.length === 0}>
                <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save attendance"}
              </MgButton>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur">
            <div className="grid gap-1 p-2">
              {roster.map((m) => (
                <div key={m.studentId} className="flex flex-wrap items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-slate-50">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#2563EB] to-[#6D4AFF] font-display text-[0.72rem] font-black text-white">
                    {(m.name || "?").slice(0, 1)}
                  </span>
                  <p className="flex-1 font-display text-[0.88rem] font-bold text-slate-800">{m.name}</p>
                  <div className="flex gap-1.5">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(m.studentId, s)}
                        className={cn(
                          "rounded-full border px-2.5 py-1 font-mono text-[0.6rem] font-bold tracking-widest transition-all",
                          m.status === s
                            ? s === "PRESENT" || s === "LATE"
                              ? "border-emerald-400 bg-emerald-500 text-white"
                              : s === "ABSENT"
                                ? "border-rose-400 bg-rose-500 text-white"
                                : "border-slate-400 bg-slate-500 text-white"
                            : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <section>
            <h3 className="mb-2 font-display text-[0.9rem] font-extrabold text-slate-800">Recent history</h3>
            <div className="flex flex-col gap-2">
              {data.history.map((h) => (
                <div key={h.date} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white/70 px-4 py-2.5">
                  <span className="font-mono text-[0.66rem] text-slate-500">{fmtDay(h.date)}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div className={cn("h-full rounded-full", h.pct >= 70 ? "bg-emerald-500" : h.pct >= 40 ? "bg-amber-500" : "bg-rose-500")} style={{ width: `${h.pct}%` }} />
                  </div>
                  <span className="font-mono text-[0.66rem] font-bold text-slate-600">{h.pct}% · {h.present} present</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <EmptyState title="No roster for this group" hint="Add students to this group first." />
      )}
      <Toasts items={items} onClose={() => {}} />
    </div>
  );
}