"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Play, Send, X } from "lucide-react";
import { EmptyState, MgButton, SkeletonRows, StatusBadge, Toasts, useToasts, fmtWhen } from "./ui";
import type { MgUserLite } from "./types";

interface Scheduled {
  id: string;
  kind: string;
  senderName: string;
  groupNames: string[];
  text: string;
  status: string;
  scheduledFor: string | null;
  mock: boolean;
  recipientCount: number;
  createdAt: string;
}

async function j(res: Response) {
  const d = await res.json().catch(() => ({}));
  return { ok: res.ok, d };
}

export function ScheduledView({ user }: { user: MgUserLite }) {
  const [rows, setRows] = useState<Scheduled[]>([]);
  const [all, setAll] = useState<Scheduled[]>([]);
  const [busy, setBusy] = useState(true);
  const [resched, setResched] = useState<Scheduled | null>(null);
  const [when, setWhen] = useState("");
  const { items, push } = useToasts();

  const load = () => {
    setBusy(true);
    Promise.all([
      fetch("/api/management/messages?status=SCHEDULED").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/management/messages").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([sch, full]) => {
        setRows((sch?.messages ?? []) as Scheduled[]);
        setAll((full?.messages ?? []).filter((m: { status: string }) => m.status !== "SCHEDULED") as Scheduled[]);
      })
      .catch(() => { setRows([]); setAll([]); })
      .finally(() => setBusy(false));
  };
  useEffect(() => {
    queueMicrotask(() => load());
  }, []);

  const act = async (m: Scheduled, action: string, ok: string, body?: Record<string, unknown>) => {
    const res = await fetch(`/api/management/messages/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...body }),
    });
    const { d } = await j(res);
    if (res.ok) {
      push(ok);
      setResched(null);
      load();
    } else push(d.message ?? "Action failed.", "err");
  };

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.3em] text-[#1647C7]">Automation</p>
        <h2 className="mt-1 font-display text-[1.6rem] font-extrabold tracking-tight text-slate-900">Scheduled messages ({user.role})</h2>
        <p className="mt-0.5 text-[0.9rem] text-slate-500">Messages fire at their time from the /api/automations cron. You can also trigger them now.</p>
      </header>

      {busy ? (
        <SkeletonRows rows={4} cols={2} />
      ) : (
        <>
          <section className="flex flex-col gap-2.5">
            <h3 className="font-display text-[0.95rem] font-extrabold text-slate-900">Upcoming</h3>
            {rows.length === 0 ? (
              <EmptyState title="Nothing scheduled yet" hint="Use the Communication tab and pick a date to schedule a WhatsApp message." />
            ) : (
              rows.map((m) => (
                <div key={m.id} className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 backdrop-blur">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-[0.58rem] font-bold uppercase text-slate-500">{m.kind}</span>
                    <StatusBadge status={m.status} />
                    <span className="ml-auto inline-flex items-center gap-1 font-mono text-[0.66rem] font-bold text-[#1647C7]"><CalendarClock className="h-3.5 w-3.5" /> {fmtWhen(m.scheduledFor)}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-[0.85rem] text-slate-600">{m.text}</p>
                  <p className="mt-1 font-mono text-[0.6rem] text-slate-400">{m.groupNames.join(", ") || "All"} · ~{m.recipientCount} recipients · by {m.senderName}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <MgButton tone="ghost" className="h-9 px-3 text-[0.72rem]" onClick={() => act(m, "sendNow", "Sent now")}><Send className="h-3.5 w-3.5" /> Send now</MgButton>
                    <MgButton tone="ghost" className="h-9 px-3 text-[0.72rem]" onClick={() => { setResched(m); setWhen(""); }}><Play className="h-3.5 w-3.5" /> Reschedule</MgButton>
                    <MgButton tone="rose" className="h-9 px-3 text-[0.72rem]" onClick={() => { if (window.confirm("Cancel this scheduled message?")) void act(m, "cancel", "Cancelled"); }}>
                      <X className="h-3.5 w-3.5" /> Cancel
                    </MgButton>
                  </div>
                </div>
              ))
            )}
          </section>

          {all.length ? (
            <section className="flex flex-col gap-2">
              <h3 className="font-display text-[0.95rem] font-extrabold text-slate-900">Sent & other</h3>
              {all.slice(0, 8).map((m) => (
                <div key={m.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 bg-white/60 px-4 py-2.5">
                  <StatusBadge status={m.status} />
                  <p className="min-w-0 flex-1 truncate font-mono text-[0.64rem] text-slate-500">{m.text}</p>
                  <span className="font-mono text-[0.58rem] text-slate-400">{fmtWhen(m.createdAt)}</span>
                </div>
              ))}
            </section>
          ) : null}
        </>
      )}

      {resched ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm" onClick={() => setResched(null)}>
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-[1.05rem] font-extrabold text-slate-900">Reschedule message</h3>
            <label className="mt-4 grid gap-1 text-[0.78rem] font-bold text-slate-600">
              New date & time
              <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 outline-none focus:border-indigo-400" />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <MgButton tone="ghost" onClick={() => setResched(null)}>Cancel</MgButton>
              <MgButton disabled={!when} onClick={() => void act(resched, "reschedule", "Rescheduled", { scheduleAt: new Date(when).toISOString() })}>Save</MgButton>
            </div>
          </div>
        </div>
      ) : null}
      <Toasts items={items} onClose={() => {}} />
    </div>
  );
}