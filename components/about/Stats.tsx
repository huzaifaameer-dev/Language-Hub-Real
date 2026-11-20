"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  GraduationCap,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { LEARNERS_GUIDED } from "@/lib/content";
import { useReducedMotionSafe } from "@/lib/hooks";
import { EASE_EXPO } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface StatsData {
  students: number;
  programmes: number;
  dailyBatches: number;
}

const FALLBACK: StatsData = {
  students: LEARNERS_GUIDED,
  programmes: 4,
  dailyBatches: 3,
};

const FIGURES: Array<{
  key: keyof StatsData;
  label: string;
  caption: string;
  suffix?: string;
  icon: typeof UsersRound;
  tone: "teal" | "coral" | "amber";
  accent: string;
}> = [
  {
    key: "students",
    label: "Learners guided",
    suffix: "+",
    caption: "Across every programme, batch and level.",
    icon: UsersRound,
    tone: "teal",
    accent: "#0f6b5c",
  },
  {
    key: "programmes",
    label: "Focused programmes",
    caption: "Spoken English · IELTS · PTE · Duolingo",
    icon: GraduationCap,
    tone: "coral",
    accent: "#fb6a47",
  },
  {
    key: "dailyBatches",
    label: "Daily batches",
    caption: "Morning, evening and weekend timings.",
    icon: CalendarDays,
    tone: "amber",
    accent: "#d99a1a",
  },
];

const CLAY: Record<string, string> = {
  teal: "clay",
  coral: "clay clay-coral",
  amber: "clay clay-amber",
};

const ICON_INK: Record<string, string> = {
  teal: "#0f6b5c",
  coral: "#d0452a",
  amber: "#8a5a00",
};

/**
 * "Language Hub in numbers" — an editorial ledger rather than three small
 * boxes: one calm statement on the left, three figures on hairline-separated
 * rows on the right. Figures reveal with a masked rise (no layout shift, no
 * truncated captions) and the whole panel carries the same surface + hover
 * language as the course and review cards below it.
 */
export function Stats() {
  const [data, setData] = useState<StatsData | null>(null);
  const reduce = useReducedMotionSafe();

  useEffect(() => {
    let mounted = true;
    fetch("/api/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (mounted && d) setData(d);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const valueFor = (k: keyof StatsData): number => {
    const v = data?.[k];
    const base = typeof v === "number" && v > 0 ? v : FALLBACK[k];
    return k === "students" ? Math.max(LEARNERS_GUIDED, base) : base;
  };

  const reveal = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 18 },
    whileInView: reduce ? undefined : { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" as const },
    transition: { duration: 0.65, delay, ease: EASE_EXPO },
  });

  return (
    <section
      id="stats"
      data-section
      aria-label="Language Hub in numbers"
      className="relative overflow-hidden bg-white px-5 pb-16 pt-12 sm:px-8 sm:pb-20 sm:pt-14"
    >
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-line bg-white shadow-[0_40px_90px_-58px_rgba(6,46,40,0.4)] sm:rounded-[2.35rem]">
          {/* quiet atmosphere */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, rgba(15,107,92,0.028) 0 1px, transparent 1px 26px)",
            }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#14a08c]/12 blur-[110px]"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-28 right-0 h-72 w-72 rounded-full bg-[#fb6a47]/10 blur-[110px]"
          />

          <div className="relative grid gap-10 p-7 sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16 lg:p-14">
            {/* statement */}
            <div>
              <motion.span {...reveal(0)} className="eyebrow-ref">
                Language Hub in numbers
              </motion.span>

              <motion.h2 {...reveal(0.06)} className="section-title-ref mt-4">
                Built for real{" "}
                <span className="text-[#0f6b5c]">learning.</span>
              </motion.h2>

              <motion.p
                {...reveal(0.12)}
                className="mt-4 max-w-md font-sans text-[0.96rem] leading-[1.8] text-ink-2"
              >
                Small batches, measurable progress and a teacher who knows your
                name — the numbers behind the method, not just the marketing.
              </motion.p>

              <motion.div {...reveal(0.18)} className="mt-7 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#dcefe9] bg-[#f3fbf8] px-3.5 py-1.5 font-display text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[#0a4e43]">
                  <Sparkles className="h-3.5 w-3.5 text-[#14a08c]" strokeWidth={2.2} />
                  Teaching since 2018
                </span>
                <Link
                  href="/success-stories"
                  className="group inline-flex items-center gap-1.5 font-display text-[0.72rem] font-bold text-[#0f6b5c] transition-colors hover:text-[#0a4e43]"
                >
                  See the outcomes
                  <ArrowUpRight
                    className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    strokeWidth={2.2}
                  />
                </Link>
              </motion.div>
            </div>

            {/* ledger */}
            <div className="divide-y divide-[#e9f3ef]">
              {FIGURES.map((f, i) => {
                const Icon = f.icon;
                const value = valueFor(f.key);
                return (
                  <motion.div
                    key={f.key}
                    {...reveal(0.12 + i * 0.08)}
                    className="group/stat flex items-center gap-4 py-5 first:pt-0 last:pb-0 sm:gap-6"
                  >
                    <span
                      className={cn(
                        CLAY[f.tone],
                        "card-icon h-12 w-12 shrink-0 rounded-2xl sm:h-14 sm:w-14"
                      )}
                    >
                      <Icon
                        className="relative z-10 h-5 w-5 sm:h-6 sm:w-6"
                        strokeWidth={1.9}
                        style={{ color: ICON_INK[f.tone] }}
                      />
                    </span>

                    <div className="flex min-w-0 flex-1 flex-col-reverse gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
                      <div className="min-w-0">
                        <p className="font-display text-[0.94rem] font-bold leading-snug text-ink">
                          {f.label}
                        </p>
                        <p className="mt-0.5 font-sans text-[0.76rem] leading-relaxed text-ink-3">
                          {f.caption}
                        </p>
                      </div>

                      <p
                        className="shrink-0 font-display text-[1.95rem] font-extrabold leading-none tracking-[-0.04em] text-ink sm:text-[2.35rem]"
                        aria-label={`${value.toLocaleString()}${f.suffix ?? ""}`}
                      >
                        <motion.span
                          initial={reduce ? false : { y: 14, opacity: 0 }}
                          whileInView={reduce ? undefined : { y: 0, opacity: 1 }}
                          viewport={{ once: true, margin: "-60px" }}
                          transition={{ duration: 0.7, delay: 0.25 + i * 0.08, ease: EASE_EXPO }}
                          className="inline-block tabular-nums"
                        >
                          {value.toLocaleString()}
                          {f.suffix ? (
                            <span style={{ color: f.accent }}>{f.suffix}</span>
                          ) : null}
                        </motion.span>
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
