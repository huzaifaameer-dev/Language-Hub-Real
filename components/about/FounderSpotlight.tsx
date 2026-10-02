"use client";

import { motion } from "framer-motion";
import { FOUNDER } from "@/lib/content";

const ease = [0.16, 1, 0.3, 1] as const;

const BIO = [
  "Javaria Malik is the CEO and founder of Language Hub, where she has spent over 8 years turning hesitant speakers into confident communicators. Her conversation-first method treats English as a living skill — something learners actually use, not merely study.",
  "Under her leadership, every programme pairs structured lessons with real speaking practice, mock interviews and honest feedback — so progress in the classroom shows up in real conversations.",
];

/** CEO / Founder spotlight — calm, calm luxury. */
export function FounderSpotlight() {
  return (
    <section
      id="founder"
      data-section
      className="relative overflow-hidden bg-[#F4F7FF] px-6 py-16 sm:px-12 sm:py-20"
      aria-label="Founder profile"
    >
      <div className="relative mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease }}
          className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0B1322] shadow-[0_60px_120px_-50px_rgb(2_6_23/0.85)]"
        >
          {/* Background: image + emerald/blue glows */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <img src="/ceo-bg.jpg" alt="" className="h-full w-full object-cover opacity-[0.25]" />
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

          {/* animated hairline — emerald → blue */}
          <motion.div
            aria-hidden
            animate={{ scaleX: [0.35, 1, 0.35] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-x-0 top-0 h-[3px] origin-left bg-gradient-to-r from-emerald-400 via-sky-400 to-blue-500"
          />

          <div className="relative grid gap-10 p-8 sm:p-10 lg:grid-cols-[300px_1fr] lg:gap-14">
            {/* Photo */}
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative mx-auto w-full max-w-[20rem] lg:mx-0"
            >
              <motion.span
                aria-hidden
                animate={{ scale: [1, 1.06, 1], opacity: [0.35, 0.6, 0.35] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -inset-3 rounded-[1.6rem] bg-emerald-500/40 blur-2xl"
              />
              <span className="relative block overflow-hidden rounded-[1.35rem] ring-1 ring-white/15">
                {FOUNDER.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={FOUNDER.image} alt={FOUNDER.name} className="aspect-[4/5] w-full object-cover" />
                ) : (
                  <span className="grid aspect-[4/5] w-full place-items-center bg-gradient-to-br from-emerald-500 to-blue-600">
                    <span className="font-display text-5xl font-extrabold text-white">{FOUNDER.name.charAt(0)}</span>
                  </span>
                )}
              </span>
              <span className="absolute -bottom-3 -right-3 rounded-full border border-emerald-400/40 bg-[#0B1322] px-3 py-1.5 font-mono text-[0.6rem] font-bold tracking-[0.2em] text-emerald-300 shadow-lg">
                CEO
              </span>
            </motion.div>

            {/* Identity + bio */}
            <div className="flex flex-col justify-center text-center lg:text-start">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15, duration: 0.5, ease }}
                className="mx-auto flex items-center justify-center gap-3 font-mono text-[0.6rem] font-bold uppercase tracking-[0.3em] text-emerald-300 lg:mx-0 lg:justify-start"
              >
                <span aria-hidden className="hidden h-px w-8 bg-emerald-400/50 sm:block" />
                {FOUNDER.role}
              </motion.p>

              <motion.h3
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.5, ease }}
                className="mt-3 font-display text-[clamp(2rem,4.5vw,2.9rem)] font-black leading-tight tracking-[-0.02em] text-white"
              >
                {FOUNDER.name}
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.26, duration: 0.5, ease }}
                className="mt-1.5 font-display text-[0.92rem] font-semibold text-slate-400"
              >
                Founder of Pakistan&apos;s conversation-first English academy
              </motion.p>

              {/* Bio */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.32, duration: 0.5, ease }}
                className="mt-5 flex flex-col gap-3 text-start"
              >
                {BIO.map((para) => (
                  <p key={para.slice(0, 24)} className="text-[0.95rem] leading-relaxed text-slate-300">
                    {para}
                  </p>
                ))}
              </motion.div>

              {/* Credentials */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.5, ease }}
                className="mt-6 flex flex-wrap items-center justify-center gap-2 lg:justify-start"
              >
                {FOUNDER.credentials.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1.5 font-display text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-200"
                  >
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {c}
                  </span>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}