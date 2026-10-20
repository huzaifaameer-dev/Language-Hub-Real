"use client";

import type { MouseEvent } from "react";
import { motion } from "framer-motion";
import { Compass, MessageCircle, Target, TrendingUp, Users } from "lucide-react";
import { useReducedMotionSafe } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

interface HubPoint {
  icon: typeof MessageCircle;
  num: string;
  title: string;
  line: string;
}

/** One restrained accent per card, so the row reads as a curated set, not a rainbow. */
const ACCENTS = ["#2563EB", "#6D4AFF", "#0E9384", "#D98A0B", "#1D6FB8"] as const;

const POINTS: HubPoint[] = [
  {
    icon: MessageCircle,
    num: "01",
    title: "Live Conversation",
    line: "Build natural speaking confidence through real conversations, active participation, and practical speaking opportunities that help you express yourself comfortably in everyday situations.",
  },
  {
    icon: Users,
    num: "02",
    title: "Small Batches",
    line: "Learn in focused groups where every student receives more speaking time, meaningful interaction, individual attention, and constructive feedback throughout each session.",
  },
  {
    icon: Compass,
    num: "03",
    title: "Personal Guidance",
    line: "Receive thoughtful guidance tailored to your learning needs, helping you improve expression, overcome hesitation, strengthen weak areas, and communicate with greater confidence.",
  },
  {
    icon: Target,
    num: "04",
    title: "Exam Confidence",
    line: "Prepare strategically for IELTS, PTE, and Duolingo through focused practice, expert feedback, structured preparation, and techniques designed around real examination requirements.",
  },
  {
    icon: TrendingUp,
    num: "05",
    title: "Real Progress",
    line: "Experience measurable improvement as your vocabulary, fluency, pronunciation, confidence, and everyday communication skills develop through consistent practice and personalized learning support.",
  },
];

/** Track the cursor so each card's hover spotlight follows the pointer. */
function handleSpotlight(e: MouseEvent<HTMLElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
}

/**
 * "What Makes Learning Here Different".
 *
 * Five reasons in a calm 3 + 2 grid — every point visible at once, nothing
 * cycling past the reader. Each card carries its own accent: a gradient icon
 * disc, a large ghost numeral for editorial depth, and a spotlight that follows
 * the cursor. Hover lifts a card a single quiet step.
 */
export function Features() {
  const reduce = useReducedMotionSafe();

  return (
    <section
      id="why"
      data-section
      aria-label="What makes learning here different"
      className="relative overflow-hidden px-6 pt-12 pb-14 sm:px-12 sm:pt-14 sm:pb-16 lg:px-16 lg:pt-14 lg:pb-16"
      style={{ background: "linear-gradient(180deg, #EDF3FC 0%, #FBFAF7 100%)" }}
    >
      {/* faint accent fields so the white cards read as objects on a surface */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 45% at 8% 0%, rgba(37,99,235,0.06), transparent 60%), radial-gradient(55% 45% at 100% 100%, rgba(109,74,255,0.06), transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl">
        {/* Heading — editorial, left-aligned */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease }}
          className="max-w-2xl"
        >
          <div className="flex items-center gap-4">
            <span aria-hidden className="h-px w-8 bg-[#0B1B3A]/30" />
            <span className="font-display text-[0.66rem] font-bold uppercase tracking-[0.24em] text-[#5B6B87]">
              Why Language Hub
            </span>
          </div>
          <h2
            className="mt-5 text-[clamp(1.95rem,4vw,3.05rem)] leading-[1.05] tracking-[-0.025em] text-[#0B1B3A]"
            style={{ fontFamily: "var(--font-headline)", fontWeight: 700 }}
          >
            What Makes Learning Here
            <span className="text-[#1D6FB8]"> Different</span>
          </h2>
          <p className="mt-4 max-w-[34rem] text-[0.98rem] leading-[1.72] text-[#5B6B87]">
            Five things every learner feels from the first session — real practice,
            real attention, and progress you can actually measure.
          </p>
        </motion.div>

        {/* 3 + 2 grid */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-6 lg:gap-6">
          {POINTS.map((p, i) => {
            const accent = ACCENTS[i % ACCENTS.length];
            return (
              <motion.article
                key={p.num}
                onMouseMove={handleSpotlight}
                initial={reduce ? false : { opacity: 0, y: 26 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.55, delay: i * 0.07, ease }}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-2xl border border-ink/[0.07] bg-white p-6 shadow-[0_24px_60px_-46px_rgb(15_23_42/0.5)] transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-ink/[0.12] hover:shadow-[0_34px_80px_-44px_rgb(15_23_42/0.55)]",
                  i < 3 ? "lg:col-span-2" : "lg:col-span-3"
                )}
              >
                {/* spotlight follows the cursor */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(320px circle at var(--mx, 50%) var(--my, 50%), ${accent}14, transparent 70%)`,
                  }}
                />
                {/* oversized ghost numeral */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-2 -top-5 select-none font-display text-[5.5rem] font-black leading-none"
                  style={{ color: `${accent}12` }}
                >
                  {p.num}
                </span>

                <span
                  className="relative grid h-11 w-11 place-items-center rounded-xl text-white shadow-[0_14px_30px_-16px_rgba(11,27,58,0.55)]"
                  style={{ background: `linear-gradient(140deg, ${accent}, ${accent}cc)` }}
                >
                  <p.icon className="icon-hover-pop h-5 w-5" strokeWidth={1.8} />
                </span>

                <h3 className="relative mt-5 font-display text-[1.08rem] font-bold leading-snug tracking-[-0.01em] text-[#0B1B3A]">
                  {p.title}
                </h3>
                <span aria-hidden className="relative mt-3 h-px w-9" style={{ backgroundColor: `${accent}66` }} />
                <p className="relative mt-3 text-[0.9rem] leading-[1.72] text-[#5B6B87]">
                  {p.line}
                </p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
