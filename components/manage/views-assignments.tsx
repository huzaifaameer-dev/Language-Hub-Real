"use client";

import { useEffect, useState } from "react";
import { CalendarClock, FileText, Paperclip, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GroupLite, MgUserLite } from "./types";
import { Badge, CsvButton, EmptyState, FilePicker, MgButton, Modal, SearchBox, SkeletonRows, StatusBadge, Toasts, useToasts, fmtWhen, type PickedFile } from "./ui";

interface Assignment {
  id: string;
  groupIds: string[];
  groupNames: string[];
  title: string;
  kind?: string | null;
  description: string | null;
  instructions: string | null;
  links: string[];
  hasAttachments: boolean;
  deadline: string | null;
  reminderEnabled: boolean;
  priority: string;
  status: string;
  scheduledFor: string | null;
  publishedAt: string | null;
  createdAt: string;
}

async function j(res: Response) {
  const d = await res.json().catch(() => ({}));
  return { ok: res.ok, d };
}

const STATUSES = ["ALL", "OPEN", "PUBLISHED", "SCHEDULED", "CLOSED", "DRAFT"] as const;

export function AssignmentsView({ user }: { user: MgUserLite }) {
  const [rows, setRows] = useState<Assignment[]>([]);
  const [groups, setGroups] = useState<GroupLite[]>([]);
  const [status, setStatus] = useState<string>("ALL");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scheduleFor, setScheduleFor] = useState<Assignment | null>(null);
  const [scheduleAt, setScheduleAt] = useState("");
  const [materials, setMaterials] = useState<Array<{ id: string; title: string; type: string }>>([]);
  const { items, push } = useToasts();

  const form0 = { title: "", instructions: "", link: "", deadline: "", priority: "MEDIUM", kind: "assignment", status: "DRAFT", notifyOnPublish: true, reminderEnabled: false, groupIds: [] as string[], materialIds: [] as string[], attachments: [] as PickedFile[] };
  const [form, setForm] = useState(form0);

  const load = () => {
    setBusy(true);
    const statusQ = status === "ALL" ? "" : `&status=${status}`;
    fetch(`/api/management/assignments?q=${encodeURIComponent(q)}${statusQ}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setRows((d?.assignments ?? []) as Assignment[]))
      .catch(() => setRows([]))
      .finally(() => setBusy(false));
    fetch("/api/management/groups").then((r) => (r.ok ? r.json() : null)).then((d) => setGroups((d?.groups ?? []).filter((g: GroupLite) => g.studentCount > 0) as GroupLite[]));
    fetch("/api/management/materials").then((r) => (r.ok ? r.json() : null)).then((d) => setMaterials((d?.materials ?? []).map((m: { id: string; title: string; type: string }) => ({ id: m.id, title: m.title, type: m.type })) as Array<{ id: string; title: string; type: string }>));
  };
  useEffect(() => {
    queueMicrotask(() => load());
  }, [status]);
  useEffect(() => {
    const t = window.setTimeout(load, 350);
    return () => window.clearTimeout(t);
  }, [q]);

  const toggleGroup = (id: string) => setForm((f) => ({ ...f, groupIds: f.groupIds.includes(id) ? f.groupIds.filter((x) => x !== id) : [...f.groupIds, id] }));

  const create = async () => {
    setSaving(true);
    const body: Record<string, unknown> = {
      title: form.title,
      instructions: form.instructions || null,
      links: form.link.trim() ? [form.link.trim()] : [],
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      priority: form.priority,
      status: form.status,
      notifyOnPublish: form.notifyOnPublish,
      reminderEnabled: form.reminderEnabled,
      groupIds: form.groupIds,
    };
    const res = await fetch("/api/management/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const { d } = await j(res);
    setSaving(false);
    if (res.ok) {
      push(form.status === "SCHEDULED" ? "Assignment scheduled" : `Assignment ${form.status === "DRAFT" ? "saved as draft" : "published"}`);
      setCreating(false);
      setForm(form0);
      load();
    } else push(d.message ?? "Could not create assignment.", "err");
  };

  const act = async (a: Assignment, action: string, okMsg: string) => {
    const res = await fetch(`/api/management/assignments/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const { d } = await j(res);
    if (res.ok) {
      push(okMsg);
      load();
    } else push(d.message ?? "Action failed.", "err");
  };

  const submitSchedule = async () => {
    if (!scheduleFor) return;
    setSaving(true);
    const res = await fetch(`/api/management/assignments/${scheduleFor.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "schedule", scheduledFor: new Date(scheduleAt).toISOString() }),
    });
    setSaving(false);
    if (res.ok) {
      push(`"${scheduleFor.title}" scheduled`);
      setScheduleFor(null);
      load();
    } else push("Could not schedule.", "err");
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.3em] text-[#1647C7]">Teaching</p>
          <h2 className="mt-1 font-display text-[1.6rem] font-extrabold tracking-tight text-slate-900">Assignments</h2>
          <p className="mt-0.5 text-[0.82rem] text-slate-500">Managed by {user.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SearchBox value={q} onChange={setQ} placeholder="Search title…" />
          <MgButton onClick={() => { setForm({ ...form0, groupIds: groups[0] ? [groups[0].id] : [] }); setCreating(true); }}>
            <Plus className="h-4 w-4" /> New assignment
          </MgButton>
        </div>
      </header>

      <div className="no-scrollbar flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 font-mono text-[0.66rem] font-bold tracking-widest transition",
              status === s ? "border-[#1647C7] bg-[#1647C7] text-white shadow-[0_10px_24px_-10px_rgb(22_71_199/0.8)]" : "border-slate-200 bg-white text-slate-500 hover:border-indigo-300"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {busy ? (
        <SkeletonRows rows={5} cols={3} />
      ) : rows.length === 0 ? (
        <EmptyState title="No assignments found" hint="Create an assignment and publish it to a group — students will get notified." />
      ) : (
        <div className="flex flex-col gap-3">
          <CsvButton filename="assignments.csv" headers={["Title", "Groups", "Status", "Priority", "Deadline", "Published"]} rows={rows.map((a) => [a.title, a.groupNames.join(" · "), a.status, a.priority, a.deadline ?? "", a.publishedAt ?? ""])} label="Export" />
          {rows.map((a) => (
            <div key={a.id} className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 backdrop-blur transition-all hover:shadow-sm">
              <div className="flex flex-wrap items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-[#1647C7]"><FileText className="h-4.5 w-4.5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-[0.98rem] font-extrabold text-slate-900">{a.title}</p>
                    <StatusBadge status={a.status} />
                    <Badge className="border-amber-200 bg-amber-50 text-amber-700">{a.priority}</Badge>
                  </div>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 font-mono text-[0.62rem] text-slate-400">
                    <span>{a.groupNames.join(", ")}</span>
                    {a.deadline ? <span className="inline-flex items-center gap-1"><CalendarClock className="h-3 w-3" /> due {fmtWhen(a.deadline)}</span> : null}
                    {a.reminderEnabled ? <span>🔔 reminders on</span> : null}
                    {a.scheduledFor ? <span>publishes {fmtWhen(a.scheduledFor)}</span> : null}
                  </p>
                  {a.instructions ? <p className="mt-2 line-clamp-2 whitespace-pre-line text-[0.84rem] leading-relaxed text-slate-500">{a.instructions}</p> : null}
                  {a.links.length || a.hasAttachments ? (
                    <p className="mt-1.5 flex flex-wrap gap-2">
                      {a.links.map((l) => <a key={l} href={l} target="_blank" rel="noopener noreferrer" className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-[0.6rem] font-bold text-slate-600 hover:bg-indigo-100">link</a>)}
                      {a.hasAttachments ? <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-[0.6rem] font-bold text-slate-600"><Paperclip className="h-3 w-3" /> files</span> : null}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {a.status === "DRAFT" ? (
                    <MgButton tone="gold" className="h-9 px-3 text-[0.72rem]" onClick={() => void act(a, "publish", `"${a.title}" published`)}><Send className="h-3.5 w-3.5" /> Publish</MgButton>
                  ) : null}
                  {a.status === "DRAFT" || a.status === "PUBLISHED" || a.status === "OPEN" || a.status === "CLOSED" ? (
                    <MgButton tone="ghost" className="h-9 px-3 text-[0.72rem]" onClick={() => { setScheduleFor(a); setScheduleAt(""); }}><CalendarClock className="h-3.5 w-3.5" /> Schedule</MgButton>
                  ) : null}
                  {a.status === "PUBLISHED" || a.status === "OPEN" ? (
                    <MgButton tone="ghost" className="h-9 px-3 text-[0.72rem]" onClick={() => void act(a, "close", `"${a.title}" closed`)}>Close</MgButton>
                  ) : null}
                  {a.status === "CLOSED" ? (
                    <MgButton tone="ghost" className="h-9 px-3 text-[0.72rem]" onClick={() => void act(a, "reopen", `"${a.title}" reopened`)}><Pencil className="h-3.5 w-3.5" /> Reopen</MgButton>
                  ) : null}
                  <MgButton tone="rose" className="h-9 px-3 text-[0.72rem]" onClick={() => { if (window.confirm(`Delete "${a.title}"?`)) void act(a, "delete", "Deleted"); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </MgButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="New assignment" wide>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-[0.78rem] font-bold text-slate-600 sm:col-span-2">
            Title
            <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Week 3 speaking task" />
          </label>
          <label className="grid gap-1 text-[0.78rem] font-bold text-slate-600 sm:col-span-2">
            Instructions
            <textarea className={cn(inputCls, "resize-none")} rows={3} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder="What should students do?" />
          </label>
          <label className="grid gap-1 text-[0.78rem] font-bold text-slate-600">
            Optional link
            <input className={inputCls} value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://…" />
          </label>
          <label className="grid gap-1 text-[0.78rem] font-bold text-slate-600">
            Deadline
            <input type="datetime-local" className={inputCls} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </label>
          <label className="grid gap-1 text-[0.78rem] font-bold text-slate-600">
            Priority
            <select className={inputCls} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option>LOW</option><option>MEDIUM</option><option>HIGH</option>
            </select>
          </label>
          <label className="grid gap-1 text-[0.78rem] font-bold text-slate-600">
            Publish status
            <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="DRAFT">Save as draft</option>
              <option value="PUBLISHED">Publish now</option>
              <option value="SCHEDULED">Schedule later</option>
            </select>
          </label>
          <div className="grid gap-2 sm:col-span-2">
            <p className="text-[0.78rem] font-bold text-slate-600">Groups</p>
            <div className="grid max-h-36 gap-1.5 overflow-y-auto sm:grid-cols-2">
              {groups.map((g) => (
                <label key={g.id} className={cn("flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-[0.8rem]", form.groupIds.includes(g.id) ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-white hover:border-indigo-200")}>
                  <input type="checkbox" checked={form.groupIds.includes(g.id)} onChange={() => toggleGroup(g.id)} className="h-4 w-4 accent-[#2563EB]" />
                  <span className="font-display font-bold text-slate-700">{g.name}</span>
                </label>
              ))}
              {groups.length === 0 ? <p className="font-mono text-[0.64rem] text-slate-400 sm:col-span-2">Add students to a group first, or pick it in Groups → Manage.</p> : null}
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-[0.8rem] font-bold text-slate-600 sm:col-span-2">
            <input type="checkbox" checked={form.notifyOnPublish} onChange={(e) => setForm({ ...form, notifyOnPublish: e.target.checked })} className="h-4 w-4 accent-[#2563EB]" />
            Notify students on WhatsApp when published
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-[0.8rem] font-bold text-slate-600 sm:col-span-2">
            <input type="checkbox" checked={form.reminderEnabled} onChange={(e) => setForm({ ...form, reminderEnabled: e.target.checked })} className="h-4 w-4 accent-[#2563EB]" />
            Auto-remind non-submitters (2h before deadline + on schedule)
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <MgButton tone="ghost" onClick={() => setCreating(false)}>Cancel</MgButton>
          <MgButton onClick={() => void create()} disabled={saving || form.title.trim().length < 2 || form.groupIds.length === 0}>Create assignment</MgButton>
        </div>
      </Modal>

      <Modal open={!!scheduleFor} onClose={() => setScheduleFor(null)} title={`Schedule — ${scheduleFor?.title ?? ""}`}>
        <label className="grid gap-1 text-[0.78rem] font-bold text-slate-600">
          Publish at
          <input type="datetime-local" className={inputCls} value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} />
        </label>
        <p className="mt-2 text-[0.78rem] text-slate-500">The cron runs /api/automations to publish due assignments automatically.</p>
        <div className="mt-4 flex justify-end gap-2">
          <MgButton tone="ghost" onClick={() => setScheduleFor(null)}>Cancel</MgButton>
          <MgButton onClick={() => void submitSchedule()} disabled={saving || !scheduleAt}>Schedule</MgButton>
        </div>
      </Modal>
      <Toasts items={items} onClose={() => {}} />
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[0.85rem] outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100";