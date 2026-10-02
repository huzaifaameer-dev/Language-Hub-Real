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
const FALLBACK: StatsData = { students: 600, yearsTeaching: 8, programmes: 4, dailyBatches: 3 };

const STAT_CARDS: {
  label: string;
  caption: string;
  key: keyof StatsData;
  suffix: string;
}[] = [
  {
    label: "Students guided",
    caption: "Learners we have helped find their voice",
    key: "students",
    suffix: "+",
  },
  {
    label: "Years teaching",
    caption: "Hands-on experience in the classroom",
    key: "yearsTeaching",
    suffix: "+",
  },
  {
    label: "Programmes",
    caption: "Spoken English · IELTS · PTE · Duolingo",
    key: "programmes",
    suffix: "",
  },
  {
    label: "Daily batches",
    caption: "Morning · evening · late-night slots",
    key: "dailyBatches",
    suffix: "",
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

  // Safety net: some mobile browsers never fire the in-view observer for this
  // block, which used to leave the counter stuck at 0. Snap to the real number
  // shortly after mount so the section can never show a wrong value.
  useEffect(() => {
    const id = window.setTimeout(() => setVal(target), 2500);
    return () => window.clearTimeout(id);
  }, [target]);

  return (
    <span ref={ref} className="tabular-nums">
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

/** Premium light "track record" band — no icons, big gradient numerals. */
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

  // Per-field fallback: if the live number is missing or 0, use the editorial
  // constant so the section never flashes a misleading "0" on any device.
  const valueFor = (k: keyof StatsData): number => {
    const v = stats[k];
    return typeof v === "number" && v > 0 ? v : FALLBACK[k];
  };

  return (
    <section
      id="stats"
      data-section
      className="relative overflow-hidden bg-[linear-gradient(180deg,#F2F6FF_0%,#E8EFFD_55%,#E2EAFB_100%)] px-6 pt-12 pb-8 sm:px-12 sm:pt-16 sm:pb-10"
      aria-label="Language Hub in numbers"
    >
      {/* Soft ambient glows + faint dot texture */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute -left-32 top-1/3 h-[26rem] w-[26rem] rounded-[50%]"
          style={{
            background: "radial-gradient(50% 50% at 50% 50%, rgb(37 99 235 / 0.20), transparent 70%)",
          }}
        />
        <div
          className="absolute -right-24 bottom-0 h-[24rem] w-[24rem] rounded-[50%]"
          style={{
            background: "radial-gradient(50% 50% at 50% 50%, rgb(59 130 246 / 0.16), transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: "radial-gradient(rgb(37 99 235 / 0.20) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
            maskImage: "radial-gradient(ellipse at 50% 40%, black 10%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse at 50% 40%, black 10%, transparent 75%)",
          }}
        />
      </div>

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
            <span aria-hidden className="h-px w-10 bg-[#2563EB]/25" />
            Language Hub <span className="text-[#2563EB]">in numbers</span>
            <span aria-hidden className="h-px w-10 bg-[#2563EB]/25" />
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.55, ease, delay: 0.06 }}
            className="mt-5 font-display text-[clamp(1.7rem,3.8vw,2.5rem)] font-extrabold tracking-[-0.02em] text-ink"
          >
            Progress you can{" "}
            <span className="bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#38BDF8] bg-clip-text text-transparent">
              count on.
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.55, ease, delay: 0.12 }}
            className="mx-auto mt-4 max-w-xl text-[0.92rem] leading-relaxed text-ink-2"
          >
            Years of practice in live classrooms — the programmes, the batches and
            the learners who keep coming back.
          </motion.p>
        </div>

        {/* Numerals */}
        <div className="mt-14 grid grid-cols-1 gap-y-10 sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-4 lg:gap-0">
          {STAT_CARDS.map((s, i) => (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.55, delay: i * 0.08, ease }}
              className="group relative border-t border-[#2563EB]/[0.10] pt-8 lg:border-t-0 lg:px-10 lg:pt-0"
            >
              {/* Big number */}
              <p className="font-display text-[clamp(2.6rem,5vw,4rem)] font-black leading-none tracking-[-0.03em]">
                <span className="bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#60A5FA] bg-clip-text text-transparent">
                  <CountUp target={valueFor(s.key)} suffix={s.suffix} />
                </span>
              </p>

              {/* Label + caption */}
              <p className="mt-4 font-display text-[0.98rem] font-bold text-ink">
                {labelFor(s, dict) || s.label}
              </p>
              <p className="mt-1.5 max-w-[16rem] text-[0.78rem] leading-snug text-ink-3">
                {s.caption}
              </p>

              {/* Fine hover accent */}
              <span
                aria-hidden
                className="absolute -top-px left-0 h-px w-12 bg-gradient-to-r from-[#2563EB] to-transparent lg:left-1/2 lg:top-0 lg:-translate-x-1/2 lg:w-0 lg:transition-all lg:duration-500 lg:group-hover:w-14"
              />
            </motion.div>
          ))}
        </div>

        {/* Gold master-line under the band */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.8, ease }}
          aria-hidden
          className="mt-14 h-px w-full origin-left bg-gradient-to-r from-transparent via-[#2563EB]/50 to-transparent"
        />
      </div>
    </section>
  );
}