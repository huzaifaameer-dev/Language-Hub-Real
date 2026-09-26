"use client";

import { useEffect, useState } from "react";
import { GraduationCap, Plus, UserRound, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GroupLite } from "./types";
import { CsvButton, EmptyState, MgButton, Modal, SkeletonRows, StatusBadge, Toasts, useToasts, fmtDay } from "./ui";

interface Teacher {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  courseIds: string[];
  active: boolean;
  createdAt: string;
}

async function j(res: Response) {
  const d = await res.json().catch(() => ({}));
  return { ok: res.ok, d };
}

export function TeachersView({ groups }: { groups: GroupLite[] }) {
  const [rows, setRows] = useState<Teacher[]>([]);
  const [busy, setBusy] = useState(true);
  const [creating, setCreating] = useState(false);
  const [assign, setAssign] = useState<Teacher | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [pick, setPick] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const { items, push } = useToasts();

  const load = () => {
    setBusy(true);
    fetch("/api/management/teachers")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setRows((d?.teachers ?? []) as Teacher[]))
      .catch(() => setRows([]))
      .finally(() => setBusy(false));
  };
  useEffect(() => {
    queueMicrotask(() => load());
  }, []);

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/management/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email, name: form.name, phone: form.phone || null, courseIds: [] }),
    });
    const { d } = await j(res);
    setSaving(false);
    if (res.ok) {
      push(`Teacher added — ${form.email}`);
      setCreating(false);
      setForm({ name: "", email: "", phone: "" });
      load();
    } else push(d.message ?? "Could not add teacher.", "err");
  };

  const toggle = async (t: Teacher) => {
    const res = await fetch(`/api/management/teachers/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !t.active }),
    });
    if (res.ok) {
      push(t.active ? `${t.name} deactivated` : `${t.name} reactivated`);
      load();
    } else push("Could not update teacher.", "err");
  };

  const remove = async (t: Teacher) => {
    if (!window.confirm(`Remove ${t.name} from teaching? The account stays, but loses TEACHER role.`)) return;
    const res = await fetch(`/api/management/teachers/${t.id}`, { method: "DELETE" });
    if (res.ok) {
      push(`Removed ${t.name}`);
      load();
    } else push("Could not remove teacher.", "err");
  };

  const saveAssign = async () => {
    if (!assign) return;
    setSaving(true);
    const res = await fetch("/api/management/teachers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherUserId: assign.userId, groupIds: pick }),
    });
    const { d } = await j(res);
    setSaving(false);
    if (res.ok) {
      push(`Groups assigned to ${assign.name}`);
      setAssign(null);
    } else push(d.message ?? "Could not assign groups.", "err");
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.3em] text-[#1647C7]">People</p>
          <h2 className="mt-1 font-display text-[1.6rem] font-extrabold tracking-tight text-slate-900">Teachers</h2>
        </div>
        <MgButton onClick={() => { setForm({ name: "", email: "", phone: "" }); setCreating(true); }}>
          <Plus className="h-4 w-4" /> Add teacher
        </MgButton>
      </header>

      {busy ? (
        <SkeletonRows rows={4} cols={3} />
      ) : rows.length === 0 ? (
        <EmptyState title="No teachers yet" hint="Invite a teacher by email — they get a TEACHER account and can manage their own groups." />
      ) : (
        <div className="flex flex-col gap-3">
          <CsvButton filename="teachers.csv" headers={["Name", "Email", "Phone", "Groups (depends)", "Status", "Added"]} rows={rows.map((t) => [t.name, t.email, t.phone ?? "", "", t.active ? "Active" : "Inactive", t.createdAt])} label="Export" />
          {rows.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4 backdrop-blur">
              <span className={cn("grid h-11 w-11 place-items-center rounded-xl font-display font-black text-white", t.active ? "bg-gradient-to-br from-[#2563EB] to-[#6D4AFF]" : "bg-slate-300")}>
                {(t.name || "?").slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-[0.95rem] font-extrabold text-slate-900">{t.name}</p>
                  <StatusBadge status={t.active ? "ACTIVE" : "ARCHIVED"} />
                </div>
                <p className="mt-0.5 font-mono text-[0.66rem] text-slate-400">{t.email}{t.phone ? ` · ${t.phone}` : ""} · added {fmtDay(t.createdAt)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <MgButton tone="ghost" className="h-9 px-3 text-[0.72rem]" onClick={() => { setAssign(t); setPick([]); }}>
                  <Users className="h-3.5 w-3.5" /> Assign groups
                </MgButton>
                <MgButton tone="ghost" className="h-9 px-3 text-[0.72rem]" onClick={() => toggle(t)}>{t.active ? "Deactivate" : "Activate"}</MgButton>
                <MgButton tone="rose" className="h-9 px-3 text-[0.72rem]" onClick={() => remove(t)}>Remove</MgButton>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Add teacher">
        <div className="grid gap-3">
          <label className="grid gap-1 text-[0.78rem] font-bold text-slate-600">
            Full name
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ali Raza" />
          </label>
          <label className="grid gap-1 text-[0.78rem] font-bold text-slate-600">
            Email
            <input className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="teacher@example.com" />
          </label>
          <label className="grid gap-1 text-[0.78rem] font-bold text-slate-600">
            WhatsApp / phone
            <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+92 300 0000000" />
          </label>
          <div className="mt-2 flex justify-end gap-2">
            <MgButton tone="ghost" onClick={() => setCreating(false)}>Cancel</MgButton>
            <MgButton onClick={() => void save()} disabled={saving || form.name.trim().length < 2 || form.email.trim().length < 5}>
              {saving ? "Adding…" : "Add teacher"}
            </MgButton>
          </div>
        </div>
      </Modal>

      <Modal open={!!assign} onClose={() => setAssign(null)} title={`Assign groups — ${assign?.name ?? ""}`}>
        <p className="mb-3 text-[0.82rem] text-slate-500">Choose which groups this teacher will manage. They only see these groups in the portal.</p>
        <div className="grid gap-2">
          {groups.length === 0 ? <p className="font-mono text-[0.68rem] text-slate-400">No groups yet — create one first.</p> : null}
          {groups.map((g) => {
            const on = pick.includes(g.id);
            return (
              <label key={g.id} className={cn("flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 transition-all", on ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-white hover:border-indigo-200")}>
                <input type="checkbox" checked={on} onChange={() => setPick((p) => (on ? p.filter((x) => x !== g.id) : [...p, g.id]))} className="h-4 w-4 accent-[#2563EB]" />
                <GraduationCap className={cn("h-4 w-4", on ? "text-[#1647C7]" : "text-slate-300")} />
                <span className="font-display text-[0.84rem] font-bold text-slate-700">{g.name}</span>
                <span className="ml-auto inline-flex items-center gap-1 font-mono text-[0.6rem] text-slate-400"><UserRound className="h-3 w-3" /> {g.studentCount}</span>
              </label>
            );
          })}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <MgButton tone="ghost" onClick={() => setAssign(null)}>Cancel</MgButton>
          <MgButton onClick={() => void saveAssign()} disabled={saving || pick.length === 0}>Assign {pick.length || ""}</MgButton>
        </div>
      </Modal>
      <Toasts items={items} onClose={() => {}} />
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[0.85rem] outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100";