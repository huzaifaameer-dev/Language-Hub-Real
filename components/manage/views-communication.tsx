"use client";

import { useEffect, useState } from "react";
import { CalendarClock, MessageSquareMore, Save, Send, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GroupLite, MgUserLite } from "./types";
import { EmptyState, MgButton, SkeletonRows, StatusBadge, Toasts, useToasts, fmtWhen } from "./ui";

interface MessageRow {
  id: string;
  kind: string;
  senderName: string;
  recipientType: string;
  groupNames: string[];
  text: string;
  status: string;
  scheduledFor: string | null;
  sentAt: string | null;
  failedReason: string | null;
  mock: boolean;
  recipientCount: number;
  sentCount: number;
  createdAt: string;
}

interface Template {
  id: string;
  name: string;
  body: string;
}

async function j(res: Response) {
  const d = await res.json().catch(() => ({}));
  return { ok: res.ok, d };
}

export function CommunicationView({ user }: { user: MgUserLite }) {
  const [groups, setGroups] = useState<GroupLite[]>([]);
  const [rows, setRows] = useState<MessageRow[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [busy, setBusy] = useState(true);
  const [kind, setKind] = useState("announcement");
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [scheduleAt, setScheduleAt] = useState("");
  const [sending, setSending] = useState(false);
  const [templatePick, setTemplatePick] = useState("");
  const { items, push } = useToasts();

  const load = () => {
    setBusy(true);
    fetch("/api/management/messages")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setRows((d?.messages ?? []) as MessageRow[]))
      .catch(() => setRows([]))
      .finally(() => setBusy(false));
    fetch("/api/management/groups").then((r) => (r.ok ? r.json() : null)).then((d) => setGroups((d?.groups ?? []).filter((g: GroupLite) => g.studentCount > 0) as GroupLite[]));
    fetch("/api/management/templates").then((r) => (r.ok ? r.json() : null)).then((d) => setTemplates((d?.templates ?? []) as Template[]));
  };
  useEffect(() => {
    queueMicrotask(() => load());
  }, []);

  const toggleGroup = (id: string) => setGroupIds((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));

  const applyTemplate = (tplId: string) => {
    setTemplatePick(tplId);
    const t = templates.find((x) => x.id === tplId);
    if (t) setText(t.body);
  };

  const send = async (saveOnly: boolean) => {
    if (!text.trim()) return;
    setSending(true);
    const body: Record<string, unknown> = {
      kind,
      recipientType: "groups",
      groupIds,
      studentIds: [],
      text: text.trim(),
      scheduleAt: saveOnly ? null : scheduleAt ? new Date(scheduleAt).toISOString() : null,
    };
    const res = await fetch(`/api/management/messages${saveOnly ? "?save=1" : ""}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const { d } = await j(res);
    setSending(false);
    if (res.ok) {
      push(saveOnly ? "Draft saved" : scheduleAt ? "Message scheduled" : "Message sent");
      setText("");
      setScheduleAt("");
      setGroupIds([]);
      load();
    } else push(d.message ?? "Could not send message.", "err");
  };

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.3em] text-[#1647C7]">Messaging</p>
        <h2 className="mt-1 font-display text-[1.6rem] font-extrabold tracking-tight text-slate-900">WhatsApp communication</h2>
        <p className="mt-0.5 text-[0.9rem] text-slate-500">{user.role === "ADMIN" ? "Broadcast to any group" : "Broadcast to your assigned groups"} — real API when configured, safe mock mode otherwise.</p>
      </header>

      <section className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 backdrop-blur">
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-[0.78rem] font-bold text-slate-600">Type</label>
            <select value={kind} onChange={(e) => setKind(e.target.value)} className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-[0.82rem] outline-none focus:border-indigo-400 sm:max-w-[11rem]">
              <option value="announcement">Announcement</option>
              <option value="notice">Notice</option>
              <option value="reminder">Reminder</option>
              <option value="material">Material</option>
              <option value="assignment">Assignment</option>
              <option value="custom">Custom</option>
            </select>
            {templates.length ? (
              <select value={templatePick} onChange={(e) => applyTemplate(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[0.82rem] outline-none focus:border-indigo-400 sm:max-w-[13rem]">
                <option value="">Use a template…</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            ) : null}
          </div>

          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-[0.78rem] font-bold text-slate-600"><Users className="h-3.5 w-3.5" /> Send to groups</p>
            <div className="grid max-h-32 gap-1.5 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((g) => (
                <label key={g.id} className={cn("flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-[0.8rem]", groupIds.includes(g.id) ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-white hover:border-indigo-200")}>
                  <input type="checkbox" checked={groupIds.includes(g.id)} onChange={() => toggleGroup(g.id)} className="h-4 w-4 accent-[#2563EB]" />
                  <span className="truncate font-display font-bold text-slate-700">{g.name}</span>
                  <span className="ml-auto font-mono text-[0.58rem] text-slate-400">{g.studentCount}</span>
                </label>
              ))}
              {groups.length === 0 ? <p className="font-mono text-[0.64rem] text-slate-400 sm:col-span-2">No groups with students yet.</p> : null}
            </div>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="Type your WhatsApp message… You can use {{name}} to personalise per student (fill happens server-side)."
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[0.88rem] outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          />

          <div className="flex flex-wrap items-end justify-between gap-3">
            <label className="grid gap-1 text-[0.78rem] font-bold text-slate-600">
              Schedule (optional)
              <input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[0.82rem] outline-none focus:border-indigo-400" />
            </label>
            <div className="flex gap-2">
              <MgButton tone="ghost" onClick={() => void send(true)} disabled={sending || !text.trim() || groupIds.length === 0}>
                <Save className="h-4 w-4" /> Save draft
              </MgButton>
              <MgButton onClick={() => void send(false)} disabled={sending || !text.trim() || groupIds.length === 0}>
                <Send className="h-4 w-4" /> {scheduleAt ? "Schedule" : "Send now"}
              </MgButton>
            </div>
          </div>
          {groupIds.length ? <p className="font-mono text-[0.6rem] uppercase tracking-widest text-slate-400">→ {groupIds.length} group(s) · ~{groupIds.reduce((n, id) => n + (groups.find((g) => g.id === id)?.studentCount ?? 0), 0)} students</p> : null}
        </div>
      </section>

      <section>
        <h3 className="mb-2 flex items-center gap-2 font-display text-[0.95rem] font-extrabold text-slate-900"><MessageSquareMore className="h-4 w-4 text-[#1647C7]" /> Message history</h3>
        {busy ? (
          <SkeletonRows rows={3} cols={3} />
        ) : rows.length === 0 ? (
          <EmptyState title="No messages yet" hint="Your sent, scheduled and drafted WhatsApp messages will appear here." />
        ) : (
          <div className="mt-3 flex flex-col gap-2.5">
            {rows.slice(0, 20).map((m) => (
              <div key={m.id} className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 backdrop-blur">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-[0.58rem] font-bold uppercase text-slate-500">{m.kind}</span>
                  <StatusBadge status={m.status} />
                  {m.mock ? <span className="rounded-full bg-amber-50 px-2 py-0.5 font-mono text-[0.56rem] font-bold text-amber-600">mock</span> : null}
                  <span className="ml-auto font-mono text-[0.6rem] text-slate-400">
                    {m.status === "SCHEDULED" ? <><CalendarClock className="mr-1 inline h-3 w-3" />{fmtWhen(m.scheduledFor)}</> : m.sentAt ? `sent ${fmtWhen(m.sentAt)}` : fmtWhen(m.createdAt)}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-[0.85rem] leading-relaxed text-slate-600">{m.text}</p>
                <p className="mt-1.5 font-mono text-[0.6rem] text-slate-400">
                  {m.groupNames.join(", ") || "All"} · {m.sentCount}/{m.recipientCount} delivered · by {m.senderName}
                  {m.failedReason ? <span className="ml-2 text-rose-500">⚠ {m.failedReason}</span> : null}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
      <Toasts items={items} onClose={() => {}} />
    </div>
  );
}