"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Pause, Play, Sparkles, X } from "lucide-react";
import { BookDemoButton } from "@/components/contact/BookDemoButton";
import { useBodyScrollLock, useReducedMotionSafe } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    eyebrow: "Live, not recorded",
    title: "Small-batch classes where everyone speaks.",
    body: "Real conversation from the first minute — role-plays, pronunciation coaching and instant correction.",
  },
  {
    eyebrow: "Feedback that lands",
    title: "You hear exactly what to fix next.",
    body: "Every session ends with one clear win and one clear focus, so progress never feels vague.",
  },
  {
    eyebrow: "Exam-ready",
    title: "Mocks that feel harder than test day.",
    body: "Weekly timed mocks with examiner-style reviews for IELTS, PTE and Duolingo.",
  },
];

/**
 * Reference-style "Play Video" control. Instead of shipping a fake video it
 * opens an honest, animated 60-second class overview with a real next step.
 */
export function ClassPreview() {
  const [open, setOpen] = useState(false);
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotionSafe();

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open || paused || reduce) return;
    const id = window.setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 4200);
    return () => window.clearInterval(id);
  }, [open, paused, reduce]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group inline-flex items-center gap-3.5"
        aria-label="Watch a 60-second overview of a live class"
      >
        <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#fb6a47] text-white shadow-[0_18px_32px_-14px_rgba(232,84,47,0.8)] transition-transform duration-500 group-hover:scale-105">
          <motion.span
            aria-hidden
            animate={reduce ? undefined : { scale: [1, 1.35], opacity: [0.45, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0 rounded-full bg-[#fb6a47]"
          />
          <Play className="relative ml-0.5 h-5 w-5 fill-current" strokeWidth={0} />
        </span>
        <span className="flex flex-col items-start leading-tight">
          <span className="font-display text-[0.95rem] font-bold text-ink">Watch Demo</span>
          <span className="mt-0.5 font-sans text-[0.7rem] font-medium text-ink-3">60-second class tour</span>
        </span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[170] flex items-center justify-center bg-[#062e28]/55 p-4 backdrop-blur-md"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Live class overview"
          >
            <motion.div
              initial={{ opacity: 0, y: 22, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl overflow-hidden rounded-[1.8rem] border border-white/15 bg-[#073b33] shadow-[0_60px_140px_-40px_rgba(0,0,0,0.6)]"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close overview"
                className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                <X className="h-4.5 w-4.5" strokeWidth={2} />
              </button>

              <div className="grid md:grid-cols-[1.05fr_0.95fr]">
                {/* animated poster */}
                <div
                  className={cn(
                    "relative min-h-[19rem] overflow-hidden p-7 sm:p-8",
                    open && !paused && !reduce ? "" : ""
                  )}
                  style={{
                    background:
                      "radial-gradient(90% 80% at 15% 0%, rgba(20,160,140,0.45), transparent 62%), radial-gradient(80% 80% at 100% 100%, rgba(251,106,71,0.22), transparent 60%), #073b33",
                  }}
                >
                  <span
                    aria-hidden
                    className="absolute inset-0 opacity-[0.5]"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 24px)",
                    }}
                  />
                  <Image
                    src="/brand/hero-student-teal.png"
                    alt=""
                    width={1302}
                    height={1208}
                    className="pointer-events-none absolute bottom-0 right-[-14%] w-[112%] max-w-none opacity-95"
                  />
                  <span className="relative inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 font-sans text-[0.56rem] font-bold uppercase tracking-[0.24em] text-[#b8f3e6] backdrop-blur">
                    <Sparkles className="h-3 w-3" strokeWidth={2.2} /> Inside Language Hub
                  </span>
                  <div className="relative mt-[13rem] flex items-end gap-3">
                    <button
                      type="button"
                      onClick={() => setPaused((p) => !p)}
                      aria-label={paused ? "Play overview" : "Pause overview"}
                      className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#073b33] shadow-lg"
                    >
                      {paused ? (
                        <Play className="ml-0.5 h-4 w-4 fill-current" strokeWidth={0} />
                      ) : (
                        <Pause className="h-4 w-4 fill-current" strokeWidth={0} />
                      )}
                    </button>
                    <div className="flex flex-1 items-center gap-1.5 pb-1.5">
                      {SLIDES.map((s, i) => (
                        <span key={s.eyebrow} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
                          {i === slide ? (
                            <motion.span
                              key={`${slide}-${paused}`}
                              className="block h-full rounded-full bg-[#7ef0c9]"
                              initial={{ width: "0%" }}
                              animate={{ width: paused || reduce ? "45%" : "100%" }}
                              transition={{ duration: paused || reduce ? 0.2 : 4.2, ease: "linear" }}
                            />
                          ) : i < slide ? (
                            <span className="block h-full w-full rounded-full bg-[#7ef0c9]/70" />
                          ) : null}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* captions + CTA */}
                <div className="flex flex-col justify-between gap-6 border-t border-white/10 p-7 md:border-l md:border-t-0 sm:p-8">
                  <div className="min-h-[10.5rem]">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={slide}
                        initial={reduce ? false : { opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduce ? undefined : { opacity: 0, y: -10 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <p className="font-sans text-[0.58rem] font-bold uppercase tracking-[0.26em] text-[#7ef0c9]">
                          {SLIDES[slide].eyebrow}
                        </p>
                        <h3 className="mt-3 font-display text-[1.45rem] font-extrabold leading-[1.15] tracking-[-0.02em] text-white">
                          {SLIDES[slide].title}
                        </h3>
                        <p className="mt-3 font-sans text-[0.88rem] leading-relaxed text-white/65">
                          {SLIDES[slide].body}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <BookDemoButton variant="light" className="h-12 w-full justify-center" />
                    <Link
                      href="/courses"
                      onClick={() => setOpen(false)}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/20 font-display text-[0.82rem] font-semibold text-white/85 transition-colors hover:border-[#7ef0c9]/60 hover:text-white"
                    >
                      Explore programmes
                      <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
