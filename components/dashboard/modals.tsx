"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, MessageCircle, X } from "lucide-react";
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

export function EnrolledCelebration({
  name,
  subjects,
  supportWhatsapp,
  onDone,
}: {
  name: string;
  subjects: string[];
  supportWhatsapp?: string | null;
  onDone: () => void;
}) {
  const [showNumber, setShowNumber] = useState(false);
  const waHref = `https://wa.me/${supportWhatsapp ?? ""}`;
  const displayNumber = supportWhatsapp ? `+${supportWhatsapp}` : "";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[60] grid place-items-center overflow-hidden bg-[#0a0f1e]/85 px-5 backdrop-blur-lg"
      role="dialog"
      aria-modal="true"
      aria-label="Enrollment successful"
    >
      {/* ambient premium glows */}
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[8%] h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-600/25 blur-[90px]" />
      <div aria-hidden className="pointer-events-none absolute bottom-[6%] left-[12%] h-56 w-56 rounded-full bg-fuchsia-600/15 blur-[80px]" />
      <div aria-hidden className="pointer-events-none absolute bottom-[10%] right-[10%] h-56 w-56 rounded-full bg-emerald-500/15 blur-[80px]" />
      <span aria-hidden className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(rgb(255 255 255 / 0.06) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />

      <div className="relative flex w-full max-w-lg flex-col items-center text-center">
        {/* animated badge */}
        <div className="relative grid h-32 w-32 place-items-center sm:h-36 sm:w-36">
          {/* pulse halo */}
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full border-2 border-indigo-400/50"
            animate={{ scale: [1, 1.7], opacity: [0.8, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full border-2 border-fuchsia-400/40"
            animate={{ scale: [1, 1.45], opacity: [0.7, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: 0.6, ease: "easeOut" }}
          />
          <motion.div
            initial={{ scale: 0.7, rotate: -12, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 16 }}
            className="relative grid h-24 w-24 place-items-center rounded-[1.75rem] bg-gradient-to-br from-indigo-500 via-blue-600 to-fuchsia-600 shadow-[0_30px_70px_-24px_rgb(99_102_241/0.9)] ring-1 ring-white/20 sm:h-28 sm:w-28"
          >
            <svg viewBox="0 0 52 52" className="h-14 w-14 sm:h-16 sm:w-16">
              <path
                d="M14 27 L22 35 L38 18"
                fill="none"
                stroke="#fff"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="60"
                strokeDashoffset="60"
                style={{ animation: "check-draw 0.7s cubic-bezier(0.16,1,0.3,1) 0.25s forwards" }}
              />
            </svg>
          </motion.div>
        </div>

        {/* eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-6 font-mono text-[0.62rem] font-bold uppercase tracking-[0.42em] text-emerald-400"
        >
          Welcome to Language Hub
        </motion.p>

        {/* title */}
        <motion.h3
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.55 }}
          className="mt-3 font-display text-[clamp(1.9rem,6vw,2.7rem)] font-extrabold tracking-[-0.03em] text-white"
        >
          You&apos;re <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-fuchsia-400 bg-clip-text text-transparent">enrolled</span> 🎉
        </motion.h3>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.72, duration: 0.5 }}
          className="mt-3 max-w-sm text-[1rem] leading-relaxed text-slate-300"
        >
          <span className="font-bold text-white">{name}</span>, great to have you aboard. Our team
          will be in touch with you about your class details.
        </motion.p>

        {/* courses */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.5 }}
          className="mt-6 flex flex-wrap justify-center gap-2"
        >
          {subjects.slice(0, 4).map((s, i) => (
            <motion.span
              key={s}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 + i * 0.08, duration: 0.4 }}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-1.5 font-display text-[0.72rem] font-bold text-emerald-300"
            >
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {s}
            </motion.span>
          ))}
        </motion.div>

        {/* WhatsApp contact */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.5 }}
          className="mt-7 w-full max-w-sm"
        >
          {showNumber ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
              <p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.28em] text-slate-400">
                Contact us on WhatsApp
              </p>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] font-display text-[0.9rem] font-bold text-white shadow-[0_16px_36px_-14px_rgb(37_211_102/0.8)] transition-all hover:-translate-y-0.5 hover:brightness-110"
              >
                <MessageCircle className="h-4.5 w-4.5" />
                {displayNumber || "Open WhatsApp"}
              </a>
              <button
                type="button"
                onClick={() => setShowNumber(false)}
                className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.2em] text-slate-400 transition-colors hover:text-white"
              >
                Hide number
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowNumber(true)}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-500/10 font-display text-[0.85rem] font-bold text-emerald-300 transition-all hover:-translate-y-0.5 hover:bg-emerald-500/20"
            >
              <MessageCircle className="h-4.5 w-4.5" />
              Contact us on WhatsApp
            </button>
          )}
        </motion.div>

        <motion.button
          type="button"
          onClick={onDone}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.4 }}
          className="mt-6 inline-flex h-[3rem] items-center justify-center gap-2 rounded-full bg-white/10 px-8 font-display text-[0.85rem] font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20"
        >
          Continue to dashboard
          <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
        </motion.button>
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