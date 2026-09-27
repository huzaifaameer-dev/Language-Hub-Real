"use client";

import { motion } from "framer-motion";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ACADEMY, FOUNDER } from "@/lib/content";
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
                Beyond{" "}
                <span
                  style={{
                    backgroundImage: "linear-gradient(100deg,#1D4ED8,#2563EB,#38BDF8)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  English.
                </span>
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
              <span className="bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#38BDF8] bg-clip-text text-transparent">
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

        {/* Founder spotlight — calm, calm, luxury */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease }}
          className="relative mt-20 overflow-hidden rounded-[2rem] border border-white/10 bg-[#0B1322] shadow-[0_60px_120px_-50px_rgb(2_6_23/0.85)]"
        >
          {/* Background: image at 8% + calm emerald/blue glows */}
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
                    <span className="font-display text-5xl font-extrabold text-white">{initials}</span>
                  </span>
                )}
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" aria-hidden />
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
                <p className="text-[0.95rem] leading-relaxed text-slate-300">
                  Javaria Malik is the CEO and founder of Language Hub, where she has
                  spent over 8 years turning hesitant speakers into confident
                  communicators. Her conversation-first method treats English as a living
                  skill — something learners actually use, not merely study.
                </p>
                <p className="text-[0.95rem] leading-relaxed text-slate-300">
                  Under her leadership, every programme pairs structured lessons with real
                  speaking practice, mock interviews and honest feedback — so progress in
                  the classroom shows up in real conversations.
                </p>
              </motion.div>

              {/* Credentials — slate chips */}
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

          {/* Bottom band: quick facts + quote */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.24, duration: 0.6, ease }}
            className="relative grid gap-7 border-t border-white/10 bg-white/[0.03] p-7 sm:p-9 lg:grid-cols-2 lg:items-center"
          >
            {/* Quick facts */}
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 lg:justify-start">
              {[
                { text: "Conversation-first method", tone: "#10B981" },
                { text: "IELTS · PTE Coach", tone: "#38BDF8" },
                { text: "Small-batch teaching", tone: "#60A5FA" },
                { text: "Personal mentorship", tone: "#2DD4BF" },
              ].map((f) => (
                <div key={f.text} className="flex items-center gap-2">
                  <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: f.tone }} />
                  <span className="font-display text-[0.78rem] font-bold text-slate-200">{f.text}</span>
                </div>
              ))}
            </div>

            {/* Quote */}
            <div className="relative rounded-xl border-l-4 border-emerald-400 bg-white/[0.05] p-5">
              <Quote className="h-6 w-6 text-emerald-400" aria-hidden />
              <p className="mt-2 font-serif text-[1.02rem] italic leading-relaxed text-slate-200">
                &ldquo;{FOUNDER.quote}&rdquo;
              </p>
              <div className="mt-3 flex items-center justify-between">
                <p className="font-display text-[0.6rem] font-bold uppercase tracking-[0.2em] text-slate-400">
                  — {FOUNDER.name}
                </p>
                <span className="flex items-center gap-1 text-[0.54rem] text-slate-500">
                  <ExternalLink className="h-3 w-3" />
                  <span className="uppercase tracking-wider">Verified</span>
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
