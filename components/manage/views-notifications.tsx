"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, CheckCheck, ExternalLink, Inbox, Megaphone, Star, TimerReset } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState, MgButton, SkeletonRows, Toasts, useToasts, fmtWhen } from "./ui";
import type { MgUserLite } from "./types";

interface Notif {
  id: string;
  kind: string;
  title: string;
  message: string | null;
  href: string | null;
  read: boolean;
  createdAt: string;
}

function kindIcon(kind: string) {
  if (kind.includes("assignment")) return <FileX />;
  if (kind.includes("remind")) return <TimerReset className="h-4 w-4" />;
  if (kind.includes("submission")) return <Inbox className="h-4 w-4" />;
  if (kind.includes("certificate") || kind.includes("grade")) return <Star className="h-4 w-4" />;
  if (kind.includes("seat") || kind.includes("demo")) return <Megaphone className="h-4 w-4" />;
  return <Bell className="h-4 w-4" />;
}

export function NotificationsView({ user }: { user: MgUserLite }) {
  const [rows, setRows] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [busy, setBusy] = useState(true);
  const { items, push } = useToasts();

  const load = () => {
    setBusy(true);
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setRows((d?.notifications ?? []) as Notif[]);
        setUnread(d?.unread ?? 0);
      })
      .catch(() => setRows([]))
      .finally(() => setBusy(false));
  };
  useEffect(() => {
    queueMicrotask(() => load());
  }, []);

  useEffect(() => {
    let sub: (() => void) | null = null;
    import("@/lib/realtime").then(({ subscribe }) => {
      sub = subscribe(() => load());
    }).catch(() => {});
    const t = window.setInterval(load, 30000);
    return () => { window.clearInterval(t); sub?.(); };
  }, []);

  const markAll = async () => {
    const res = await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    if (res.ok) {
      push("All notifications marked read");
      load();
    }
  };

  const markOne = async (n: Notif) => {
    if (n.read) return;
    await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: n.id }) });
    load();
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.3em] text-[#1647C7]">Inbox</p>
          <h2 className="mt-1 flex items-center gap-2.5 font-display text-[1.6rem] font-extrabold tracking-tight text-slate-900">
            Notifications for {user.name.split(" ")[0]}
            {unread > 0 ? <span className="rounded-full bg-[#1647C7] px-2.5 py-0.5 font-mono text-[0.66rem] font-black text-white">{unread} new</span> : null}
          </h2>
        </div>
        <MgButton tone="ghost" className="h-9 px-3.5 text-[0.75rem]" onClick={() => void markAll()} disabled={unread === 0}>
          <CheckCheck className="h-4 w-4" /> Mark all read
        </MgButton>
      </header>

      {busy ? (
        <SkeletonRows rows={4} cols={2} />
      ) : rows.length === 0 ? (
        <EmptyState title="No notifications yet" hint="Submissions, reviews, assignments and system alerts land here." />
      ) : (
        <div className="flex flex-col gap-2.5">
          {rows.map((n) => (
            <div
              key={n.id}
              onClick={() => void markOne(n)}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 backdrop-blur transition-all hover:shadow-sm",
                n.read ? "border-slate-200/70 bg-white/60" : "border-indigo-200 bg-indigo-50/70"
              )}
            >
              <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", n.read ? "bg-slate-100 text-slate-400" : "bg-[#1647C7] text-white")}>
                {kindIcon(n.kind)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-[0.9rem] font-extrabold text-slate-900">{n.title}</p>
                  {!n.read ? <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#1647C7]" /> : null}
                  <span className="ml-auto font-mono text-[0.58rem] text-slate-400">{fmtWhen(n.createdAt)}</span>
                </div>
                {n.message ? <p className="mt-1 text-[0.84rem] leading-relaxed text-slate-600">{n.message}</p> : null}
                <p className="mt-1.5 font-mono text-[0.6rem] uppercase tracking-widest text-slate-400">{n.kind}</p>
              </div>
              {n.href ? (
                <a href={n.href} className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-400 hover:border-indigo-400 hover:text-[#1647C7]" onClick={(e) => e.stopPropagation()}>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
          ))}
        </div>
      )}
      <Toasts items={items} onClose={() => {}} />
    </div>
  );
}

function FileX() {
  return <BellRing className="h-4 w-4" />;
}