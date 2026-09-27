"use client";

import { motion } from "framer-motion";
import { BadgeCheck, Quote } from "lucide-react";
import { ACADEMY_STATS } from "@/lib/content";

const ease = [0.16, 1, 0.3, 1] as const;

interface Ceo {
  name: string;
  role: string;
  headline: string | null;
  credentials: string[];
  bio: string;
  focus: string[];
  image: string | null;
}

/** Founder & CEO — calm, calm luxury (mirrors the homepage founder card). */
export function TeamCeoCard({ ceo }: { ceo: Ceo }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, ease }}
      className="relative mt-14 overflow-hidden rounded-[2rem] border border-white/10 bg-[#0B1322] text-white shadow-[0_60px_120px_-50px_rgb(2_6_23/0.85)]"
    >
      {/* background: desk image + calm emerald/blue glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <img src="/ceo-desk.jpg" alt="" className="h-full w-full object-cover opacity-[0.2]" />
        <motion.div
          animate={{ opacity: [0.22, 0.4, 0.22] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-28 -top-28 h-80 w-80 rounded-[50%]"
          style={{ background: "radial-gradient(50% 50% at 50% 50%, rgb(16 185 129 / 0.22), transparent 70%)" }}
        />
        <motion.div
          animate={{ opacity: [0.18, 0.34, 0.18] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-28 -left-24 h-80 w-80 rounded-[50%]"
          style={{ background: "radial-gradient(50% 50% at 50% 50%, rgb(59 130 246 / 0.20), transparent 70%)" }}
        />
      </div>

      {/* animated hairline */}
      <motion.div
        aria-hidden
        animate={{ scaleX: [0.35, 1, 0.35] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-x-0 top-0 h-[3px] origin-left bg-gradient-to-r from-emerald-400 via-sky-400 to-blue-500"
      />

      <div className="relative grid gap-10 p-7 sm:p-10 lg:grid-cols-[240px_1fr] lg:gap-12">
        {/* Portrait */}
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="relative mx-auto w-full max-w-[15rem] sm:max-w-[17rem] lg:mx-0"
        >
          <motion.span
            aria-hidden
            animate={{ scale: [1, 1.06, 1], opacity: [0.35, 0.6, 0.35] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -inset-3 rounded-[1.5rem] bg-emerald-500/40 blur-2xl"
          />
          <span className="relative block overflow-hidden rounded-[1.3rem] ring-1 ring-white/15">
            {ceo.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ceo.image} alt={ceo.name} className="aspect-[4/5] w-full object-cover" />
            ) : (
              <span className="grid aspect-[4/5] w-full place-items-center bg-gradient-to-br from-emerald-500 to-blue-600">
                <span className="font-display text-5xl font-extrabold text-white">
                  {ceo.name.charAt(0)}
                </span>
              </span>
            )}
          </span>
          <span className="absolute -bottom-3 -right-3 rounded-full border border-emerald-400/40 bg-[#0B1322] px-3 py-1.5 font-mono text-[0.58rem] font-bold tracking-[0.2em] text-emerald-300 shadow-lg">
            CEO
          </span>
        </motion.div>

        {/* Identity */}
        <div className="flex flex-col justify-center text-center lg:text-start">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.5, ease }}
            className="mx-auto flex items-center justify-center gap-3 font-mono text-[0.58rem] font-bold uppercase tracking-[0.3em] text-emerald-300 lg:mx-0 lg:justify-start"
          >
            <span aria-hidden className="hidden h-px w-8 bg-emerald-400/50 sm:block" />
            {ceo.role}
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5, ease }}
            className="mt-3 font-display text-[clamp(2rem,4.5vw,3rem)] font-black leading-tight tracking-[-0.02em] text-white"
          >
            {ceo.headline ?? ceo.name}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.26, duration: 0.5, ease }}
            className="mt-1.5 font-display text-[0.92rem] font-semibold text-slate-400"
          >
            {ceo.name}
          </motion.p>

          {ceo.credentials.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.32, duration: 0.5, ease }}
              className="mt-5 flex flex-wrap items-center justify-center gap-2 lg:justify-start"
            >
              {ceo.credentials.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1.5 font-display text-[0.62rem] font-bold uppercase tracking-[0.1em] text-slate-200"
                >
                  <BadgeCheck className="h-3.5 w-3.5 text-emerald-400" /> {c}
                </span>
              ))}
            </motion.div>
          ) : null}
        </div>
      </div>

      {/* Bottom: proof + quote */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.24, duration: 0.6, ease }}
        className="relative grid gap-7 border-t border-white/10 bg-white/[0.03] p-7 sm:p-9 lg:grid-cols-2 lg:items-center"
      >
        {/* Proof band */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 lg:justify-start">
          {ACADEMY_STATS.map((s, i) => {
            const tones = ["#10B981", "#38BDF8", "#60A5FA", "#2DD4BF"];
            return (
              <div key={s.label} className="flex flex-col items-center gap-0.5 lg:items-start">
                <span className="font-display text-[1.4rem] font-black leading-none" style={{ color: tones[i % tones.length] }}>
                  {s.value}
                </span>
                <span className="font-mono text-[0.5rem] uppercase tracking-[0.16em] text-slate-400">{s.label}</span>
              </div>
            );
          })}
        </div>

        {/* Quote */}
        {ceo.bio ? (
          <div className="relative rounded-xl border-l-4 border-emerald-400 bg-white/[0.05] p-5">
            <Quote className="h-6 w-6 text-emerald-400" aria-hidden />
            <p className="mt-2 font-serif text-[1.02rem] italic leading-relaxed text-slate-200">
              &ldquo;{ceo.bio}&rdquo;
            </p>
          </div>
        ) : null}
      </motion.div>
    </motion.div>
  );
}