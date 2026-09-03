"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, CheckCircle, ChevronRight, ListChecks, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

interface Chapter {
  title: string;
  completed: boolean;
  completedAt?: string | null;
}

interface ProgressData {
  id: string;
  enrollmentId: string;
  course: string;
  chapters: Chapter[];
  attendance: Array<{ date: string; attended: boolean; topic?: string }>;
  lastChapter?: string | null;
  updatedAt: string;
}

export function ProgressCard({ progress, onToggleChapter }: {
  progress: ProgressData | null;
  onToggleChapter?: (enrollmentId: string, chapterTitle: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!progress || !progress.chapters.length) {
    return (
      <section className="glass-dash relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600">
            <Target className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div>
            <p className="font-display text-[0.6rem] font-bold uppercase tracking-[0.36em] text-emerald-600">Progress</p>
            <p className="font-display text-[0.95rem] font-bold">Start learning to track your progress</p>
          </div>
        </div>
      </section>
    );
  }

  const completedCount = progress.chapters.filter((c) => c.completed).length;
  const totalCount = progress.chapters.length;
  const percent = Math.round((completedCount / totalCount) * 100);
  const attendedCount = progress.attendance.filter((a) => a.attended).length;

  const displayedChapters = expanded ? progress.chapters : progress.chapters.slice(0, 5);

  return (
    <section className="glass-dash relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-emerald-400/20 blur-3xl" />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600">
            <ListChecks className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div>
            <p className="font-display text-[0.6rem] font-bold uppercase tracking-[0.36em] text-emerald-600">Progress</p>
            <p className="font-display text-[1rem] font-extrabold">{progress.course}</p>
          </div>
        </div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-mono text-[0.62rem] font-bold text-emerald-700">
          {percent}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative mt-4">
        <div className="flex items-center justify-between font-mono text-[0.6rem] uppercase tracking-widest text-slate-500">
          <span>Chapters completed</span>
          <span>{completedCount}/{totalCount}</span>
        </div>
        <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-200/80">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 1, ease }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
          />
        </div>
      </div>

      {/* Quick stats */}
      <div className="relative mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-white/60 px-3 py-2.5 text-center">
          <p className="font-display text-[1.1rem] font-black text-emerald-600">{attendedCount}</p>
          <p className="font-mono text-[0.55rem] uppercase tracking-widest text-slate-500">Classes attended</p>
        </div>
        <div className="rounded-xl bg-white/60 px-3 py-2.5 text-center">
          <p className="font-display text-[1.1rem] font-black text-teal-600">{completedCount}</p>
          <p className="font-mono text-[0.55rem] uppercase tracking-widest text-slate-500">Chapters done</p>
        </div>
        <div className="rounded-xl bg-white/60 px-3 py-2.5 text-center">
          <p className="font-display text-[1.1rem] font-black text-indigo-600">{totalCount - completedCount}</p>
          <p className="font-mono text-[0.55rem] uppercase tracking-widest text-slate-500">Remaining</p>
        </div>
      </div>

      {/* Continue learning */}
      {progress.lastChapter ? (
        <div className="relative mt-4 rounded-xl border border-emerald-200/70 bg-emerald-50/70 px-4 py-3">
          <p className="font-display text-[0.58rem] font-bold uppercase tracking-[0.26em] text-emerald-600">Continue learning</p>
          <p className="mt-1 text-[0.88rem] font-semibold text-slate-700">{progress.lastChapter}</p>
        </div>
      ) : null}

      {/* Chapter checklist */}
      <div className="relative mt-5">
        <p className="font-display text-[0.62rem] font-bold uppercase tracking-[0.26em] text-slate-500">Chapter checklist</p>
        <div className="mt-3 flex flex-col gap-2">
          {displayedChapters.map((ch) => (
            <button
              key={ch.title}
              type="button"
              onClick={() => onToggleChapter?.(progress.enrollmentId, ch.title)}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200",
                ch.completed
                  ? "border-emerald-200 bg-emerald-50/60"
                  : "border-white/80 bg-white/60 hover:border-emerald-200 hover:bg-emerald-50/40"
              )}
            >
              <span
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2 transition-colors",
                  ch.completed
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-slate-300 bg-white text-transparent"
                )}
              >
                {ch.completed ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
              </span>
              <span className={cn(
                "flex-1 text-[0.85rem] font-medium",
                ch.completed ? "text-emerald-700 line-through decoration-emerald-300" : "text-slate-700"
              )}>
                {ch.title}
              </span>
              {ch.completed ? (
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
              )}
            </button>
          ))}
        </div>

        {progress.chapters.length > 5 ? (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="mt-3 flex items-center gap-1 font-display text-[0.78rem] font-bold text-indigo-600 hover:text-indigo-800"
          >
            {expanded ? "Show less" : `Show all ${progress.chapters.length} chapters`}
            <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-90")} />
          </button>
        ) : null}
      </div>

      {/* Last updated */}
      <p className="relative mt-4 font-mono text-[0.56rem] text-slate-400">
        Last updated {new Date(progress.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
      </p>
    </section>
  );
}
