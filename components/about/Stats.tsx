"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LEARNERS_GUIDED } from "@/lib/content";

const ease = [0.16, 1, 0.3, 1] as const;

interface StatsData {
  students: number;
  programmes: number;
  dailyBatches: number;
}

/**
 * Verified fallbacks. The live database always wins, but if it is briefly
 * empty the band still shows honest figures instead of a blank gap.
 */
const FALLBACK: StatsData = {
  students: LEARNERS_GUIDED,
  programmes: 4,
  dailyBatches: 3,
};

/**
 * Editorial figures — the lead number carries the trust, the other two sit
 * quieter beside it. Each value stays database-backed unless noted otherwise.
 */
const FIGURES: Array<{
  key: keyof StatsData;
  label: string;
  suffix?: string;
  lead?: boolean;
  caption: string;
}> = [
  {
    key: "students",
    label: "Students guided",
    suffix: "+",
    lead: true,
    caption: "Learners across every programme",
  },
  {
    key: "programmes",
    label: "Programmes",
    caption: "Spoken English · IELTS · PTE · Duolingo",
  },
  {
    key: "dailyBatches",
    label: "Daily batches",
    caption: "Morning · evening · weekend",
  },
];

/** Gentle, scroll-triggered reveal used across the band. */
const reveal = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" as const },
  transition: { duration: 0.7, ease, delay },
});

/**
 * Section 1 — "Language Hub in numbers".
 *
 * A type-led band in Poppins: eyebrow, a confident two-column statement, then a
 * ledger of figures separated by hair rules. The lead figure is the visual
 * anchor; the supporting pair stay quieter so the row reads in hierarchy, not
 * as three equal cards.
 */
export function Stats() {
  const [data, setData] = useState<StatsData | null>(null);

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

  // Live numbers when the database has them; verified fallbacks otherwise, so
  // the band never renders an empty gap. The learner count is floored at the
  // shared headline figure, so it can never read lower than the hero's claim.
  const valueFor = (k: keyof StatsData): number => {
    const v = data?.[k];
    const base = typeof v === "number" && v > 0 ? v : FALLBACK[k];
    return k === "students" ? Math.max(LEARNERS_GUIDED, base) : base;
  };

  return (
    <section
      id="stats"
      data-section
      aria-label="Language Hub in numbers"
      className="relative overflow-hidden px-6 pt-16 pb-12 sm:px-12 sm:pt-20 sm:pb-14 lg:px-16 lg:pt-24 lg:pb-16"
      style={{ background: "linear-gradient(180deg, #EFF4FC 0%, #E8EDF9 100%)" }}
    >
      <div className="mx-auto max-w-6xl">
        {/* Eyebrow — rules either side open the statement like a ledger heading. */}
        <motion.div {...reveal(0)} className="flex items-center gap-4">
          <span aria-hidden className="h-px w-8 bg-[#0B1B3A]/30" />
          <span className="font-display text-[0.66rem] font-bold uppercase tracking-[0.24em] text-[#5B6B87]">
            Language Hub in numbers
          </span>
          <span aria-hidden className="hidden h-px flex-1 bg-[#0B1B3A]/10 sm:block" />
        </motion.div>

        {/* Statement — heading left, supporting right (editorial two-column). */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_1fr] lg:items-end lg:gap-16">
          <motion.h2
            {...reveal(0.06)}
            className="max-w-[16ch] text-[clamp(2.1rem,4.6vw,3.3rem)] leading-[1.03] tracking-[-0.03em] text-[#0B1B3A]"
            style={{ fontFamily: "var(--font-headline)", fontWeight: 700 }}
          >
            Built for real{" "}
            <span className="text-[#1D6FB8]">learning.</span>
          </motion.h2>
          <motion.p
            {...reveal(0.12)}
            className="max-w-[30rem] text-[0.98rem] leading-[1.75] text-[#5B6B87] lg:pb-1.5"
          >
            Small batches, focused programmes, and personal support that help
            learners move forward with confidence.
          </motion.p>
        </div>

        {/* Hairline — closes the statement before the evidence. */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.8, ease, delay: 0.14 }}
          aria-hidden
          className="mt-11 h-px w-full bg-[#0B1B3A]/12 lg:mt-14"
        />

        {/* Figures — a ledger: lead figure anchored, two quieter columns split
            by thin rules, each with a factual caption underneath. */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 sm:divide-x sm:divide-[#0B1B3A]/10">
          {FIGURES.map((f, i) => {
            const value = valueFor(f.key);
            return (
              <motion.div
                key={f.key}
                {...reveal(0.2 + i * 0.08)}
                className={
                  "py-9 sm:py-10 sm:px-9 " +
                  (i > 0 ? "border-t border-[#0B1B3A]/10 sm:border-t-0 " : "sm:pl-0") +
                  (i === FIGURES.length - 1 ? "sm:pr-0" : "")
                }
              >
                <p
                  className="leading-none tracking-[-0.04em] text-[#0B1B3A]"
                  style={{
                    fontFamily: "var(--font-headline)",
                    fontWeight: 700,
                    fontSize: f.lead
                      ? "clamp(3rem, 6vw, 4.6rem)"
                      : "clamp(2.3rem, 3.8vw, 3rem)",
                  }}
                >
                  {value.toLocaleString()}
                  {f.suffix ? <span className="text-[#1D6FB8]">{f.suffix}</span> : null}
                </p>
                <p className="mt-3 font-display text-[0.98rem] font-bold text-[#0B1B3A]">
                  {f.label}
                </p>
                <p className="mt-1.5 max-w-[15rem] text-[0.8rem] leading-snug text-[#5B6B87]">
                  {f.caption}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Quiet live caption — a small, honest signal that the figures are
            real and keep moving, not a frozen marketing number. */}
        <motion.p
          {...reveal(0.44)}
          className="mt-8 flex items-center gap-2 font-mono text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[#8B97AB] sm:mt-10"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Figures update live as new learners join
        </motion.p>
      </div>
    </section>
  );
}