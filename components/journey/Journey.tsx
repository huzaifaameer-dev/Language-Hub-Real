"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useReducedMotionSafe } from "@/lib/hooks";
import { EASE_EXPO } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ArrowRight, BarChart3, Headphones, MessageSquare, Play, Users } from "lucide-react";

const STEPS = [
  {
    n: "01",
    icon: Headphones,
    title: "Fluency & Confidence",
    desc: "Speak naturally, express ideas clearly, and build confidence for real-world communication.",
    tile: "bg-[#cdeee3] text-[#2f8a74]",
  },
  {
    n: "02",
    icon: Users,
    title: "Chief Guest Sessions",
    desc: "Learn from experienced speakers and special guests who share practical insights.",
    tile: "bg-[#f6b09c] text-[#8f2f19]",
  },
  {
    n: "03",
    icon: MessageSquare,
    title: "One-on-One Sessions",
    desc: "Get personalized attention, focused practice, and feedback based on your goals.",
    tile: "bg-[#ffd97a] text-[#8a5f00]",
  },
  {
    n: "04",
    icon: BarChart3,
    title: "Mock Interviews",
    desc: "Practice real interview situations and improve communication skills with expert feedback.",
    tile: "bg-[#0d5c4d] text-white",
  },
] as const;

const CYCLE_MS = 5000;

/**
 * "Your journey" — the four experiences every programme is built around.
 * One card is highlighted at a time (peach fill, coral edge, coral bar) and the
 * highlight walks to the next card every five seconds, forever.
 */
