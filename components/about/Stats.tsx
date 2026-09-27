"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useLang } from "@/components/LanguageProvider";
import {
  CalendarClock,
  GraduationCap,
  Layers,
  TrendingUp,
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
  caption: string;
  key: keyof StatsData;
  suffix: string;
  icon: typeof TrendingUp;
  tone: string;
}[] = [
  {
    label: "Students guided",
    caption: "Learners we have helped so far",
    key: "students",
    suffix: "+",
    icon: TrendingUp,
    tone: "#4f46e5",
  },
  {
    label: "Years teaching",
    caption: "Hands-on experience in the classroom",
    key: "yearsTeaching",
    suffix: "+",
    icon: CalendarClock,
    tone: "#0ea5e9",
  },
  {
    label: "Programmes",
    caption: "Spoken English · IELTS · PTE · Duolingo",
    key: "programmes",
    suffix: "",
    icon: Layers,
    tone: "#8b5cf6",
  },
  {
    label: "Daily batches",
    caption: "Morning · evening · late-night slots",
    key: "dailyBatches",
    suffix: "",
    icon: GraduationCap,
    tone: "#d97706",
  },
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

const labelFor = (s: { key: keyof StatsData; label: string }, dict: Record<string, string>) => {
  const map: Record<string, string> = {
    students: "stats.students",
    yearsTeaching: "stats.years",
    programmes: "stats.programmes",
    dailyBatches: "stats.batches",
  };
  return dict[map[s.key]] ?? s.label;
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
        {/* Header */}
        <div className="text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, ease }}
            className="flex items-center justify-center gap-4 font-display text-[0.62rem] font-bold uppercase tracking-[0.34em] text-ink-3"
          >
            <span aria-hidden className="h-px w-10 bg-ink/15" />
            Language Hub <span className="text-brand-deep">in numbers</span>
            <span aria-hidden className="h-px w-10 bg-ink/15" />
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.55, ease, delay: 0.06 }}
            className="mt-4 font-display text-[clamp(1.6rem,3.6vw,2.35rem)] font-extrabold tracking-[-0.02em] text-ink"
          >
            Progress you can <span className="text-brand-deep">measure.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.55, ease, delay: 0.12 }}
            className="mx-auto mt-3 max-w-xl text-[0.92rem] leading-relaxed text-ink-2"
          >
            Real numbers from our classrooms — the practice, the programmes and the
            batches that keep every learner talking.
          </motion.p>
        </div>

        {/* Stat panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.65, ease, delay: 0.1 }}
          className="mt-12 rounded-[1.75rem] border border-ink/[0.07] bg-white/80 shadow-[0_30px_70px_-40px_rgb(15_23_42/0.25)] backdrop-blur-md"
        >
          <div className="grid grid-cols-1 gap-y-8 p-8 sm:grid-cols-2 sm:gap-x-6 sm:p-10 lg:grid-cols-4 lg:gap-0 lg:p-2">
            {STAT_CARDS.map((s, i) => (
              <motion.div
                key={s.key}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: 0.14 + i * 0.08, ease }}
                className="group relative flex flex-col items-start lg:border-r lg:border-ink/[0.07] lg:px-10 lg:py-12 lg:last:border-r-0"
              >
                <span
                  className="grid h-11 w-11 place-items-center rounded-xl ring-1 ring-inset transition-transform duration-300 group-hover:scale-105"
                  style={{
                    backgroundColor: `${s.tone}10`,
                    color: s.tone,
                    borderColor: `${s.tone}1c`,
                  }}
                >
                  <s.icon className="h-5 w-5" strokeWidth={1.9} />
                </span>

                <p className="mt-4 flex items-baseline gap-1 font-display text-[clamp(2rem,3.6vw,2.75rem)] font-black leading-none tracking-[-0.02em]">
                  <span className="bg-gradient-to-br from-ink via-ink to-ink/70 bg-clip-text text-transparent">
                    <CountUp target={stats[s.key]} suffix={s.suffix} />
                  </span>
                </p>

                <p className="mt-2.5 font-display text-[0.9rem] font-extrabold text-ink">
                  {labelFor(s, dict) || s.label}
                </p>
                <p className="mt-1 text-[0.72rem] leading-snug text-ink-3">{s.caption}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}