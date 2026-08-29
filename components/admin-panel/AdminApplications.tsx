"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronDown, MapPin, MessageSquareQuote, UserRound, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminApplication } from "./types";
import { AvatarInitial, FilterChips, SectionTitle, StatusPill } from "./ui";

type Filter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

const ease = [0.16, 1, 0.3, 1] as const;

export function AdminApplications({
  items, onDecide, freshIds,
}: {
  items: AdminApplication[];
  onDecide: (id: string, action: "APPROVE" | "REJECT", message: string) => Promise<void>;
  freshIds: Set<string>;
}) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const visible = items.filter((a) => filter === "ALL" || a.status === filter);

  const decide = async (id: string, action: "APPROVE" | "REJECT") => {
    setBusy(id);
    try {
      await onDecide(id, action, replies[id] ?? "");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionTitle kicker="Queue 01 · live" title="Course Applications" />
        <FilterChips<Filter>
          options={[
            { key: "ALL", label: "ALL", count: items.length },
            { key: "PENDING", label: "PENDING", count: items.filter((a) => a.status === "PENDING").length },
            { key: "APPROVED", label: "APPROVED", count: items.filter((a) => a.status === "APPROVED").length },
            { key: "REJECTED", label: "REJECTED", count: items.filter((a) => a.status === "REJECTED").length },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </div>

      {visible.length === 0 ? (
        <div className="glass-dash grid place-items-center overflow-hidden rounded-[1.75rem] px-6 py-16 text-center">
          <p className="font-display text-4xl font-extrabold text-slate-200">∅</p>
          <p className="mt-3 font-display text-[0.95rem] font-bold text-slate-500">No applications here</p>
          <p className="font-mono text-[0.7rem] text-slate-400">Incoming requests will stream in live.</p>
        </div>
      ) : (
        visible.map((a, i) => {
          const open = expanded === a.id;
          const isPending = a.status === "PENDING";
          const isFresh = freshIds.has(a.id);
          return (
            <motion.article
              key={a.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease, delay: Math.min(0.12, i * 0.03) }}
              className={cn(
                "glass-dash relative overflow-hidden rounded-[1.5rem] transition-all duration-300",
                open ? "ring-2 ring-indigo-400/60" : "hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-20px_rgb(99_102_241/0.4)]",
                isFresh && isPending && "animate-[glow-breathe_6s_ease-in-out_infinite]"
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute left-0 top-0 h-full w-1 bg-gradient-to-b transition-opacity",
                  isPending ? "from-indigo-500 to-violet-500 opacity-100" : "opacity-0"
                )}
              />
              {isFresh && isPending ? (
                <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-2.5 py-0.5 font-mono text-[0.55rem] font-black uppercase tracking-widest text-white shadow-lg">
                  <span className="h-1 w-1 animate-pulse rounded-full bg-white" /> New
                </span>
              ) : null}

              <button
                type="button"
                onClick={() => setExpanded(open ? null : a.id)}
                className="flex w-full flex-wrap items-center gap-4 px-5 py-4 text-left"
              >
                <AvatarInitial name={a.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 pr-10 sm:pr-16">
                    <h3 className="font-display text-[1.02rem] font-extrabold text-slate-900">{a.name}</h3>
                    <span className={cn(
                      "rounded-full border px-2.5 py-0.5 font-mono text-[0.6rem] font-bold",
                      isPending ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white/70 text-slate-500"
                    )}>
                      {a.course}
                    </span>
                  </div>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[0.68rem] text-slate-400">
                    <span className="inline-flex items-center gap-1">{a.email}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{a.place}</span>
                    <span>
                      {new Date(a.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </p>
                </div>
                <span className="ml-auto flex items-center gap-2">
                  <StatusPill status={a.status} />
                  <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", open && "rotate-180")} />
                </span>
              </button>

              {open ? (
                <div className="relative border-t border-white/70 px-5 py-4">
                  <p className="flex items-start gap-2 font-display text-[0.92rem] leading-relaxed text-slate-700">
                    <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
                    {a.bio}
                  </p>
                  {a.message ? (
                    <p className="mt-3 flex items-start gap-2 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 font-display text-[0.88rem] text-slate-600">
                      <MessageSquareQuote className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
                      <span>
                        <span className="mr-2 font-display text-[0.55rem] font-bold uppercase tracking-[0.24em] text-indigo-500">Note</span>
                        {a.message}
                      </span>
                    </p>
                  ) : null}
                  {a.adminMessage ? (
                    <p className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 font-display text-[0.88rem] text-emerald-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span>
                        <span className="mr-2 font-display text-[0.55rem] font-bold uppercase tracking-[0.24em] text-emerald-500">Reply</span>
                        {a.adminMessage}
                      </span>
                    </p>
                  ) : null}

                  {isPending ? (
                    <div className="mt-4 flex flex-col gap-3 border-t border-white/70 pt-4 sm:flex-row sm:items-center">
                      <input
                        value={replies[a.id] ?? ""}
                        onChange={(e) => setReplies((r) => ({ ...r, [a.id]: e.target.value }))}
                        placeholder="Approve message (student sees this live)…"
                        className="flex-1 rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 font-display text-[0.85rem] text-slate-800 outline-none transition-all backdrop-blur-md placeholder:text-slate-400/70 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => decide(a.id, "APPROVE")}
                          disabled={busy === a.id}
                          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 font-display text-[0.78rem] font-extrabold text-white shadow-[0_14px_30px_-12px_rgb(99_102_241/0.8)] transition-all hover:brightness-110 disabled:opacity-50"
                        >
                          {busy === a.id ? <Spin /> : <Check className="h-4 w-4" />} Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => decide(a.id, "REJECT")}
                          disabled={busy === a.id}
                          className="inline-flex items-center gap-2 rounded-full border border-rose-300 bg-white/60 px-5 py-2.5 font-display text-[0.78rem] font-bold text-rose-600 transition-all hover:bg-rose-50 disabled:opacity-50"
                        >
                          {busy === a.id ? <Spin /> : <X className="h-4 w-4" />} Reject
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </motion.article>
          );
        })
      )}
    </section>
  );
}

function Spin() {
  return <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-200/50 border-t-indigo-600" />;
}