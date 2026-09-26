"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useLang } from "@/components/LanguageProvider";
import {
  TrendingUp,
  Users,
  GraduationCap,
  Clock,
} from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

interface StatsData {
  students: number;
  yearsTeaching: number;
  programmes: number;
  dailyBatches: number;
}

/** Fallback shown while the live stats load — keeps the section from flashing empty. */
const FALLBACK: StatsData = { students: 600, yearsTeaching: 8, programmes: 4, dailyBatches: 3 };

const STAT_CARDS: {
  label: string;
  key: keyof StatsData;
  suffix: string;
  icon: typeof TrendingUp;
  tone: string;
}[] = [
  { label: "Students guided", key: "students", suffix: "+", icon: TrendingUp, tone: "#4f46e5" },
  { label: "Years teaching", key: "yearsTeaching", suffix: "+", icon: Clock, tone: "#0ea5e9" },
  { label: "Programmes", key: "programmes", suffix: "", icon: GraduationCap, tone: "#8b5cf6" },
  { label: "Daily batches", key: "dailyBatches", suffix: "", icon: Users, tone: "#d97706" },
];

function CountUp({ target, suffix }: { target: number; suffix: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const dur = 1600;
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

const labelFor = (s: { key: keyof StatsData }, dict: Record<string, string>) => {
  const map: Record<string, string> = {
    students: "stats.students",
    yearsTeaching: "stats.years",
    programmes: "stats.programmes",
    dailyBatches: "stats.batches",
  };
  return dict[map[s.key]] ?? "";
};

/** Editorial "in numbers" band — premium, restrained, live counts from the DB. */
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
      className="relative overflow-hidden bg-[#f6f7fb] px-6 py-20 sm:px-12 sm:py-24"
      aria-label="Language Hub in numbers"
    >
      {/* Soft ambient top glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-brand/[0.04] to-transparent"
      />

      <div className="relative mx-auto max-w-6xl">
        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease }}
          className="flex items-center justify-center gap-4 text-center"
        >
          <span aria-hidden className="h-px w-10 bg-ink/15" />
          <span className="font-display text-[0.62rem] font-bold uppercase tracking-[0.34em] text-ink-3">
            Language Hub <span className="text-brand-deep">in numbers</span>
          </span>
          <span aria-hidden className="h-px w-10 bg-ink/15" />
        </motion.p>

        {/* Stats — elegant editorial row */}
        <div className="mt-12 grid grid-cols-2 gap-y-10 border-t border-ink/[0.07] pt-10 sm:gap-y-12 lg:grid-cols-4 lg:gap-0 lg:pt-12">
          {STAT_CARDS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.55, delay: i * 0.09, ease }}
              className="group relative flex flex-col items-center text-center lg:px-8"
            >
              {/* Refined vertical divider between items on desktop */}
              {i > 0 && (
                <span
                  aria-hidden
                  className="hidden h-16 w-px bg-ink/[0.07] lg:absolute lg:-left-0 lg:top-1/2 lg:-translate-y-1/2 lg:block"
                />
              )}

              {/* Icon chip */}
              <span
                className="grid h-12 w-12 place-items-center rounded-2xl ring-1 ring-inset transition-transform duration-300 group-hover:scale-105"
                style={{
                  backgroundColor: `${s.tone}10`,
                  color: s.tone,
                  borderColor: `${s.tone}1c`,
                }}
              >
                <s.icon className="h-5 w-5" strokeWidth={1.9} />
              </span>

              {/* Number */}
              <p className="mt-4 flex items-baseline gap-1 font-display text-[clamp(2.1rem,4vw,3.2rem)] font-black leading-none tracking-[-0.02em]">
                <span className="bg-gradient-to-br from-ink via-ink to-ink/70 bg-clip-text text-transparent">
                  <CountUp target={stats[s.key]} suffix={s.suffix} />
                </span>
              </p>

              {/* Label */}
              <p className="mt-2.5 font-display text-[0.6rem] font-bold uppercase tracking-[0.3em] text-ink-3">
                {labelFor(s, dict) || s.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}