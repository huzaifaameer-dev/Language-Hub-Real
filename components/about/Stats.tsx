"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useLang } from "@/components/LanguageProvider";

const ease = [0.16, 1, 0.3, 1] as const;

interface StatsData {
  students: number;
  yearsTeaching: number;
  programmes: number;
  dailyBatches: number;
}

/** Fallback shown while the live stats load — keeps the section from flashing empty. */
const FALLBACK: StatsData = { students: 600, yearsTeaching: 8, programmes: 4, dailyBatches: 2 };

const STAT_CARDS: { label: string; key: keyof StatsData; suffix: string }[] = [
  { label: "Students guided", key: "students", suffix: "+" },
  { label: "Years teaching", key: "yearsTeaching", suffix: "+" },
  { label: "Programmes", key: "programmes", suffix: "" },
  { label: "Daily batches", key: "dailyBatches", suffix: "" },
];

function CountUp({ target, suffix }: { target: number; suffix: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const dur = 1400;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
}

/** Live "in numbers" section — counts come from the DB so they stay truthful. */
export function Stats() {
  const [data, setData] = useState<StatsData | null>(null);
  const { dict } = useLang();

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

  const stats = data ?? FALLBACK;

  return (
    <section
      id="stats"
      data-section
      className="relative overflow-hidden bg-ink px-6 py-20 sm:px-12"
      aria-label="Language Hub in numbers"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-brand/25 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-gold/20 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-6xl grid-cols-2 gap-y-12 lg:grid-cols-4">
        {STAT_CARDS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.08, ease }}
            className="flex flex-col items-center text-center lg:border-l lg:border-ivory/[0.08] lg:first:border-l-0"
          >
            <p className="font-display text-[clamp(2.4rem,5vw,3.6rem)] font-extrabold leading-none gold-text-shimmer">
              <CountUp target={stats[s.key]} suffix={s.suffix} />
            </p>
            <p className="mt-3 font-display text-[0.66rem] font-bold uppercase tracking-[0.3em] text-ivory/55">
              {dict[`stats.${s.key === "yearsTeaching" ? "years" : s.key === "students" ? "students" : s.key === "programmes" ? "programmes" : "batches"}`] ?? s.label}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}