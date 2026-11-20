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
    line: "Experience measurable improvement as your vocabulary, fluency, pronunciation, confidence, and everyday communication skills develop through consistent practice and personalized support.",
  },
];

const ACCENTS = ["#0f6b5c", "#fb6a47", "#d99a1a", "#0b7f70", "#12b886"] as const;
const CLAY = ["clay", "clay clay-coral", "clay clay-amber", "clay clay-deep", "clay clay-mint"] as const;
const ICON_INK = ["#0f6b5c", "#d0452a", "#8a5a00", "#ffffff", "#0a4e43"] as const;

function handleSpotlight(e: MouseEvent<HTMLElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
}

/**
 * "Why Language Hub" — five reasons in a 3 + 2 grid on the mint reference
 * canvas. Each card carries one sequenced accent and a cursor spotlight; hover
 * lifts a single quiet step with a buttery cubic-bezier.
 */
export function Features() {
  const reduce = useReducedMotionSafe();

  return (
    <section
      id="why"
      data-section
      aria-label="Why Language Hub"
      className="bg-mint relative overflow-hidden px-5 pb-20 pt-16 sm:px-8 sm:pb-24 sm:pt-[4.5rem]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(58% 44% at 6% 0%, rgba(20,160,140,0.10), transparent 62%), radial-gradient(55% 44% at 100% 100%, rgba(251,106,71,0.07), transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease }}
          className="mx-auto max-w-2xl text-center"
        >
          <div className="flex items-center justify-center gap-3">
            <span aria-hidden className="h-px w-7 bg-[#fb6a47]/60" />
            <span className="font-display text-[0.62rem] font-bold uppercase tracking-[0.3em] text-[#d9532f]">
              Why Language Hub
            </span>
            <span aria-hidden className="h-px w-7 bg-[#fb6a47]/60" />
          </div>
          <h2 className="mt-4 font-display text-[clamp(1.95rem,4.2vw,3.05rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-ink">
            What makes learning here{" "}
            <span className="text-[#0f6b5c]">different.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-[35rem] font-sans text-[0.97rem] leading-[1.8] text-ink-2">
            Five things every learner feels from the first session — real practice,
            real attention, and progress you can actually measure.
          </p>
        </motion.div>

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
                whileHover={reduce ? undefined : { y: -6 }}
                transition={{ duration: 0.55, delay: i * 0.07, ease }}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-3xl border border-[#e3ede9] bg-white p-6 shadow-[0_22px_44px_-34px_rgba(10,78,67,0.45)] transition-[box-shadow,border-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-[#b9e4d9] hover:shadow-[0_38px_70px_-38px_rgba(10,78,67,0.55)]",
                  i < 3 ? "lg:col-span-2" : "lg:col-span-3"
                )}
              >
                <span aria-hidden className="card-sheen" />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(320px circle at var(--mx, 50%) var(--my, 50%), ${accent}12, transparent 70%)`,
                  }}
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute right-3 top-0 select-none font-display text-[4rem] font-extrabold leading-none tracking-tighter sm:text-[4.8rem]"
                  style={{ color: `${accent}16` }}
                >
                  {p.num}
                </span>

                <span className={cn(CLAY[i % CLAY.length], "card-icon h-12 w-12 rounded-2xl")}>
                  <p.icon
                    className="icon-hover-pop relative z-10 h-5 w-5"
                    strokeWidth={1.9}
                    style={{ color: ICON_INK[i % ICON_INK.length] }}
                  />
                </span>

                <h3 className="relative mt-5 font-display text-[1.08rem] font-bold leading-snug tracking-[-0.02em] text-ink">
                  {p.title}
                </h3>
                <span aria-hidden className="relative mt-3 h-1 w-8 rounded-full" style={{ backgroundColor: accent }} />
                <p className="relative mt-3 font-sans text-[0.89rem] leading-[1.78] text-ink-2">
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
