"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, CheckCheck, GraduationCap, Inbox, UserPlus } from "lucide-react";

import { cn } from "@/lib/utils";
import { useLiveSync } from "@/lib/use-live";

interface Notif {
  id: string;
  kind: string;
  title: string;
  message?: string | null;
  href?: string | null;
  read: boolean;
  createdAt: string;
}

const ease = [0.16, 1, 0.3, 1] as const;

function relativeTime(iso?: string | null): string {
  if (!iso) return "just now";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "just now";
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

function KindIcon({ kind }: { kind: string }) {
  if (kind === "application") {
    return (
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand/12 text-brand-deep">
        <UserPlus className="h-4 w-4" strokeWidth={2} />
      </span>
    );
  }
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-600">
      <GraduationCap className="h-4 w-4" strokeWidth={2} />
    </span>
  );
}

export function NotificationsBell({ userId }: { userId?: string }) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(() => {
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setList(d.notifications ?? []);
          setUnread(d.unread ?? 0);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(load, [load]);

  useLiveSync((ev) => {
    if (ev.table !== "notifications") return;
    if (ev.userId && ev.userId !== userId) return;
    load();
  });

  const markRead = async (id?: string) => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { id } : {}),
      });
    } catch {
      // non-fatal: badge will refresh on next poll
    }
    load();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) load();
        }}
        aria-label="Notifications"
        className="relative inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 py-2 font-display text-[0.75rem] font-bold text-ink-2 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/35 hover:text-brand-deep"
      >
        <Bell className="h-3.5 w-3.5" strokeWidth={2} />
        <span className="hidden sm:inline">{unread > 0 ? `${unread} new` : "Inbox"}</span>
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-4.5 w-4.5 min-w-4.5 place-items-center rounded-full bg-rose-500 px-1 font-mono text-[0.6rem] font-bold text-white ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
      ) : null}

      {open ? (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease }}
          className="absolute right-0 top-[calc(100%+10px)] z-50 w-[19rem] max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-[0_30px_70px_-20px_rgb(15_23_42/0.45)] backdrop-blur-2xl sm:w-[22rem]"
          role="dialog"
          aria-label="Notifications"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="font-display text-[0.66rem] font-bold uppercase tracking-[0.24em] text-brand-deep">
              Notifications
            </p>
            <button
              type="button"
              onClick={() => markRead()}
              disabled={unread === 0}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-white px-3 py-1 font-display text-[0.68rem] font-bold text-ink-2 transition-all duration-200 hover:border-brand/45 hover:text-brand-deep disabled:opacity-40"
            >
              <CheckCheck className="h-3.5 w-3.5" strokeWidth={2} />
              Mark all read
            </button>
          </div>

          <div className="max-h-[22rem] overflow-y-auto">
            {list.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                <Inbox className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
                <p className="text-[0.85rem] font-semibold text-ink-2">All caught up</p>
                <p className="text-[0.75rem] text-ink-3">
                  Application and enrollment updates will appear here.
                </p>
              </div>
            ) : (
              list.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => markRead(n.id)}
                  className={cn(
                    "flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-start transition-colors duration-150 last:border-b-0",
                    n.read ? "bg-white hover:bg-slate-50" : "bg-brand/8/50 hover:bg-brand/8"
                  )}
                >
                  <KindIcon kind={n.kind} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className={cn("truncate text-[0.82rem] font-bold", n.read ? "text-ink-2" : "text-ink")}>
                        {n.title}
                      </span>
                      <span className="shrink-0 font-mono text-[0.6rem] text-ink-3">{relativeTime(n.createdAt)}</span>
                    </span>
                    {n.message ? (
                      <span className={cn("mt-0.5 block text-[0.75rem] leading-snug", n.read ? "text-ink-3" : "text-ink-2")}>
                        {n.message}
                      </span>
                    ) : null}
                  </span>
                  {!n.read ? <span aria-hidden className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand/80" /> : null}
                </button>
              ))
            )}
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}