"use client";

import { motion } from "framer-motion";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ACADEMY, ACADEMY_STATS, FOUNDER } from "@/lib/content";
import { Quote, ExternalLink, ArrowUpRight } from "lucide-react";
import { useLang } from "@/components/LanguageProvider";

const PILLARS = [
  { idx: "01", title: "Confidence", label: "Speak freely", note: "The quiet assurance that your words deserve to be heard.", tone: "#2563EB" },
  { idx: "02", title: "Communication", label: "Connect", note: "Being clearly understood — and really understanding in return.", tone: "#0EA5E9" },
  { idx: "03", title: "Expression", label: "Be yourself", note: "Your ideas, in your voice — sharp, warm, unmistakably you.", tone: "#7C3AED" },
  { idx: "04", title: "Possibility", label: "Open doors", note: "New opportunities swing open the moment you say exactly what you mean.", tone: "#D97706" },
];

const ease = [0.16, 1, 0.3, 1] as const;

export function About() {
  const { dict, lang } = useLang();
  const isUr = lang === "ur";
  const initials = ACADEMY.founder
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <section
      id="about"
      data-section
      className="relative overflow-hidden bg-white px-6 pt-12 pb-24 sm:px-12"
      aria-label="Beyond English"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          eyebrow={dict["about.eyebrow"]}
          title={
            isUr ? (
              <>{dict["about.title"]} <span className="brand-text">{dict["about.title2"]}</span></>
            ) : (
              <>
                Beyond <span className="brand-text">English.</span>
              </>
            )
          }
          subtitle={
            isUr
              ? dict["about.subtitle"]
              : "English is not the destination — it is the doorway. Here it opens onto confidence, connection, voice and opportunity."
          }
        />

        {/* Editorial pillars: sticky statement + premium row list */}
        <div className="mt-16 grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          {/* Sticky statement */}
          <div className="self-start lg:sticky lg:top-32">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, ease }}
              className="flex items-center gap-3 font-mono text-[0.6rem] font-bold uppercase tracking-[0.3em] text-[#2563EB]"
            >
              <span aria-hidden className="h-px w-8 bg-[#2563EB]/40" />
              Why it matters
            </motion.p>
            <motion.h3
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.55, ease, delay: 0.06 }}
              className="mt-4 font-display text-[clamp(1.7rem,3.4vw,2.4rem)] font-extrabold leading-tight tracking-[-0.02em] text-ink"
            >
              Fluency is just the{" "}
              <span className="bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#D97706] bg-clip-text text-transparent">
                beginning.
              </span>
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.55, ease, delay: 0.12 }}
              className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-ink-2"
            >
              Every lesson builds something bigger than grammar — the presence, the
              confidence and the voice that carry you beyond the classroom. You walk
              into interviews, meetings and everyday conversations with the poise to
              be heard, the clarity to be understood and the personality to be
              remembered.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, ease, delay: 0.18 }}
              aria-hidden
              className="mt-8 h-px w-24 bg-gradient-to-r from-[#2563EB]/60 to-transparent"
            />
          </div>

          {/* Pillar rows */}
          <div className="flex flex-col">
            <div className="divide-y divide-ink/[0.07]">
              {PILLARS.map((p, i) => (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease }}
                >
                  <div className="group -mx-3 flex items-center gap-5 rounded-2xl px-3 py-6 transition-colors duration-300 hover:bg-[#2563EB]/[0.03]">
                    <span className="font-mono text-[0.68rem] font-bold text-ink-3 transition-colors group-hover:text-[#2563EB]">
                      {p.idx}
                    </span>
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 shrink-0 rounded-full transition-transform duration-300 group-hover:scale-125"
                      style={{ backgroundColor: p.tone }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <h4 className="font-display text-[1.18rem] font-extrabold tracking-tight text-ink">
                          {p.title}
                        </h4>
                        <span className="rounded-full border bg-white px-2 py-0.5 font-mono text-[0.52rem] font-bold uppercase tracking-[0.18em] text-ink-3"
                          style={{ borderColor: `${p.tone}33`, color: p.tone }}
                        >
                          {p.label}
                        </span>
                      </span>
                      <p className="mt-1.5 text-[0.9rem] leading-relaxed text-ink-2">{p.note}</p>
                    </span>
                    <ArrowUpRight
                      aria-hidden
                      className="h-4 w-4 shrink-0 -translate-x-1 translate-y-1 text-ink-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100"
                      style={{ color: p.tone }}
                      strokeWidth={2.2}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Founder spotlight — light premium */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease }}
          className="relative mt-20 overflow-hidden rounded-[2.5rem] border border-ink/[0.07] bg-[linear-gradient(135deg,#F7FAFF_0%,#EEF4FF_55%,#F2EFFF_100%)] shadow-[0_40px_90px_-50px_rgb(37_99_235/0.4)]"
        >
          {/* Calm ambient glow + faint texture (subtle, professional) */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div
              className="absolute -right-24 -top-24 h-72 w-72 rounded-[50%]"
              style={{ background: "radial-gradient(50% 50% at 50% 50%, rgb(37 99 235 / 0.10), transparent 70%)" }}
            />
            <div
              className="absolute inset-0 opacity-[0.22]"
              style={{
                backgroundImage: "radial-gradient(rgb(37 99 235 / 0.14) 1px, transparent 1px)",
                backgroundSize: "26px 26px",
                maskImage: "radial-gradient(ellipse at 30% 20%, black 0%, transparent 60%)",
                WebkitMaskImage: "radial-gradient(ellipse at 30% 20%, black 0%, transparent 60%)",
              }}
            />
          </div>

          <div className="relative grid gap-10 p-8 sm:p-12 lg:grid-cols-[280px_1fr] lg:gap-14">
            {/* Photo */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.6, ease }}
              className="relative mx-auto w-full max-w-[20rem] lg:mx-0"
            >
              <span className="block overflow-hidden rounded-[1.6rem] ring-1 ring-[#2563EB]/10 shadow-[0_28px_64px_-34px_rgb(37_99_235/0.65)]">
                {FOUNDER.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={FOUNDER.image} alt={FOUNDER.name} className="aspect-[4/5] w-full object-cover" />
                ) : (
                  <span className="grid aspect-[4/5] w-full place-items-center bg-gradient-to-br from-[#2563EB] to-[#6D4AFF]">
                    <span className="font-display text-5xl font-extrabold text-white">{initials}</span>
                  </span>
                )}
              </span>
              <span className="absolute -bottom-3 -right-3 grid h-10 w-10 place-items-center rounded-full border border-[#2563EB]/15 bg-white font-display text-[0.62rem] font-bold text-[#2563EB] shadow-[0_10px_26px_-12px_rgb(37_99_235/0.6)]">
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
                className="flex items-center justify-center gap-3 font-mono text-[0.6rem] font-bold uppercase tracking-[0.3em] text-[#2563EB] lg:justify-start"
              >
                <span aria-hidden className="hidden h-px w-8 bg-[#2563EB]/40 sm:block" />
                {FOUNDER.role}
              </motion.p>
              <motion.h3
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.5, ease }}
                className="mt-3 font-display text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold leading-tight tracking-[-0.02em] text-ink"
              >
                {FOUNDER.name}
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.26, duration: 0.5, ease }}
                className="mt-1.5 font-display text-[0.92rem] font-semibold text-[#64748B]"
              >
                Building the conversation-first academy in Pakistan
              </motion.p>

              {/* Bio */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.32, duration: 0.5, ease }}
                className="mt-5 flex flex-col gap-3 text-start"
              >
                <p className="text-[0.95rem] leading-relaxed text-ink-2">
                  Ms. Javaria Malik is the CEO and founder of Language Hub, where she has
                  spent over 8 years turning hesitant speakers into confident
                  communicators. Her conversation-first method treats English as a living
                  skill — something learners actually use, not merely study.
                </p>
                <p className="text-[0.95rem] leading-relaxed text-ink-2">
                  Under her leadership, every programme pairs structured lessons with real
                  speaking practice, mock interviews and honest feedback — so progress in
                  the classroom shows up in real conversations.
                </p>
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
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#2563EB]/15 bg-white px-3.5 py-1.5 font-display text-[0.66rem] font-bold uppercase tracking-[0.12em] text-[#1647C7] shadow-[0_6px_16px_-10px_rgb(37_99_235/0.5)]"
                  >
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[#2563EB] to-[#6D4AFF]" />
                    {c}
                  </span>
                ))}
              </motion.div>
            </div>
          </div>

          {/* Bottom row: stats + quote */}
          <div className="relative grid gap-8 border-t border-[#2563EB]/10 px-8 py-7 sm:px-12 lg:grid-cols-2 lg:items-center">
            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5, ease }}
              className="flex flex-wrap items-center justify-center gap-6 lg:justify-start lg:gap-10"
            >
              {ACADEMY_STATS.map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-1 lg:items-start">
                  <span className="font-display text-[1.35rem] font-black text-ink">{s.value}</span>
                  <span className="font-mono text-[0.54rem] uppercase tracking-[0.16em] text-ink-3">
                    {s.label}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* Quote */}
            <motion.div
              initial={{ opacity: 0, x: 14 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.28, duration: 0.55, ease }}
              className="relative rounded-2xl border border-[#2563EB]/10 bg-white/80 p-5 backdrop-blur-sm"
            >
              <Quote className="h-6 w-6 text-[#2563EB]/30" aria-hidden />
              <p className="mt-2 font-serif text-[1.02rem] italic leading-relaxed text-ink">
                &ldquo;{FOUNDER.quote}&rdquo;
              </p>
              <div className="mt-3 flex items-center justify-between">
                <p className="font-display text-[0.6rem] font-bold uppercase tracking-[0.2em] text-ink-3">
                  — {FOUNDER.name}
                </p>
                <span className="flex items-center gap-1 text-[0.54rem] text-ink-3">
                  <ExternalLink className="h-3 w-3" />
                  <span className="uppercase tracking-wider">Verified</span>
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
