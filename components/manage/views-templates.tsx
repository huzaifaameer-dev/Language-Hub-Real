"use client";

import { useEffect, useState } from "react";
import { NotebookPen, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CsvButton, EmptyState, MgButton, Modal, SkeletonRows, Toasts, useToasts, fmtWhen } from "./ui";

interface Template {
  id: string;
  name: string;
  body: string;
  active: boolean;
  createdAt: string;
}

async function j(res: Response) {
  const d = await res.json().catch(() => ({}));
  return { ok: res.ok, d };
}

export function TemplatesView() {
  const [rows, setRows] = useState<Template[]>([]);
  const [busy, setBusy] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", body: "" });
  const [saving, setSaving] = useState(false);
  const { items, push } = useToasts();

  const load = () => {
    setBusy(true);
    fetch("/api/management/templates")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setRows((d?.templates ?? []) as Template[]))
      .catch(() => setRows([]))
      .finally(() => setBusy(false));
  };
  useEffect(() => {
    queueMicrotask(() => load());
  }, []);

  const create = async () => {
    setSaving(true);
    const res = await fetch("/api/management/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, body: form.body }),
    });
    const { d } = await j(res);
    setSaving(false);
    if (res.ok) {
      push("Template saved");
      setCreating(false);
      setForm({ name: "", body: "" });
      load();
    } else push(d.message ?? "Could not save template.", "err");
  };

  const remove = async (t: Template) => {
    if (!window.confirm(`Delete template "${t.name}"?`)) return;
    await fetch(`/api/management/templates/${t.id}`, { method: "DELETE" });
    push("Template deleted");
    load();
  };

  const vars = (body: string) => Array.from(new Set(Array.from(body.matchAll(/\{\{\s*([a-zA-Z]+)\s*\}\}/g), (m) => m[1])));

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.3em] text-[#1647C7]">Messaging</p>
          <h2 className="mt-1 font-display text-[1.6rem] font-extrabold tracking-tight text-slate-900">Message templates</h2>
        </div>
        <MgButton onClick={() => { setForm({ name: "", body: "" }); setCreating(true); }}>
          <Plus className="h-4 w-4" /> New template
        </MgButton>
      </header>

      {busy ? (
        <SkeletonRows rows={3} cols={2} />
      ) : rows.length === 0 ? (
        <EmptyState title="No templates yet" hint="Save reusable messages with {{name}} variables — the composer fills them per student." />
      ) : (
        <div className="flex flex-col gap-3">
          <CsvButton filename="templates.csv" headers={["Name", "Body"]} rows={rows.map((t) => [t.name, t.body])} label="Export" />
          <div className="grid gap-3 md:grid-cols-2">
            {rows.map((t) => (
              <div key={t.id} className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 backdrop-blur transition-all hover:shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-50 text-[#1647C7]"><NotebookPen className="h-4 w-4" /></span>
                    <div className="min-w-0">
                      <p className="truncate font-display text-[0.95rem] font-extrabold text-slate-900">{t.name}</p>
                      <p className="font-mono text-[0.58rem] text-slate-400">{fmtWhen(t.createdAt)}</p>
                    </div>
                  </div>
                  <button type="button" aria-label="Delete" onClick={() => void remove(t)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-300 hover:bg-rose-50 hover:text-rose-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-3 whitespace-pre-line text-[0.84rem] leading-relaxed text-slate-600">{t.body}</p>
                {vars(t.body).length ? (
                  <p className="mt-2 flex flex-wrap gap-1.5">
                    {vars(t.body).map((v) => <span key={v} className="rounded-full bg-amber-50 px-2 py-0.5 font-mono text-[0.58rem] font-bold text-amber-700">{`{{${v}}}`}</span>)}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="New template">
        <div className="grid gap-3">
          <label className="grid gap-1 text-[0.78rem] font-bold text-slate-600">
            Template name
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Salam + deadline reminder" />
          </label>
          <label className="grid gap-1 text-[0.78rem] font-bold text-slate-600">
            Body (use {"{{name}}"}, {"{{deadline}}"}…)
            <textarea className={cn(inputCls, "resize-none")} rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder={"Salam {{name}}! Just a reminder…"} />
          </label>
          <div className="mt-2 flex justify-end gap-2">
            <MgButton tone="ghost" onClick={() => setCreating(false)}>Cancel</MgButton>
            <MgButton onClick={() => void create()} disabled={saving || form.name.trim().length < 2 || form.body.trim().length < 3}>Save template</MgButton>
          </div>
        </div>
      </Modal>
      <Toasts items={items} onClose={() => {}} />
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[0.85rem] outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100";