export function Journey() {
  const reduce = useReducedMotionSafe();
  const [active, setActive] = useState(1);

  useEffect(() => {
    const id = window.setInterval(
      () => setActive((current) => (current + 1) % STEPS.length),
      CYCLE_MS
    );
    return () => window.clearInterval(id);
  }, []);

  const rise = (delay: number, y = 18) => ({
    initial: reduce ? false : { opacity: 0, y },
    whileInView: reduce ? undefined : { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-8% 0px" },
    transition: { duration: 0.65, delay, ease: EASE_EXPO },
  });

  return (
    <section
      id="journey"
      data-section
      aria-label="Your learning journey"
      className="relative overflow-hidden bg-[#fbfefd] px-5 py-20 sm:px-8 sm:py-24"
    >
      {/* soft organic field on the right */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute -right-[10%] -top-[30%] h-[46rem] w-[46rem] rounded-full bg-[#e7f8f0]" />
        <span className="absolute right-[6%] -top-[6%] h-[16rem] w-[26rem] rounded-[6rem] bg-[#77c6ab]/35" />
        <span className="absolute left-[42%] top-[64%] h-[26rem] w-[26rem] rounded-full bg-[#f2fbf7]" />
      </div>

      <div className="relative mx-auto grid max-w-[1440px] items-center gap-14 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.7fr)] xl:gap-12">
        {/* ── copy ─────────────────────────────────────────────────────── */}
        <motion.div {...rise(0)} className="relative z-10 max-w-[32rem]">
          <p className="flex items-center gap-3 font-display text-[0.7rem] font-bold uppercase tracking-[0.28em] text-[#f26a4a]">
            <span aria-hidden className="h-px w-7 bg-[#f4a78f]" />
            Your Journey
            <span aria-hidden className="h-px w-7 bg-[#f4a78f]" />
          </p>

          <h2 className="mt-5 font-display text-[clamp(2.6rem,4.6vw,4.1rem)] font-extrabold leading-[1.03] tracking-[-0.045em] text-[#0b1f1b]">
            From quiet to
            <br />
            <span className="relative inline-block text-[#0d6a58]">
              confident.
              <svg
                aria-hidden
                viewBox="0 0 300 16"
                preserveAspectRatio="none"
                className="absolute -bottom-2 left-0 h-[14px] w-full"
              >
                <path
                  d="M4 11c58-7 190-9 292-4"
                  fill="none"
                  stroke="#f26a4a"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h2>

          <p className="mt-7 max-w-[25rem] font-sans text-[1rem] leading-[1.8] text-[#5c706a]">
            Four experiences every programme is built around — a calm, continuous path
            from your first sentence to a confident communicator.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-5">
            <Link
              href="/courses"
              className="group inline-flex h-[3.35rem] items-center gap-3 rounded-full bg-[#0d5c4d] px-7 font-display text-[0.92rem] font-bold text-white shadow-[0_18px_30px_-16px_rgba(13,92,77,0.85)] transition-transform duration-300 hover:-translate-y-0.5"
            >
              Start Your Journey
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>

            <button type="button" className="group flex items-center gap-3 text-left">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-[#e3f5ec] text-[#0d5c4d] ring-1 ring-[#cfeade] transition-transform duration-300 group-hover:scale-105">
                <Play className="ml-0.5 h-4 w-4 fill-current" />
              </span>
              <span className="leading-tight">
                <span className="block font-display text-[0.82rem] font-bold text-[#10231f]">
                  Watch Video
                </span>
                <span className="mt-0.5 block font-sans text-[0.68rem] text-[#7b8f89]">
                  1 min • Learn more
                </span>
              </span>
            </button>
          </div>
        </motion.div>

        {/* ── cards ────────────────────────────────────────────────────── */}
        <div className="relative">
          {/* hand-drawn arrow from the copy toward the cards */}
          <svg
            aria-hidden
            viewBox="0 0 120 70"
            className="pointer-events-none absolute -left-10 bottom-24 hidden h-16 w-20 text-[#2f8a74] xl:block"
          >
            <path
              d="M4 60C28 58 62 48 78 26c6-8 8-14 8-18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M74 12l12 2-7 11"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* yellow sparkle accents */}
          <svg
            aria-hidden
            viewBox="0 0 42 46"
            className="pointer-events-none absolute -right-1 -top-2 hidden h-11 w-10 text-[#f2c230] lg:block"
          >
            <path d="M6 2l2.4 7.6L16 12l-7.6 2.4L6 22l-2.4-7.6L-4 12l7.6-2.4z" fill="currentColor" />
            <path d="M30 18l1.7 5.3L37 25l-5.3 1.7L30 32l-1.7-5.3L23 25l5.3-1.7z" fill="currentColor" opacity=".85" />
            <path d="M22 36l1.2 3.8L27 41l-3.8 1.2L22 46l-1.2-3.8L17 41l3.8-1.2z" fill="currentColor" opacity=".6" />
          </svg>

          <div className="relative grid items-stretch gap-8 pt-10 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 xl:gap-6 xl:pt-8">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isActive = i === active;
              return (
                <motion.div key={step.n} {...rise(0.1 + i * 0.09, 26)} className="relative">
                  <article
                    data-active={isActive || undefined}
                    className={cn(
                      "group relative flex h-full min-h-[19rem] flex-col items-center rounded-[1.4rem] border px-5 pb-8 pt-9 text-center transition-[background-color,border-color,box-shadow] duration-500 ease-out",
                      isActive
                        ? "border-[#f7b5a3] bg-[#fdf2ed] shadow-[0_28px_50px_-30px_rgba(242,106,74,0.55)]"
                        : "border-[#eef4f1] bg-white shadow-[0_20px_45px_-34px_rgba(13,71,60,0.5)]"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute -top-4 left-1/2 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full border font-display text-[0.68rem] font-bold transition-colors duration-500",
                        isActive
                          ? "border-[#f7b5a3] bg-[#fbe0d6] text-[#c9492a]"
                          : "border-[#e9f0ed] bg-white text-[#8d9f99]"
                      )}
                    >
                      {step.n}
                    </span>

                    <span
                      className={cn(
                        "grid h-[3.85rem] w-[3.85rem] place-items-center rounded-full transition-transform duration-500",
                        step.tile,
                        isActive && "scale-105"
                      )}
                    >
                      <Icon className="h-[1.6rem] w-[1.6rem]" strokeWidth={1.9} />
                    </span>

                    <h3 className="mt-5 flex min-h-[2.96rem] max-w-[10.5rem] items-center justify-center font-display text-[1.14rem] font-bold leading-[1.3] tracking-[-0.012em] text-[#10231f]">
                      {step.title}
                    </h3>

                    <p className="mt-3 min-h-[4.3rem] max-w-[11.5rem] font-sans text-[0.82rem] leading-[1.72] text-[#647872]">
                      {step.desc}
                    </p>

                    <span
                      aria-hidden
                      className={cn(
                        "absolute bottom-[2px] left-1/2 h-[4px] -translate-x-1/2 rounded-full bg-[#f26a4a] transition-all duration-500",
                        isActive ? "w-[55%] opacity-100" : "w-0 opacity-0"
                      )}
                    />
                  </article>
                </motion.div>
              );
            })}
          </div>

          {/* pagination dots */}
          <div className="mt-10 flex items-center justify-center gap-2 xl:mt-12">
            {STEPS.map((step, i) => (
              <span
                key={step.n}
                aria-hidden
                className={cn(
                  "rounded-full transition-all duration-500",
                  i === active ? "h-2.5 w-2.5 bg-[#7d8a1f]" : "h-2 w-2 bg-[#d8eae2]"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
