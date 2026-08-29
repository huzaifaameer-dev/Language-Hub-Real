"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Check, GraduationCap, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminEnrollment } from "./types";
import { AvatarInitial, FilterChips, SectionTitle, StatusPill } from "./ui";

type Filter = "ALL" | "PENDING" | "ENROLLED" | "REJECTED";

const ease = [0.16, 1, 0.3, 1] as const;

export function AdminEnrollments({
  items, onDecide, freshIds,
}: {
  items: AdminEnrollment[];
  onDecide: (id: string, action: "ENROLL" | "REJECT", message: string) => Promise<void>;
  freshIds: Set<string>;
}) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const visible = items.filter((e) => filter === "ALL" || e.status === filter);

  const decide = async (id: string, action: "ENROLL" | "REJECT") => {
    setBusy(id);
    try {
      await onDecide(id, action, reply);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionTitle kicker="Queue 02 · live" title="Enrollment Requests" />
        <FilterChips<Filter>
          options={[
            { key: "ALL", label: "ALL", count: items.length },
            { key: "PENDING", label: "PENDING", count: items.filter((e) => e.status === "PENDING").length },
            { key: "ENROLLED", label: "ENROLLED", count: items.filter((e) => e.status === "ENROLLED").length },
            { key: "REJECTED", label: "REJECTED", count: items.filter((e) => e.status === "REJECTED").length },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </div>

      {visible.length === 0 ? (
        <div className="glass-dash grid place-items-center overflow-hidden rounded-[1.75rem] px-6 py-16 text-center">
          <p className="font-display text-4xl font-extrabold text-slate-200">∅</p>
          <p className="mt-3 font-display text-[0.95rem] font-bold text-slate-500">No enrollment requests here</p>
          <p className="font-mono text-[0.7rem] text-slate-400">New requests will stream in live.</p>
        </div>
      ) : (
        visible.map((e, i) => {
          const isPending = e.status === "PENDING";
          const isEnrolled = e.status === "ENROLLED";
          const isFresh = freshIds.has(e.id);
          return (
            <motion.article
              key={e.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease, delay: Math.min(0.12, i * 0.03) }}
              className={cn(
                "glass-dash relative overflow-hidden rounded-[1.5rem] p-5 transition-all duration-300",
                isPending
                  ? "hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-20px_rgb(217_70_239/0.4)]"
                  : isEnrolled
                    ? "ring-1 ring-violet-300"
                    : "",
                isFresh && isPending && "animate-[glow-breathe_6s_ease-in-out_infinite]"
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute left-0 top-0 h-full w-1 bg-gradient-to-b transition-opacity",
                  isPending ? "from-fuchsia-500 to-violet-500 opacity-100" : isEnrolled ? "from-violet-500 to-indigo-500 opacity-100" : "opacity-0"
                )}
              />
              {isFresh && isPending ? (
                <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 px-2.5 py-0.5 font-mono text-[0.55rem] font-black uppercase tracking-widest text-white shadow-lg">
                  <span className="h-1 w-1 animate-pulse rounded-full bg-white" /> New
                </span>
              ) : null}

              <div className="relative flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-4 pr-16">
                  <AvatarInitial name={e.name} />
                  <div>
                    <h3 className="font-display text-[1.02rem] font-extrabold text-slate-900">{e.name}</h3>
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[0.68rem] text-slate-400">
                      <span>{e.email}</span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(e.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </p>
                  </div>
                </div>
                <StatusPill status={e.status} />
              </div>

              <div className="relative mt-4 flex flex-wrap gap-2">
                {e.subjects.map((s) => (
                  <span key={s} className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 font-mono text-[0.68rem] font-bold text-violet-700">
                    {s}
                  </span>
                ))}
                <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 font-mono text-[0.68rem] text-slate-500 backdrop-blur-md">
                  Batch · {e.batch}
                </span>
              </div>

              {e.plan ? (
                <p className="relative mt-3 font-display text-[0.9rem] leading-relaxed text-slate-600">{e.plan}</p>
              ) : null}

              {e.adminMessage ? (
                <p className="relative mt-3 flex items-start gap-2 rounded-xl border border-violet-100 bg-violet-50/60 p-3 font-display text-[0.88rem] text-violet-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                  <span>
                    <span className="mr-2 font-display text-[0.55rem] font-bold uppercase tracking-[0.24em] text-violet-500">Reply</span>
                    {e.adminMessage}
                  </span>
                </p>
              ) : null}

              {isPending ? (
                <div className="relative mt-4 flex flex-col gap-3 border-t border-white/70 pt-4 sm:flex-row sm:items-center">
                  <input
                    value={reply}
                    onChange={(e2) => setReply(e2.target.value)}
                    placeholder="Enrollment confirmation message…"
                    className="flex-1 rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 font-display text-[0.85rem] text-slate-800 outline-none transition-all backdrop-blur-md placeholder:text-slate-400/70 focus:border-fuchsia-400 focus:ring-4 focus:ring-fuchsia-500/15"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => decide(e.id, "ENROLL")}
                      disabled={busy === e.id}
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 font-display text-[0.78rem] font-extrabold text-white shadow-[0_14px_30px_-12px_rgb(139_92_246/0.8)] transition-all hover:brightness-110 disabled:opacity-50"
                    >
                      {busy === e.id ? <Spin /> : <GraduationCap className="h-4 w-4" />} Enroll Student
                    </button>
                    <button
                      type="button"
                      onClick={() => decide(e.id, "REJECT")}
                      disabled={busy === e.id}
                      className="inline-flex items-center gap-2 rounded-full border border-rose-300 bg-white/60 px-5 py-2.5 font-display text-[0.78rem] font-bold text-rose-600 transition-all hover:bg-rose-50 disabled:opacity-50"
                    >
                      {busy === e.id ? <Spin /> : <X className="h-4 w-4" />} Reject
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative mt-4 flex items-center gap-2 border-t border-white/70 pt-4 font-mono text-[0.62rem] font-bold uppercase tracking-[0.24em] text-slate-400">
                  <span className={cn("h-1.5 w-1.5 rounded-full", isEnrolled ? "bg-violet-500" : "bg-rose-400")} />
                  {isEnrolled ? "Student enrolled — books assigned" : "Student not enrolled"}
                </div>
              )}
            </motion.article>
          );
        })
      )}
    </section>
  );
}

function Spin() {
  return <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-violet-200/50 border-t-violet-600" />;
}