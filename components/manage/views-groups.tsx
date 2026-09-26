"use client";

import { useEffect, useState } from "react";
import { Archive, ArchiveRestore, FolderKanban, GraduationCap, Pencil, Plus, UserRound, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState, MgButton, Modal, SkeletonRows, StatusBadge, Toasts, useToasts, fmtDay } from "./ui";

interface Group {
  id: string;
  name: string;
  courseName: string | null;
  teacherIds: string[];
  studentIds: string[];
  schedule: string | null;
  notes: string | null;
  status: "ACTIVE" | "ARCHIVED";
  createdAt: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isTeacher: boolean;
  isStudent: boolean;
}

interface StudentOpt {
  id: string;
  name: string;
  email: string;
}

async function j(res: Response) {
  const d = await res.json().catch(() => ({}));
  return { ok: res.ok, d };
}

export function GroupsView() {
  const [rows, setRows] = useState<Group[]>([]);
  const [students, setStudents] = useState<StudentOpt[]>([]);
  const [teachers, setTeachers] = useState<Array<{ id: string; userId: string; name: string }>>([]);
  const [busy, setBusy] = useState(true);
  const [creating, setCreating] = useState(false);
  const [manage, setManage] = useState<{ g: Group; members: Member[] } | null>(null);
  const [form, setForm] = useState({ name: "", schedule: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [addingStudents, setAddingStudents] = useState(false);
  const [pickStudents, setPickStudents] = useState<string[]>([]);
  const [teacherPick, setTeacherPick] = useState("");
  const { items, push } = useToasts();

  const load = () => {
    setBusy(true);
    fetch("/api/management/groups")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setRows((d?.groups ?? []) as Group[]))
      .catch(() => setRows([]))
      .finally(() => setBusy(false));
    fetch("/api/management/students?status=active").then((r) => (r.ok ? r.json() : null)).then((d) => setStudents((d?.students ?? []).map((s: { id: string; name: string; email: string }) => ({ id: s.id, name: s.name, email: s.email })) as StudentOpt[]));
    fetch("/api/management/teachers").then((r) => (r.ok ? r.json() : null)).then((d) => setTeachers((d?.teachers ?? []).map((t: { id: string; userId: string; name: string }) => ({ id: t.id, userId: t.userId, name: t.name })) as { id: string; userId: string; name: string }[]));
  };
  useEffect(() => {
    queueMicrotask(() => load());
  }, []);

  const create = async () => {
    setSaving(true);
    const res = await fetch("/api/management/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, schedule: form.schedule || null, notes: form.notes || null, teacherIds: [], studentIds: [] }),
    });
    const { d } = await j(res);
    setSaving(false);
    if (res.ok) {
      push(`Group "${form.name}" created`);
      setCreating(false);
      setForm({ name: "", schedule: "", notes: "" });
      load();
    } else push(d.message ?? "Could not create group.", "err");
  };

  const openManage = async (g: Group) => {
    const res = await fetch(`/api/management/groups/${g.id}`);
    const { d } = await j(res);
    if (res.ok) setManage({ g, members: d.members ?? [] });
    else push(d.message ?? "Could not load group.", "err");
  };

  const patchGroup = async (g: Group, body: Record<string, unknown>, okMsg: string) => {
    const res = await fetch(`/api/management/groups/${g.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      push(okMsg);
      setManage(null);
      load();
    } else {
      const d = await res.json().catch(() => ({}));
      push(d.message ?? "Action failed.", "err");
    }
  };

  const groupName = (id: string, dflt: string) => {
    const g = rows.find((r) => r.id === id);
    return g ? g.name : dflt;
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.3em] text-[#1647C7]">Batches</p>
          <h2 className="mt-1 font-display text-[1.6rem] font-extrabold tracking-tight text-slate-900">Groups</h2>
        </div>
        <MgButton onClick={() => { setForm({ name: "", schedule: "", notes: "" }); setCreating(true); }}>
          <Plus className="h-4 w-4" /> New group
        </MgButton>
      </header>

      {busy ? (
        <SkeletonRows rows={4} cols={3} />
      ) : rows.length === 0 ? (
        <EmptyState title="No groups yet" hint="Create a batch like “Spoken English Morning” and assign students + teachers." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((g) => (
            <div key={g.id} className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 backdrop-blur transition-all hover:shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <FolderKanban className="h-4 w-4 shrink-0 text-[#1647C7]" />
                    <p className="font-display text-[0.98rem] font-extrabold text-slate-900">{g.name}</p>
                  </div>
                  {g.courseName ? <p className="mt-0.5 font-mono text-[0.62rem] text-slate-400">{g.courseName}</p> : null}
                  <div className="mt-2 flex flex-wrap gap-2 font-mono text-[0.62rem] font-bold text-slate-500">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-emerald-700"><UserRound className="h-3 w-3" /> {g.studentIds.length} students</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-violet-700"><GraduationCap className="h-3 w-3" /> {g.teacherIds.length} teachers</span>
                  </div>
                  {g.schedule ? <p className="mt-1.5 font-mono text-[0.6rem] text-slate-400">🕐 {g.schedule}</p> : null}
                </div>
                <StatusBadge status={g.status} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                <MgButton tone="ghost" className="h-9 px-3 text-[0.72rem]" onClick={() => void openManage(g)}><Pencil className="h-3.5 w-3.5" /> Manage</MgButton>
                {g.status === "ACTIVE" ? (
                  <MgButton tone="ghost" className="h-9 px-3 text-[0.72rem]" onClick={() => void patchGroup(g, { action: "archive" }, `Archived ${g.name}`)}>
                    <Archive className="h-3.5 w-3.5" /> Archive
                  </MgButton>
                ) : (
                  <MgButton tone="ghost" className="h-9 px-3 text-[0.72rem]" onClick={() => void patchGroup(g, { action: "restore" }, `Restored ${g.name}`)}>
                    <ArchiveRestore className="h-3.5 w-3.5" /> Restore
                  </MgButton>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="New group">
        <div className="grid gap-3">
          <label className="grid gap-1 text-[0.78rem] font-bold text-slate-600">
            Group name
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. IELTS Batch A" />
          </label>
          <label className="grid gap-1 text-[0.78rem] font-bold text-slate-600">
            Schedule
            <input className={inputCls} value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder="e.g. Tue · Thu · Sat, 6–7 PM" />
          </label>
          <label className="grid gap-1 text-[0.78rem] font-bold text-slate-600">
            Notes
            <textarea className={cn(inputCls, "resize-none")} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </label>
          <div className="mt-2 flex justify-end gap-2">
            <MgButton tone="ghost" onClick={() => setCreating(false)}>Cancel</MgButton>
            <MgButton onClick={() => void create()} disabled={saving || form.name.trim().length < 2}>Create group</MgButton>
          </div>
        </div>
      </Modal>

      <Modal open={!!manage} onClose={() => setManage(null)} title={manage?.g.name ?? ""} wide>
        {manage ? (
          <div className="grid gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={manage.g.status} />
              <span className="font-mono text-[0.62rem] text-slate-400">created {fmtDay(manage.g.createdAt)}</span>
              <div className="ml-auto flex gap-2">
                <MgButton tone="ghost" className="h-9 px-3 text-[0.72rem]" onClick={() => { setAddingStudents((v) => !v); setPickStudents([]); }}><Users className="h-3.5 w-3.5" /> Manage students</MgButton>
              </div>
            </div>

            {addingStudents ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="mb-3 flex items-center gap-2 text-[0.82rem] font-bold text-slate-700"><Users className="h-4 w-4 text-[#1647C7]" /> Add students to {manage.g.name}</p>
                <div className="grid max-h-56 gap-1.5 overflow-y-auto sm:grid-cols-2">
                  {students.map((s) => {
                    const on = pickStudents.includes(s.id);
                    const already = manage.members.some((m) => m.isStudent && m.id === s.id);
                    return (
                      <label key={s.id} className={cn("flex cursor-pointer items-center gap-2 rounded-xl border bg-white px-3 py-2 text-[0.8rem] transition-all", already ? "opacity-45" : on ? "border-indigo-300 bg-indigo-50" : "border-slate-200 hover:border-indigo-200")}>
                        <input type="checkbox" disabled={already} checked={on || already} onChange={() => setPickStudents((p) => (on ? p.filter((x) => x !== s.id) : [...p, s.id]))} className="h-4 w-4 accent-[#2563EB]" />
                        <span className="font-display font-bold text-slate-700">{s.name}</span>
                        {already ? <X className="ml-auto h-3.5 w-3.5 text-emerald-600" /> : null}
                      </label>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <MgButton
                    className="h-9 px-3 text-[0.72rem]"
                    disabled={pickStudents.length === 0}
                    onClick={() => {
                      const toRemove = pickStudents;
                      void patchGroup(manage.g, { action: "addStudents", studentIds: toRemove }, `${toRemove.length} student(s) added`);
                    }}
                  >
                    Add selected
                  </MgButton>
                  <MgButton
                    tone="ghost"
                    className="h-9 px-3 text-[0.72rem]"
                    disabled={pickStudents.length === 0}
                    onClick={() => {
                      const toRemove = pickStudents;
                      void patchGroup(manage.g, { action: "removeStudents", studentIds: toRemove }, `${toRemove.length} student(s) removed`);
                    }}
                  >
                    Remove selected
                  </MgButton>
                </div>
              </div>
            ) : null}

            <div className="grid gap-2">
              <p className="text-[0.82rem] font-bold text-slate-700">Assign teacher</p>
              <div className="flex flex-wrap gap-2">
                <select value={teacherPick} onChange={(e) => setTeacherPick(e.target.value)} className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-[0.82rem] outline-none focus:border-indigo-400">
                  <option value="">Choose a teacher…</option>
                  {teachers.map((t) => (
                    <option key={t.userId} value={t.userId}>{t.name}</option>
                  ))}
                </select>
                <MgButton className="h-10 px-4 text-[0.78rem]" disabled={!teacherPick} onClick={() => void patchGroup(manage.g, { action: "assignTeacher", teacherId: teacherPick }, "Teacher assigned")}>
                  Assign
                </MgButton>
              </div>
              <p className="mt-2 flex flex-wrap gap-1.5">
                {manage.g.teacherIds.length === 0 ? <span className="font-mono text-[0.62rem] text-slate-400">No teacher assigned yet.</span> : null}
                {manage.g.teacherIds.map((tid) => (
                  <span key={tid} className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 font-mono text-[0.62rem] font-bold text-violet-700">
                    {teachers.find((t) => t.userId === tid)?.name ?? groupName(tid, "Teacher")}
                  </span>
                ))}
              </p>
            </div>

            <div>
              <p className="text-[0.82rem] font-bold text-slate-700">Members ({manage.members.length})</p>
              <ul className="mt-2 grid max-h-64 gap-1.5 overflow-y-auto sm:grid-cols-2">
                {manage.members.map((m) => (
                  <li key={m.id} className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2">
                    <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg font-display text-[0.72rem] font-black text-white", m.isTeacher ? "bg-violet-500" : "bg-gradient-to-br from-[#2563EB] to-[#6D4AFF]")}>
                      {(m.name || "?").slice(0, 1)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-display text-[0.8rem] font-bold text-slate-700">{m.name}</p>
                      <p className="truncate font-mono text-[0.58rem] text-slate-400">{m.isTeacher ? "Teacher" : "Student"}</p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${m.name}`}
                      onClick={() => {
                        if (!window.confirm(`Remove ${m.name} from ${manage.g.name}?`)) return;
                        void patchGroup(manage.g, { action: m.isTeacher ? "assignTeacher" : "removeStudents", studentIds: m.isStudent ? [m.id] : [], teacherId: m.isTeacher ? "" : null }, `Removed ${m.name}`);
                      }}
                      className="ml-auto grid h-7 w-7 place-items-center rounded-full text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </Modal>
      <Toasts items={items} onClose={() => {}} />
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[0.85rem] outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100";