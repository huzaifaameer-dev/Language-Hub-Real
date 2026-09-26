"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GroupLite, MgUserLite } from "./types";
import { CsvButton, EmptyState, MgButton, Modal, SkeletonRows, Toasts, useToasts, fmtDay } from "./ui";

interface Material {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  type: string;
  url: string | null;
  uploadedBy: string;
  createdAt: string;
}

async function j(res: Response) {
  const d = await res.json().catch(() => ({}));
  return { ok: res.ok, d };
}

const TYPES = ["PDF", "DOC", "IMAGE", "VIDEO", "LINK"] as const;

export function MaterialsView({ user }: { user: MgUserLite }) {
  const [rows, setRows] = useState<Material[]>([]);
  const [groups, setGroups] = useState<GroupLite[]>([]);
  const [busy, setBusy] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", category: "", description: "", type: "PDF" as string, url: "", groupId: "" });
  const [saving, setSaving] = useState(false);
  const { items, push } = useToasts();

  const load = () => {
    setBusy(true);
    fetch("/api/management/materials")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setRows((d?.materials ?? []) as Material[]))
      .catch(() => setRows([]))
      .finally(() => setBusy(false));
    fetch("/api/management/groups").then((r) => (r.ok ? r.json() : null)).then((d) => setGroups((d?.groups ?? []) as GroupLite[]));
  };
  useEffect(() => {
    queueMicrotask(() => load());
  }, []);

  const create = async () => {
    setSaving(true);
    const res = await fetch("/api/management/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        category: form.category || null,
        description: form.description || null,
        type: form.type,
        url: form.url.trim() || null,
        groupId: form.groupId || null,
        courseId: null,
      }),
    });
    const { d } = await j(res);
    setSaving(false);
    if (res.ok) {
      push("Material added");
      setCreating(false);
      setForm({ title: "", category: "", description: "", type: "PDF", url: "", groupId: "" });
      load();
    } else push(d.message ?? "Could not add material.", "err");
  };

  const remove = async (m: Material) => {
    if (!window.confirm(`Delete material "${m.title}"?`)) return;
    const res = await fetch(`/api/management/materials/${m.id}`, { method: "DELETE" });
    if (res.ok) {
      push("Material deleted");
      load();
    } else push("Could not delete.", "err");
  };

  const href = (m: Material) => (m.url && /^https?:\/\//.test(m.url) ? m.url : `/api/management/media/${m.id}?kind=material`);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.3em] text-[#1647C7]">Library</p>
          <h2 className="mt-1 font-display text-[1.6rem] font-extrabold tracking-tight text-slate-900">Materials</h2>
          <p className="mt-0.5 text-[0.82rem] text-slate-500">Shared by {user.name}</p>
        </div>
        <MgButton onClick={() => { setForm({ title: "", category: "", description: "", type: "PDF", url: "", groupId: "" }); setCreating(true); }}>
          <Plus className="h-4 w-4" /> Add material
        </MgButton>
      </header>

      {busy ? (
        <SkeletonRows rows={4} cols={3} />
      ) : rows.length === 0 ? (
        <EmptyState title="No materials yet" hint="Share PDFs, docs, images, videos or links with your groups." />
      ) : (
        <div className="flex flex-col gap-3">
          <CsvButton filename="materials.csv" headers={["Title", "Type", "Category", "Uploaded by", "Added"]} rows={rows.map((m) => [m.title, m.type, m.category ?? "", m.uploadedBy, m.createdAt])} label="Export" />
          <div className="grid gap-3 sm:grid-cols-2">
            {rows.map((m) => (
              <div key={m.id} className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 backdrop-blur transition-all hover:shadow-sm">
                <div className="flex items-start gap-3">
                  <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl font-mono text-[0.62rem] font-black text-white", m.type === "VIDEO" ? "bg-rose-500" : m.type === "IMAGE" ? "bg-amber-500" : m.type === "LINK" ? "bg-sky-500" : m.type === "DOC" ? "bg-violet-500" : "bg-[#1647C7]")}>
                    {m.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-display text-[0.95rem] font-extrabold text-slate-900">{m.title}</p>
                        <p className="mt-0.5 font-mono text-[0.6rem] text-slate-400">{m.category ?? "General"} · {m.uploadedBy} · {fmtDay(m.createdAt)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <a href={href(m)} target="_blank" rel="noopener noreferrer" aria-label="Open material" className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 text-slate-500 hover:border-indigo-400 hover:text-[#1647C7]">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        <button type="button" aria-label="Delete" onClick={() => void remove(m)} className="grid h-8 w-8 place-items-center rounded-full text-slate-300 hover:bg-rose-50 hover:text-rose-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    {m.description ? <p className="mt-2 text-[0.8rem] leading-relaxed text-slate-500">{m.description}</p> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Add material">
        <div className="grid gap-3">
          <label className="grid gap-1 text-[0.78rem] font-bold text-slate-600">
            Title
            <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Week 3 listening PDF" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-[0.78rem] font-bold text-slate-600">
              Type
              <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-[0.78rem] font-bold text-slate-600">
              Category
              <input className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Grammar / Vocab…" />
            </label>
          </div>
          <label className="grid gap-1 text-[0.78rem] font-bold text-slate-600">
            {form.type === "LINK" ? "URL" : "URL (hosted link) or leave empty"}
            <input className={inputCls} value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" />
          </label>
          {groups.length ? (
            <label className="grid gap-1 text-[0.78rem] font-bold text-slate-600">
              Share with group
              <select className={inputCls} value={form.groupId} onChange={(e) => setForm({ ...form, groupId: e.target.value })}>
                <option value="">Everyone (all groups)</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </label>
          ) : null}
          <label className="grid gap-1 text-[0.78rem] font-bold text-slate-600">
            Description
            <textarea className={cn(inputCls, "resize-none")} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <div className="mt-2 flex justify-end gap-2">
            <MgButton tone="ghost" onClick={() => setCreating(false)}>Cancel</MgButton>
            <MgButton onClick={() => void create()} disabled={saving || form.title.trim().length < 2}>Add material</MgButton>
          </div>
        </div>
      </Modal>
      <Toasts items={items} onClose={() => {}} />
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[0.85rem] outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100";