"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Clock, ExternalLink, Video } from "lucide-react";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

interface LiveClass {
  id: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingLink: string;
  platform: string;
  instructor: string;
  course: string;
  batch: string;
}

export function UpcomingClassesCard({ classes }: { classes: LiveClass[] }) {
  const [expanded, setExpanded] = useState(false);

  if (!classes.length) {
    return (
      <section className="glass-dash relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-sky-500/10 text-sky-600">
            <CalendarDays className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div>
            <p className="font-display text-[0.6rem] font-bold uppercase tracking-[0.36em] text-sky-600">Live Classes</p>
            <p className="font-display text-[0.95rem] font-bold">No upcoming classes scheduled</p>
          </div>
        </div>
      </section>
    );
  }

  const displayed = expanded ? classes : classes.slice(0, 3);

  return (
    <section className="glass-dash relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-sky-400/20 blur-3xl" />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-sky-500/10 text-sky-600">
            <Video className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div>
            <p className="font-display text-[0.6rem] font-bold uppercase tracking-[0.36em] text-sky-600">Upcoming Classes</p>
            <p className="font-display text-[1rem] font-extrabold">{classes.length} class{classes.length !== 1 ? "es" : ""} scheduled</p>
          </div>
        </div>
      </div>

      <div className="relative mt-5 flex flex-col gap-3">
        {displayed.map((cls, i) => {
          const dt = new Date(cls.scheduledAt);
          const now = new Date();
          const diffMs = dt.getTime() - now.getTime();
          const diffHrs = Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));
          const isSoon = diffHrs <= 2 && diffMs > 0;

          return (
            <motion.div
              key={cls.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4, ease }}
              className={cn(
                "rounded-xl border p-4 transition-all",
                isSoon
                  ? "border-sky-300 bg-sky-50/80 shadow-[0_0_0_2px_rgb(14_165_233/0.15)]"
                  : "border-white/80 bg-white/60"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="truncate font-display text-[0.92rem] font-extrabold">{cls.title}</h4>
                    {isSoon ? (
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 font-mono text-[0.55rem] font-bold text-sky-600">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-500" />
                        SOON
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 font-mono text-[0.68rem] text-slate-500">
                    {cls.course} · {cls.batch}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-[0.78rem] text-slate-500">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {dt.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {dt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="text-slate-400">{cls.durationMinutes}min</span>
                  </div>
                  <p className="mt-1 text-[0.72rem] text-slate-400">
                    with {cls.instructor}
                  </p>
                </div>
                <a
                  href={cls.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-4 font-display text-[0.78rem] font-bold text-white shadow-sm transition-all hover:-translate-y-0.5",
                    isSoon
                      ? "bg-sky-600 hover:bg-sky-700 shadow-[0_8px_20px_-8px_rgb(14_165_233/0.6)]"
                      : "bg-slate-600 hover:bg-slate-700"
                  )}
                >
                  Join
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="mt-2 font-mono text-[0.58rem] text-slate-400">
                {cls.platform}
              </p>
            </motion.div>
          );
        })}
      </div>

      {classes.length > 3 ? (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 font-display text-[0.78rem] font-bold text-sky-600 hover:text-sky-800"
        >
          {expanded ? "Show less" : `Show all ${classes.length} classes`}
        </button>
      ) : null}
    </section>
  );
}
