"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Pencil,
  Play,
  Sparkles,
} from "lucide-react";
import { LEARNERS_GUIDED } from "@/lib/content";
import { useReducedMotionSafe } from "@/lib/hooks";
import { ClassPreview } from "@/components/hero/ClassPreview";

const ease = [0.16, 1, 0.3, 1] as const;

const AVATARS = [
  { initials: "HN", tone: "from-[#0f6b5c] to-[#14a08c]" },
  { initials: "AR", tone: "from-[#fb6a47] to-[#ff9a5c]" },
  { initials: "MT", tone: "from-[#d99a1a] to-[#f5b93c]" },
];

/**
 * Reference-led hero: a striped white canvas, an editorial left column, and a
 * cut-out learner standing inside the academy's teal shape with floating clay
 * objects. Everything is laid out on one calm baseline grid.
 */
export function Hero() {
  const reduce = useReducedMotionSafe();

  const rise = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 22 },
    animate: reduce ? undefined : { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay, ease },
  });

  return (
    <section
      id="home"
      data-section
      aria-label="Welcome to Language Hub"
      className="relative isolate overflow-hidden bg-stripes"
    >
      {/* atmosphere */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute -left-40 top-24 h-[30rem] w-[30rem] rounded-full bg-[#14a08c]/10 blur-[130px]"
          style={{}}
        />
        <div
          className="absolute -right-24 top-10 h-[26rem] w-[26rem] rounded-full bg-[#f5b93c]/12 blur-[120px]"
          style={{}}
        />
        <div
          className="absolute bottom-0 left-1/3 h-[18rem] w-[30rem] rounded-full bg-[#fb6a47]/07 blur-[120px]"
          style={{}}
        />
      </div>

      <div
        className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 pb-8 pt-[6.4rem] sm:px-8 sm:pt-[7rem] lg:grid-cols-[1.02fr_0.98fr] lg:gap-6 lg:pb-10 lg:pt-[7.6rem]"
      >
        {/* ── left: message ── */}
        <div className="relative z-10 max-w-[36rem] text-center lg:text-left">
          <motion.div {...rise(0)} className="flex justify-center lg:justify-start">
            <span className="inline-flex items-center gap-2.5 rounded-full border border-[#ffe1d6] bg-[#fff7f3] px-4 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#fb6a47] opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#fb6a47]" />
              </span>
              <span className="font-display text-[0.6rem] font-bold uppercase tracking-[0.28em] text-[#d9532f]">
                Admissions open · New batch
              </span>
            </span>
          </motion.div>

          <motion.h1
            {...rise(0.08)}
            className="mx-auto mt-6 max-w-[38rem] font-display text-[clamp(2.45rem,5.4vw,4.1rem)] font-extrabold leading-[1.02] tracking-[-0.045em] text-ink lg:mx-0"
          >
            Speak English
            <br />
            With{" "}
            <span className="relative inline-block">
              Confidence.
              <svg
                aria-hidden
                viewBox="0 0 240 14"
                fill="none"
                preserveAspectRatio="none"
                className="absolute -bottom-1.5 left-0 h-3 w-full"
              >
                <motion.path
                  d="M3 9.2C58 4.4 160 4.2 237 8.4"
                  stroke="#fb6a47"
                  strokeWidth="4"
                  strokeLinecap="round"
                  initial={reduce ? false : { pathLength: 0 }}
                  animate={reduce ? undefined : { pathLength: 1 }}
                  transition={{ duration: 1.1, delay: 0.8, ease }}
                />
              </svg>
            </span>
          </motion.h1>

          <motion.p
            {...rise(0.16)}
            className="mx-auto mt-6 max-w-[30rem] font-sans text-[0.98rem] leading-[1.8] text-ink-2 sm:text-[1.03rem] lg:mx-0"
          >
            Live, small-batch classes built around real conversation — so the
            English you learn is the English you actually use at work, in
            interviews and in everyday life.
          </motion.p>

          <motion.div
            {...rise(0.24)}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-5 lg:justify-start"
          >
            <Link href="/signup" className="btn-teal group relative h-14 overflow-hidden px-8 text-[0.92rem]">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 -left-full w-2/3 -skew-x-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)] transition-transform duration-[900ms] ease-out group-hover:translate-x-[460%]"
              />
              <span className="relative">Enroll Now</span>
              <ArrowRight
                className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                strokeWidth={2.3}
              />
            </Link>

            <ClassPreview />
          </motion.div>

          {/* trust row */}
          <motion.div
            {...rise(0.34)}
            className="mt-9 flex flex-wrap items-center justify-center gap-4 lg:justify-start"
          >
            <div className="flex shrink-0 items-center">
              {AVATARS.map((a, i) => (
                <span
                  key={a.initials}
                  className={`grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br ${a.tone} font-display text-[0.6rem] font-bold tracking-wide text-white ring-[2.5px] ring-white ${i > 0 ? "-ml-2" : ""}`}
                >
                  {a.initials}
                </span>
              ))}
              <span className="-ml-2 grid h-9 w-9 place-items-center rounded-full bg-[#0b3b34] font-display text-[0.56rem] font-bold text-white ring-[2.5px] ring-white">
                +1k
              </span>
            </div>
            <p className="font-sans text-[0.78rem] font-medium text-ink-2">
              <span className="font-semibold text-ink">
                {LEARNERS_GUIDED.toLocaleString()}+ learners
              </span> {" "} guided since 2018
            </p>
          </motion.div>
        </div>

        {/* ── right: learner stage ── */}
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.96, y: 18 }}
          animate={reduce ? undefined : { opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.95, delay: 0.15, ease }}
          className="relative mx-auto h-[23rem] w-full max-w-[34rem] sm:h-[28rem] lg:h-[34rem] lg:max-w-none"
        >
          {/* dashed orbit + soft ground */}
          <span
            aria-hidden
            className="blob-breathe absolute left-1/2 top-1/2 h-[88%] w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#bfe8de]"
          />
          <span
            aria-hidden
            className="absolute bottom-5 left-1/2 h-8 w-[58%] -translate-x-1/2 rounded-[50%] bg-[#0a4e43]/15 blur-2xl"
          />

          <Image
            src="/brand/hero-student-teal.png"
            alt="A Language Hub learner celebrating progress on his phone"
            width={1302}
            height={1208}
            priority
            sizes="(min-width: 1024px) 560px, (min-width: 640px) 460px, 90vw"
            className="absolute inset-0 h-full w-full object-contain object-bottom drop-shadow-[0_34px_34px_rgba(7,59,51,0.18)]"
          />

          {/* floating clay objects */}
          <div
            className="hero-float absolute -left-1 top-6 sm:left-2 lg:-left-3 lg:top-10"
          >
            <span className="clay h-14 w-14 sm:h-16 sm:w-16">
              <BookOpen className="relative z-10 h-6 w-6 text-[#0f6b5c] sm:h-7 sm:w-7" strokeWidth={1.8} />
            </span>
          </div>

          <div
            className="hero-float-slow absolute right-2 top-0 sm:right-6 lg:right-0"
          >
            <span className="clay clay-coral h-14 w-14 sm:h-16 sm:w-16">
              <Play className="relative z-10 ml-0.5 h-5 w-5 fill-white text-white sm:h-6 sm:w-6" strokeWidth={0} />
            </span>
          </div>

          <div
            className="hero-float absolute -right-1 top-[42%] sm:right-3 lg:-right-2"
          >
            <span className="clay clay-amber h-12 w-12 sm:h-14 sm:w-14">
              <Pencil className="relative z-10 h-5 w-5 text-[#8a5a00]" strokeWidth={1.9} />
            </span>
          </div>

          <div
            className="hero-float-slow absolute bottom-8 left-0 sm:left-4 lg:-left-4"
          >
            <span className="clay clay-mint h-12 w-12 sm:h-14 sm:w-14">
              <GraduationCap className="relative z-10 h-5.5 w-5.5 text-[#0a4e43] sm:h-6 sm:w-6" strokeWidth={1.8} />
            </span>
          </div>

          {/* floating live-class card */}
          <motion.div
            whileHover={{ rotateY: "0deg", rotateX: "0deg" }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, duration: 0.7, delay: 0.75, ease }}
            initial={reduce ? false : { opacity: 0, y: 14, x: 8 }}
            animate={reduce ? undefined : { opacity: 1, y: 0, x: 0 }}
            className="hero-float absolute -bottom-1 right-0 w-[12.5rem] rounded-2xl bg-[linear-gradient(135deg,#fb6a47_0%,#f58a3c_55%,#f5b93c_100%)] p-3 shadow-[0_24px_44px_-20px_rgba(232,84,47,0.75)] sm:right-4 sm:w-[14rem]"
            style={{ animationDelay: "1.2s" }}
          >
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/22 ring-1 ring-inset ring-white/30">
                <Play className="ml-0.5 h-4 w-4 fill-white text-white" strokeWidth={0} />
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-[0.72rem] font-bold leading-tight text-white">
                  Live Class · Speaking
                </p>
                <p className="mt-0.5 font-sans text-[0.58rem] font-medium text-white/80">
                  Evening batch · 12 seats
                </p>
              </div>
            </div>
            <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/85" />
          </motion.div>

          {/* small sparkle accents */}
          <Sparkles className="absolute left-[18%] top-[52%] h-4 w-4 text-[#f5b93c]" strokeWidth={2.2} />
          <Sparkles className="absolute right-[26%] top-[18%] h-3 w-3 text-[#fb6a47]" strokeWidth={2.2} />
        </motion.div>
      </div>

      {/* curved orange connector */}
      <svg
        aria-hidden
        viewBox="0 0 220 90"
        fill="none"
        className="pointer-events-none absolute left-[44%] top-[24%] hidden h-20 w-44 xl:block"
      >
        <path
          d="M6 60C64 12 128 18 176 46"
          stroke="#f5b93c"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="7 9"
          className="hero-arrow-dash"
        />
        <path
          d="M164 34L180 49L158 52"
          stroke="#f5b93c"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* bottom fade into the trust bar */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.7)_70%,#ffffff_100%)]"
      />
    </section>
  );
}