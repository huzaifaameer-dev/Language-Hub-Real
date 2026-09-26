"use client";

import { useEffect, useState } from "react";
import { GraduationCap, Mail, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GroupLite } from "./types";
import { CsvButton, EmptyState, MgButton, Modal, SearchBox, SkeletonRows, StatusBadge, Toasts, useToasts } from "./ui";

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  image?: string | null;
  notes?: string | null;
  active: boolean;
  groups: Array<{ id: string; name: string; courseName: string | null }>;
  createdAt: string;
}

const PAGE = 25;

async function j(res: Response) {
  const d = await res.json().catch(() => ({}));
  return { ok: res.ok, d };
}

export function StudentsView() {
  const [rows, setRows] = useState<Student[]>([]);
  const [groups, setGroups] = useState<GroupLite[]>([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(true);
  const [editing, setEditing] = useState<Student | null>(null);
  const [creating, setCreating] = useState(false);
  const { items, push } = useToasts();

  const form0 = { name: "", email: "", phone: "", notes: "", groupIds: [] as string[] };
  const [form, setForm] = useState(form0);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setBusy(true);
    fetch(`/api/management/students?q=${encodeURIComponent(q)}&page=${page}&status=active`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setRows(d.students ?? []);
          setTotal(d.total ?? 0);
        }
      })
      .finally(() => setBusy(false));
    fetch("/api/management/groups").then((r) => (r.ok ? r.json() : null)).then((d) => setGroups((d?.groups ?? []) as GroupLite[]));
  };
  useEffect(() => {
    queueMicrotask(() => load());
  }, [page]);
  useEffect(() => {
    const t = window.setTimeout(() => setPage(1), 350);
    return () => window.clearTimeout(t);
  }, [q]);

  const openCreate = () => {
    setForm({ ...form0, groupIds: groups[0] ? [groups[0].id] : [] });
    setCreating(true);
  };

  const openEdit = (s: Student) => {
    setEditing(s);
    setForm({ name: s.name, email: s.email, phone: s.phone ?? "", notes: s.notes ?? "", groupIds: s.groups.map((g) => g.id) });
  };

  const toggleGroup = (id: string) => {
    setForm((f) => ({ ...f, groupIds: f.groupIds.includes(id) ? f.groupIds.filter((x) => x !== id) : [...f.groupIds, id] }));
  };

  const save = async () => {
    setSaving(true);
    const body = creating
      ? { name: form.name, email: form.email, phone: form.phone || null, groupIds: form.groupIds }
      : { name: form.name, phone: form.phone || null, notes: form.notes || null, groupIds: form.groupIds, groupsAction: "set" as const };
    const url = creating ? "/api/management/students" : `/api/management/students/${editing!.id}`;
    const res = await fetch(url, {
      method: creating ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const { d } = await j(res);
    setSaving(false);
    if (res.ok) {
      push(creating ? `Added ${form.email}` : "Student updated");
      setCreating(false);
      setEditing(null);
      setPage(1);
      load();
    } else {
      push(d.message ?? "Could not save student.", "err");
    }
  };

  const toggleActive = async (s: Student) => {
    const res = await fetch(`/api/management/students/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !s.active }),
    });
    if (res.ok) {
      push(s.active ? `${s.name} deactivated` : `${s.name} activated`);
      load();
    } else push("Could not update status.", "err");
  };

  const remove = async (s: Student) => {
    if (!window.confirm(`Archive ${s.name}? They keep their history but leave all groups.`)) return;
    const res = await fetch(`/api/management/students/${s.id}`, { method: "DELETE" });
    if (res.ok) {
      push(`Archived ${s.name}`);
      load();
    } else push("Could not archive.", "err");
  };

  const first = (s: Student) => (s.name || "?").slice(0, 1).toUpperCase();

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.3em] text-[#1647C7]">People</p>
          <h2 className="mt-1 font-display text-[1.6rem] font-extrabold tracking-tight text-slate-900">Students</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SearchBox value={q} onChange={setQ} placeholder="Search name / email / phone…" />
          <MgButton onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add student
          </MgButton>
        </div>
      </header>

      {busy ? (
        <SkeletonRows rows={5} cols={3} />
      ) : rows.length === 0 ? (
        <EmptyState title="No students found" hint="Add a student by email — existing accounts are linked, new ones are created automatically." />
      ) : (
        <div className="flex flex-col gap-3">
          <CsvButton
            filename="students.csv"
            headers={["Name", "Email", "Phone", "Groups", "Status", "Added"]}
            rows={rows.map((s) => [s.name, s.email, s.phone ?? "", s.groups.map((g) => g.name).join(" · "), s.active ? "Active" : "Inactive", s.createdAt])}
            label="Export"
          />
          {rows.map((s) => (
            <div key={s.id} className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 backdrop-blur transition-all hover:shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display font-black text-white", s.active ? "bg-gradient-to-br from-[#2563EB] to-[#6D4AFF]" : "bg-slate-300")}>
                  {first(s)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-[0.95rem] font-extrabold text-slate-900">{s.name}</p>
                    <StatusBadge status={s.active ? "ACTIVE" : "ARCHIVED"} />
                  </div>
                  <p className="mt-0.5 flex flex-wrap gap-x-3 font-mono text-[0.66rem] text-slate-400">
                    <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {s.email}</span>
                    {s.phone ? <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {s.phone}</span> : null}
                  </p>
                  {s.groups.length ? <p className="mt-1.5 flex flex-wrap gap-1.5">{s.groups.map((g) => <span key={g.id} className="rounded-full bg-indigo-50 px-2.5 py-0.5 font-mono text-[0.58rem] font-bold text-[#1647C7]">{g.name}</span>)}</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  <MgButton tone="ghost" className="h-9 px-3 text-[0.72rem]" onClick={() => openEdit(s)}><Pencil className="h-3.5 w-3.5" /> Edit</MgButton>
                  <MgButton tone="ghost" className="h-9 px-3 text-[0.72rem]" onClick={() => toggleActive(s)}>{s.active ? "Deactivate" : "Activate"}</MgButton>
                  <MgButton tone="rose" className="h-9 px-3 text-[0.72rem]" onClick={() => remove(s)}><Trash2 className="h-3.5 w-3.5" /></MgButton>
                </div>
              </div>
            </div>
          ))}
          <footer className="flex items-center justify-between pt-1">
            <p className="font-mono text-[0.62rem] uppercase tracking-widest text-slate-400">{total} total</p>
            <div className="flex items-center gap-2">
              <MgButton tone="ghost" className="h-9 px-3 text-[0.72rem]" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</MgButton>
              <span className="font-mono text-[0.66rem] font-bold text-slate-500">{page} / {Math.max(1, Math.ceil(total / PAGE))}</span>
              <MgButton tone="ghost" className="h-9 px-3 text-[0.72rem]" disabled={page >= Math.ceil(total / PAGE)} onClick={() => setPage(page + 1)}>Next</MgButton>
            </div>
          </footer>
        </div>
      )}

      <Modal open={creating || !!editing} onClose={() => { setCreating(false); setEditing(null); }} title={creating ? "Add student" : `Edit ${editing?.name ?? ""}`}>
        <div className="grid gap-3">
          <label className="grid gap-1 text-[0.78rem] font-bold text-slate-600">
            Full name
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ayesha Khan" />
          </label>
          <label className="grid gap-1 text-[0.78rem] font-bold text-slate-600">
            Email
            <input className={cn(inputCls, creating ? "" : "opacity-60")} value={form.email} disabled={!creating} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="student@example.com" />
          </label>
          <label className="grid gap-1 text-[0.78rem] font-bold text-slate-600">
            WhatsApp / phone
            <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+92 300 0000000" />
          </label>
          {editing ? (
            <label className="grid gap-1 text-[0.78rem] font-bold text-slate-600">
              Notes
              <textarea className={cn(inputCls, "resize-none")} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </label>
          ) : null}
          {groups.length ? (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[0.78rem] font-bold text-slate-600"><GraduationCap className="h-3.5 w-3.5" /> Enrol in groups</p>
              <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto rounded-xl border border-slate-100 p-2">
                {groups.map((g) => (
                  <label key={g.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[0.8rem] hover:bg-slate-50">
                    <input type="checkbox" checked={form.groupIds.includes(g.id)} onChange={() => toggleGroup(g.id)} className="h-4 w-4 accent-[#2563EB]" />
                    <span className="font-display font-bold text-slate-700">{g.name}</span>
                    <span className="ml-auto font-mono text-[0.6rem] text-slate-400">{g.studentCount}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}
          <div className="mt-2 flex justify-end gap-2">
            <MgButton tone="ghost" onClick={() => { setCreating(false); setEditing(null); }}>Cancel</MgButton>
            <MgButton onClick={() => void save()} disabled={saving || form.name.trim().length < 2 || (creating && form.email.trim().length < 5)}>
              {saving ? <SpinnerInline /> : creating ? "Add student" : "Save changes"}
            </MgButton>
          </div>
        </div>
      </Modal>
      <Toasts items={items} onClose={() => {}} />
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[0.85rem] outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100";

function SpinnerInline() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />;
}