"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, GraduationCap, Quote, Star, Users } from "lucide-react";
import { useReducedMotionSafe } from "@/lib/hooks";
import { EASE_QUINT } from "@/lib/motion";

const BIO = [
  "Javaria Malik is the Head of Language Hub, where she has spent over eight years turning hesitant speakers into confident communicators. Her conversation-first method treats English as a living skill — something learners actually use, not just memorize.",
  "Under her leadership, every programme pairs structured lessons with real speaking practice, mock interviews and honest feedback, so progress shows up in real conversations.",
];

const STATS = [
  { value: "8+ Years", label: "of Experience", icon: GraduationCap },
  { value: "1,000+", label: "Happy Learners", icon: Users },
  { value: "4.9/5", label: "Student Rating", icon: Star },
];

/**
 * "Meet the founder" — the portrait card arrives as one finished artwork
 * (`/brand/founder-card-2026.png`: speaking portrait, blue frame and leaves
 * baked in), so nothing is layered on top of it. The story column, quote and
 * the three trust pills mirror the reference layout exactly.
 */
export function FounderSpotlight() {
  const reduce = useReducedMotionSafe();

  const rise = (delay: number, y = 18) => ({
    initial: reduce ? false : { opacity: 0, y },
    whileInView: reduce ? undefined : { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-8% 0px" },
    transition: { duration: 0.7, delay, ease: EASE_QUINT },
  });

  return (
    <section
      id="founder"
      data-section
      aria-label="Meet the founder of Language Hub"
      className="relative overflow-hidden bg-[#fbfefd] px-5 py-20 sm:px-8 sm:py-24"
    >
      {/* soft field */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute -right-[8%] -top-[26%] h-[36rem] w-[36rem] rounded-full bg-[#e8f8f0]" />
        <span className="absolute -left-[14%] bottom-[-22%] h-[30rem] w-[30rem] rounded-full bg-[#f2fbf6]" />
      </div>

      <div className="relative mx-auto grid max-w-[1300px] items-start gap-10 lg:grid-cols-[minmax(0,0.84fr)_minmax(0,1.18fr)_minmax(0,0.7fr)] lg:gap-10 xl:gap-12">
        {/* ── portrait: the supplied artwork, untouched ─────────────────── */}
        <motion.div
          initial={reduce ? false : { opacity: 0, x: -22 }}
          whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE_QUINT }}
          className="relative mx-auto w-full max-w-[23rem] lg:mx-0 lg:max-w-[24.5rem]"
        >
          <Image
            src="/brand/founder-card-2026.png"
            alt="Javaria Malik — Founder and Head of Language Hub"
            width={1040}
            height={1041}
            priority
            sizes="(min-width: 1024px) 392px, 86vw"
            className="h-auto w-full drop-shadow-[0_28px_45px_rgba(13,71,60,0.16)]"
          />
        </motion.div>

        {/* ── story ─────────────────────────────────────────────────────── */}
        <div className="relative min-w-0">
          <motion.p
            {...rise(0.05, 10)}
            className="flex items-center gap-3 font-display text-[0.7rem] font-bold uppercase tracking-[0.26em] text-[#f26a4a]"
          >
            <span aria-hidden className="h-px w-7 bg-[#f4a78f]" />
            Meet the Founder
          </motion.p>

          <motion.h2
            {...rise(0.1, 16)}
            className="mt-3 font-display text-[clamp(2.1rem,3.6vw,3rem)] font-extrabold leading-[1.06] tracking-[-0.045em] text-[#0b1f1b]"
          >
            Javaria Malik.
          </motion.h2>

          <motion.p {...rise(0.13, 10)} className="mt-2.5 font-sans text-[1.02rem] text-[#3f5751]">
            Founder - Head of <span className="font-bold text-[#0d6a58]">Language Hub</span>
          </motion.p>

          <motion.span aria-hidden {...rise(0.16, 0)} className="mt-4 block h-[2px] w-12 rounded-full bg-[#0d6a58]" />

          <motion.div {...rise(0.2, 12)} className="mt-4 space-y-3.5">
            {BIO.map((para) => (
              <p key={para.slice(0, 24)} className="font-sans text-[0.875rem] leading-[1.8] text-[#5b6f69]">
                {para}
              </p>
            ))}
          </motion.div>

          <motion.figure
            {...rise(0.26, 12)}
            className="mt-6 flex items-start gap-3.5 rounded-2xl bg-[#eaf8f1] px-5 py-4"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#d2f0e1] text-[#0d6a58]">
              <Quote className="h-4 w-4" strokeWidth={2.4} />
            </span>
            <div className="min-w-0">
              <blockquote className="font-sans text-[0.85rem] leading-[1.7] text-[#315a50]">
                Teaching is not only about giving knowledge. It is about helping someone
                discover what they are capable of.
              </blockquote>
              <figcaption className="mt-1.5 font-sans text-[0.78rem] font-medium text-[#5c706a]">
                — Javaria Malik
              </figcaption>
            </div>
          </motion.figure>
        </div>

        {/* ── trust pills + story CTA ───────────────────────────────────── */}
        <div className="relative flex h-full flex-col lg:border-l lg:border-[#e2efe8] lg:pl-8 xl:pl-10">
          <div className="flex flex-col gap-4">
            {STATS.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.value}
                  {...rise(0.16 + i * 0.08, 14)}
                  className="flex items-center gap-4 rounded-2xl bg-[#f4fbf8] px-4 py-3.5"
                >
                  <span className="grid h-[3rem] w-[3rem] shrink-0 place-items-center rounded-xl bg-[#e0f5ea] text-[#1f7a62]">
                    <Icon className="h-[1.3rem] w-[1.3rem]" strokeWidth={2} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-[1.3rem] font-extrabold leading-none tracking-[-0.02em] text-[#10231f]">
                      {stat.value}
                    </p>
                    <p className="mt-1.5 font-sans text-[0.82rem] text-[#5c706a]">{stat.label}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* hand-drawn curl + story link, pinned to the bottom like the mock */}
          <div className="mt-8 flex items-center justify-end gap-2 lg:mt-auto lg:pt-8">
            <svg aria-hidden viewBox="0 0 84 34" className="hidden h-7 w-16 text-[#4f8b7a] sm:block">
              <path
                d="M78 26C60 24 40 20 26 12c-6-3-9-6-7-9 2-2 6-1 7 3 1 5-5 12-19 15"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            <Link
              href="/team"
              className="group inline-flex h-[3.1rem] items-center gap-3 rounded-full bg-[#0d5c4d] px-7 font-display text-[0.88rem] font-bold text-white shadow-[0_16px_30px_-18px_rgba(13,92,77,0.9)] transition-transform duration-300 hover:-translate-y-0.5"
            >
              Our Story
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
