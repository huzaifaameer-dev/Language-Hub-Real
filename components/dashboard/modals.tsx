"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FocusTrap, LiveRegion, useEscapeKey } from "@/components/ui/FocusTrap";
import { ErrorNote } from "@/components/dashboard/ui";
import type { CourseInfo } from "@/lib/course-data";

const ease = [0.16, 1, 0.3, 1] as const;

export function EnrollmentModal({
  catalog, selected, batch, plan, errors, error, busy, onToggle, onBatch, onPlan, onClose, onSubmit,
}: {
  catalog: CourseInfo[];
  selected: string[];
  batch: string;
  plan: string;
  errors: Record<string, string[]> | null;
  error: string | null;
  busy: boolean;
  onToggle: (c: string) => void;
  onBatch: (b: string) => void;
  onPlan: (v: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const batchOptions = Array.from(new Set(catalog.flatMap((c) => c.batches.map((b) => b.name))));
  const soloCourse = selected.length === 1 ? catalog.find((c) => c.name === selected[0]) : undefined;
  const seatsKnown = !!soloCourse && soloCourse.batches.some((b) => b.seatsLeft !== undefined);
  const soloBatchMeta = new Map<string, { time: string; total: number; left: number; full: boolean }>();
  if (seatsKnown && soloCourse) {
    for (const b of soloCourse.batches) {
      soloBatchMeta.set(b.name, {
        time: b.time,
        total: b.seatsTotal ?? 1,
        left: b.seatsLeft ?? 0,
        full: !!b.full || (b.seatsLeft ?? 0) <= 0,
      });
    }
  }
  const soloSeats = seatsKnown && soloCourse
    ? {
        total: soloCourse.batches.reduce((n, b) => n + (b.seatsTotal ?? 0), 0),
        left: soloCourse.batches.reduce((n, b) => n + (b.seatsLeft ?? 0), 0),
      }
    : undefined;

  useEscapeKey(onClose, true);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/45 px-5 py-10 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Enroll in courses"
    >
      <motion.div
        initial={{ opacity: 0, y: 36, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease }}
        className="relative w-full max-w-lg rounded-[2rem] border border-white/70 bg-white/95 p-7 shadow-[0_40px_90px_-30px_rgb(15_23_42/0.55)] backdrop-blur-2xl sm:p-9"
      >
        <FocusTrap active>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-400 transition-all duration-300 hover:rotate-90 hover:border-slate-300 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>

          <p className="flex items-center gap-3 font-display text-[0.58rem] font-bold uppercase tracking-[0.36em] text-indigo-600">
            <span aria-hidden className="h-px w-6 bg-indigo-500/40" /> Seat confirmation
          </p>
          <h3 className="mt-1.5 font-display text-[1.5rem] font-extrabold tracking-[-0.02em]">
            ENROLL IN <span className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">COURSES.</span>
          </h3>
          <p className="mt-1.5 text-[0.9rem] text-slate-500">
            Pick one to four subjects and your preferred batch — the admin will confirm your seat.
          </p>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <label className="font-display text-[0.66rem] font-bold uppercase tracking-[0.2em] text-slate-600">Subjects</label>
              <span className="font-mono text-[0.62rem] text-slate-400">{selected.length}/4</span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {catalog.map((c) => {
                const on = selected.includes(c.name);
                const full = selected.length >= 4 && !on;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => onToggle(c.name)}
                    disabled={full}
                    className={cn(
                      "flex items-center justify-between gap-2.5 rounded-xl border px-3.5 py-3 text-left font-display text-[0.82rem] font-bold transition-all duration-200",
                      on
                        ? "border-indigo-500 bg-indigo-500/10 text-indigo-700 shadow-[0_8px_20px_-8px_rgb(99_102_241/0.5)]"
                        : "border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-indigo-300 hover:text-slate-900",
                      full && "cursor-not-allowed opacity-40"
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className={cn(
                        "grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors",
                        on ? "border-indigo-500 bg-indigo-600 text-white" : "border-slate-300"
                      )}>
                        {on ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                      </span>
                      {c.name}
                    </span>
                    {c.fee ? (
                      <span className="shrink-0 font-mono text-[0.62rem] font-bold text-slate-400">
                        {c.fee.toLocaleString("en-PK")}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            {errors?.subjects ? <p className="mt-2 text-[0.78rem] font-medium text-rose-600">{errors.subjects[0]}</p> : null}
          </div>

          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between">
              <label className="font-display text-[0.66rem] font-bold uppercase tracking-[0.2em] text-slate-600">
                Batch
              </label>
              {soloSeats ? (
                <span className="font-mono text-[0.62rem] font-bold text-indigo-600">
                  {soloSeats.left}/{soloSeats.total} seats free
                </span>
              ) : null}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {batchOptions.map((b) => {
                const meta = soloBatchMeta.get(b);
                const full = !!meta?.full;
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => onBatch(b)}
                    disabled={full}
                    className={cn(
                      "rounded-xl border px-3.5 py-3 text-left transition-all duration-200",
                      batch === b
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-[0_10px_24px_-10px_rgb(99_102_241/0.7)]"
                        : "border-slate-200 bg-white text-slate-500 hover:-translate-y-0.5 hover:border-indigo-300 hover:text-slate-900",
                      full && "cursor-not-allowed opacity-40"
                    )}
                  >
                    <span className="block font-mono text-[0.72rem] font-bold tracking-widest">
                      {b.toUpperCase()}
                    </span>
                    {meta ? (
                      <span
                        className={cn(
                          "mt-0.5 block font-mono text-[0.58rem] font-semibold tracking-normal",
                          batch === b
                            ? "text-white/75"
                            : full
                              ? "text-rose-500"
                              : "text-slate-400"
                        )}
                      >
                        {[meta.time, full ? "FULL" : `${meta.left}/${meta.total} seats`]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            {error ? <ErrorNote>{error}</ErrorNote> : null}
          </div>

          <div className="mt-5">
            <label htmlFor="enr-plan" className="mb-1.5 block font-display text-[0.66rem] font-bold uppercase tracking-[0.2em] text-slate-600">
              Study plan <span className="normal-case text-slate-400">(optional)</span>
            </label>
            <textarea
              id="enr-plan"
              value={plan}
              onChange={(e) => onPlan(e.target.value)}
              rows={3}
              maxLength={800}
              placeholder="Tell us about your goals, current level, or study schedule."
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-[0.9rem] text-slate-900 shadow-[0_1px_2px_rgb(15_23_42/0.04)] outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/12"
            />
            <span className="mt-1 block text-right font-mono text-[0.68rem] text-slate-400">{plan.length}/800</span>
            {errors?.plan ? <p className="text-[0.78rem] font-medium text-rose-600">{errors.plan[0]}</p> : null}
          </div>

          <button
            type="button"
            onClick={onSubmit}
            disabled={busy}
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 font-display text-[0.95rem] font-bold text-white shadow-[0_14px_30px_-12px_rgb(99_102_241/0.75)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-12px_rgb(99_102_241/0.85)] hover:brightness-[1.05] disabled:opacity-60"
          >
            {busy ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                Confirm Enrollment
                <span className="inline-block transition-transform duration-500 group-hover:translate-x-1">→</span>
              </>
            )}
          </button>
        </FocusTrap>
        <LiveRegion text={error ?? (busy ? "Submitting enrollment…" : null)} />
      </motion.div>
    </motion.div>
  );
}

export function EnrolledCelebration({ name, subjects, onDone }: { name: string; subjects: string[]; onDone: () => void }) {
  const rings = [
    { size: 120, delay: "0s", border: "rgb(99 102 241 / 0.7)" },
    { size: 170, delay: "0.35s", border: "rgb(168 85 247 / 0.5)" },
    { size: 220, delay: "0.7s", border: "rgb(217 70 239 / 0.4)" },
  ];
  const confetti = [
    { left: "12%", top: "18%", "--dx": "-30px", "--dy": "86px", color: "#6366f1", delay: "0s" },
    { left: "26%", top: "12%", "--dx": "40px", "--dy": "110px", color: "#d946ef", delay: "0.18s" },
    { left: "42%", top: "8%", "--dx": "-24px", "--dy": "120px", color: "#0ea5e9", delay: "0.36s" },
    { left: "58%", top: "10%", "--dx": "28px", "--dy": "115px", color: "#16a34a", delay: "0.12s" },
    { left: "72%", top: "16%", "--dx": "-34px", "--dy": "95px", color: "#8b5cf6", delay: "0.28s" },
    { left: "86%", top: "22%", "--dx": "-16px", "--dy": "80px", color: "#c084fc", delay: "0.44s" },
    { left: "18%", top: "70%", "--dx": "50px", "--dy": "-70px", color: "#0ea5e9", delay: "0.2s" },
    { left: "82%", top: "64%", "--dx": "-42px", "--dy": "-64px", color: "#6366f1", delay: "0.38s" },
  ];
  const title = "ENROLLMENT SUCCESSFUL.";
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[60] grid place-items-center overflow-hidden bg-slate-50/95 px-5 backdrop-blur-md"
    >
      {confetti.map((c, i) => (
        <span
          key={i}
          aria-hidden
          className="absolute h-2.5 w-2.5 rounded-sm"
          style={{
            left: c.left,
            top: c.top,
            background: c.color,
            animation: `confetti-burst 0.9s cubic-bezier(0.22,1,0.36,1) ${c.delay} both`,
            ...(c as unknown as React.CSSProperties),
          }}
        />
      ))}

      <div className="relative flex w-full max-w-lg flex-col items-center text-center">
        <div className="relative grid h-56 w-56 place-items-center sm:h-64 sm:w-64">
          {rings.map((r, i) => (
            <span
              key={i}
              aria-hidden
              className="absolute rounded-full border-2"
              style={{ width: r.size, height: r.size, borderColor: r.border, animation: `burst-ring 1.6s cubic-bezier(0.22,1,0.36,1) ${r.delay} both` }}
            />
          ))}
          <span aria-hidden className="absolute inset-0 animate-spin rounded-full border border-dashed border-indigo-400/60" style={{ animation: "spin-dash 8s linear infinite" }} />
          <svg viewBox="0 0 56 56" className="relative h-36 w-36">
            <circle cx="28" cy="28" r="25" fill="none" stroke="rgb(99 102 241 / 0.25)" strokeWidth="2" />
            <circle
              cx="28" cy="28" r="25" fill="none" stroke="url(#enrGrad)" strokeWidth="2.5"
              strokeLinecap="round" strokeDasharray="157" strokeDashoffset="157"
              style={{ animation: "check-draw 1s cubic-bezier(0.65,0,0.35,1) 0.1s forwards" }}
            />
            <path
              d="M17 29 L25 37 L39 21"
              fill="none"
              stroke="#6366f1"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="84"
              strokeDashoffset="84"
              style={{ animation: "check-draw 0.7s ease-out 0.85s forwards" }}
            />
            <defs>
              <linearGradient id="enrGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#d946ef" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-2 font-display text-[clamp(1.9rem,6vw,2.7rem)] font-extrabold tracking-[-0.03em]"
        >
          {Array.from(title).map((ch, i) => (
              <span
                key={i}
                className={ch === " " ? "inline-block w-3" : "inline-block indigo-text-shimmer"}
                style={{ animation: `letter-rise 0.6s cubic-bezier(0.22,1,0.36,1) ${0.4 + i * 0.045}s both` }}
              >
                {ch === " " ? "\u00A0" : ch}
              </span>
            ))}
        </motion.h3>
        <p className="mt-3 text-[1rem] text-slate-500">
          <span className="font-bold not-italic text-indigo-600">{name}</span>, welcome aboard — your seat is locked in and your books are ready.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {subjects.slice(0, 4).map((s) => (
            <span key={s} className="rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 font-mono text-[0.68rem] font-bold text-emerald-700">
              {s}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={onDone}
          className="mt-8 inline-flex h-[3.1rem] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-8 font-display text-[0.9rem] font-bold text-white shadow-[0_16px_36px_-14px_rgb(99_102_241/0.7)] transition-all duration-500 hover:-translate-y-0.5 hover:brightness-[1.05]"
        >
          Enter my classroom
          <span className="inline-block transition-transform duration-500 group-hover:translate-x-1">→</span>
        </button>
      </div>
    </motion.div>
  );
}

export function ApplicationCelebration() {
  const sparks = [
    { "--sx": "70px", "--sy": "-80px", color: "#6366f1", left: "22%", top: "30%", delay: "0s" },
    { "--sx": "-80px", "--sy": "-50px", color: "#d946ef", left: "58%", top: "22%", delay: "0.15s" },
    { "--sx": "90px", "--sy": "-30px", color: "#0ea5e9", left: "35%", top: "12%", delay: "0.3s" },
    { "--sx": "-60px", "--sy": "-90px", color: "#16a34a", left: "72%", top: "35%", delay: "0.45s" },
    { "--sx": "30px", "--sy": "-100px", color: "#8b5cf6", left: "15%", top: "55%", delay: "0.12s" },
    { "--sx": "-40px", "--sy": "-110px", color: "#c084fc", left: "68%", top: "60%", delay: "0.28s" },
  ];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/45 px-5 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="relative w-full max-w-md animate-success-pop rounded-[1.75rem] border border-slate-200 bg-white p-10 text-center shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Application sent"
      >
        {sparks.map((s, i) => (
          <span
            key={i}
            aria-hidden
            className="spark"
            style={{ ...(s as React.CSSProperties), animationDelay: s.delay, color: s.color }}
          />
        ))}

        <div className="relative mx-auto grid h-28 w-28 place-items-center">
          <span aria-hidden className="absolute inset-0 animate-ring-spread rounded-full border-2 border-indigo-400/70" />
          <span aria-hidden className="absolute inset-0 animate-ring-spread rounded-full border border-violet-500/40" style={{ animationDelay: "0.4s" }} />
          <svg viewBox="0 0 56 56" className="h-28 w-28">
            <circle cx="28" cy="28" r="25" fill="none" stroke="rgb(99 102 241 / 0.3)" strokeWidth="2" />
            <circle
              cx="28" cy="28" r="25" fill="none" stroke="#4f46e5" strokeWidth="2.5"
              strokeLinecap="round" strokeDasharray="157" strokeDashoffset="157"
              style={{ animation: "check-draw 0.9s cubic-bezier(0.65,0,0.35,1) 0.1s forwards" }}
            />
            <path
              d="M17 29 L25 37 L39 21"
              fill="none"
              stroke="#6366f1"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="84"
              strokeDashoffset="84"
              style={{ animation: "check-draw 0.7s ease-out 0.75s forwards" }}
            />
          </svg>
        </div>

        <h3 className="mt-6 font-display text-2xl font-extrabold tracking-[-0.02em]">
          APPLICATION <span className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">SENT.</span>
        </h3>
        <p className="mx-auto mt-2 max-w-[22rem] text-[0.92rem] leading-relaxed text-slate-500">
          Your application is now in review — our team responds within 12 hours. Watch the status update live below.
        </p>
      </motion.div>
    </motion.div>
  );
}