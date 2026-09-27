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

        {/* Founder spotlight — vibrant premium */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease }}
          className="relative mt-20 overflow-hidden rounded-[2.5rem] p-0.5 shadow-[0_60px_120px_-50px_rgb(79_70_229/0.5)]"
        >
          {/* animated conic border */}
          <motion.span
            aria-hidden
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-[150%] bg-[conic-gradient(from_0deg,#6366F1,#0EA5E9,#F0C36D,#EC4899,#D946EF,#6366F1)]"
          />
          <div className="relative overflow-hidden rounded-[calc(2.5rem-2px)] bg-[linear-gradient(135deg,#EDF3FF_0%,#DFEAFF_45%,#F1E8FF_100%)] p-7 sm:p-10">
            {/* living aurora background */}
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <motion.div
                animate={{ x: [0, 30, 0], y: [0, -22, 0], scale: [1, 1.12, 1] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-24 -top-24 h-80 w-80 rounded-[50%]"
                style={{ background: "radial-gradient(50% 50% at 50% 50%, rgb(99 102 241 / 0.30), transparent 70%)" }}
              />
              <motion.div
                animate={{ x: [0, -26, 0], y: [0, 18, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-24 -left-20 h-80 w-80 rounded-[50%]"
                style={{ background: "radial-gradient(50% 50% at 50% 50%, rgb(168 85 247 / 0.26), transparent 70%)" }}
              />
              <motion.div
                animate={{ x: [0, 16, 0], y: [0, -12, 0] }}
                transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute right-8 top-1/3 h-44 w-44 rounded-[50%]"
                style={{ background: "radial-gradient(50% 50% at 50% 50%, rgb(245 158 11 / 0.22), transparent 70%)" }}
              />
              <div
                className="absolute inset-0 opacity-[0.30]"
                style={{
                  backgroundImage: "radial-gradient(rgb(99 102 241 / 0.24) 1px, transparent 1px)",
                  backgroundSize: "30px 30px",
                  maskImage: "radial-gradient(ellipse at 60% 30%, black 0%, transparent 65%)",
                  WebkitMaskImage: "radial-gradient(ellipse at 60% 30%, black 0%, transparent 65%)",
                }}
              />
            </div>

            <div className="relative grid gap-10 lg:grid-cols-[300px_1fr] lg:gap-14">
              {/* Photo — conic ring + colorful chips */}
              <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                  className="relative mx-auto w-full max-w-[20rem] lg:mx-0"
                >
                <motion.span
                  aria-hidden
                  animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.85, 0.5] }}
                  transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -inset-4 rounded-[2rem] bg-[radial-gradient(60% 60% at 40% 40%, rgb(99 102 241 / 0.35), rgb(236 72 153 / 0.16), transparent 72%)] blur-xl"
                />
                <span className="relative block overflow-hidden rounded-[1.55rem] ring-4 ring-white shadow-[0_30px_70px_-30px_rgb(79_70_229/0.6)]">
                  {FOUNDER.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={FOUNDER.image} alt={FOUNDER.name} className="aspect-[4/5] w-full object-cover" />
                  ) : (
                    <span className="grid aspect-[4/5] w-full place-items-center bg-gradient-to-br from-[#6366F1] to-[#EC4899]">
                      <span className="font-display text-5xl font-extrabold text-white">{initials}</span>
                    </span>
                  )}
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#6366F1]/10 to-transparent" aria-hidden />
                </span>

                {/* Colorful chips (static) */}
                <span className="absolute -left-3 -top-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-display text-[0.62rem] font-bold text-emerald-700 shadow-lg">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> 8+ Years
                </span>
                <span className="absolute -right-3 top-1/4 inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 font-display text-[0.62rem] font-bold text-sky-700 shadow-lg">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500" /> IELTS · PTE
                </span>
                <span className="absolute -bottom-3 -right-3 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 font-display text-[0.62rem] font-bold text-amber-700 shadow-lg">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> 600+ Students
                </span>
                </motion.div>

              {/* Identity + bio */}
              <div className="flex flex-col justify-center text-center lg:text-start">
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15, duration: 0.5, ease }}
                  className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#C7D2FE] bg-gradient-to-r from-[#EEF2FF] to-[#FAF5FF] px-4 py-1.5 font-mono text-[0.6rem] font-bold uppercase tracking-[0.26em] text-[#4F46E5] lg:mx-0"
                >
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[#6366F1] to-[#EC4899]" />
                  {FOUNDER.role}
                </motion.span>

                <motion.h3
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2, duration: 0.5, ease }}
                  className="mt-4 font-display text-[clamp(2rem,4.5vw,3rem)] font-black leading-tight tracking-[-0.02em] text-ink"
                >
                  <span style={{ backgroundImage: "linear-gradient(100deg,#6366F1,#0EA5E9,#EC4899)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
                    {FOUNDER.name}
                  </span>
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.26, duration: 0.5, ease }}
                  className="mt-2 font-display text-[0.92rem] font-semibold text-[#64748B]"
                >
                  Founder of Pakistan's conversation-first English academy
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

                {/* Credentials — colorful chips */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4, duration: 0.5, ease }}
                  className="mt-6 flex flex-wrap items-center justify-center gap-2 lg:justify-start"
                >
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 font-display text-[0.64rem] font-bold uppercase tracking-[0.12em] text-indigo-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> English Language Specialist
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3.5 py-1.5 font-display text-[0.64rem] font-bold uppercase tracking-[0.12em] text-violet-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-500" /> IELTS · PTE Coach
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1.5 font-display text-[0.64rem] font-bold uppercase tracking-[0.12em] text-amber-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Conversation-first method
                  </span>
                </motion.div>
              </div>
            </div>

            {/* Bottom: stats + quote — colorful band */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.24, duration: 0.6, ease }}
              className="relative mt-9 grid gap-7 rounded-2xl border border-[#C7D2FE]/70 bg-gradient-to-r from-[#EEF2FF] via-[#F5F3FF] to-[#FFF7ED] p-6 sm:p-7 lg:grid-cols-2 lg:items-center"
            >
              {/* Stats */}
              <div className="flex flex-wrap items-center justify-center gap-6 lg:justify-start lg:gap-10">
                {ACADEMY_STATS.map((s, si) => {
                  const tones = ["#6366F1", "#0EA5E9", "#8B5CF6", "#F59E0B"];
                  const tone = tones[si % tones.length];
                  return (
                    <div key={s.label} className="flex flex-col items-center gap-1 lg:items-start">
                      <span className="font-display text-[1.5rem] font-black" style={{ color: tone }}>{s.value}</span>
                      <span className="font-mono text-[0.54rem] uppercase tracking-[0.16em] text-ink-3">{s.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Quote */}
              <div className="relative rounded-xl border-l-4 border-amber-400 bg-white/80 p-5 backdrop-blur-sm">
                <Quote className="h-6 w-6 text-amber-400" aria-hidden />
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
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
