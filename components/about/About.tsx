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

        {/* Founder highlight — high-tech premium card */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease }}
          className="relative mt-20 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#0c0f1f] via-[#111528] to-[#0d112a] text-ivory shadow-[0_60px_120px_-60px_rgb(79_70_229/0.5)]"
        >
          {/* Background texture — pure CSS, works on all devices */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.25]"
            style={{
              backgroundImage:
                "radial-gradient(rgb(255 255 255 / 0.06) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          {/* Gradient orbs — pure framer motion, no CSS animation classes */}
          <motion.div
            aria-hidden
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand/40 blur-[90px]"
          />
          <motion.div
            aria-hidden
            animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-brand-magenta/25 blur-[90px]"
          />
          <motion.div
            aria-hidden
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute -right-16 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full border border-white/[0.04] opacity-40"
          />

          <div className="relative grid gap-10 p-8 sm:p-12 lg:grid-cols-[auto_1fr_0.9fr] lg:gap-12 lg:p-14">
            {/* Avatar with animated tech frame */}
            <div className="relative mx-auto lg:mx-0">
              {/* Animated ring — uses framer-motion, not CSS class, so works everywhere */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                aria-hidden
                className="absolute -inset-3 rounded-[1.8rem] border-2 border-dashed border-brand/40"
              />
              <motion.span
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                aria-hidden
                className="absolute -inset-2 rounded-[1.6rem] bg-[conic-gradient(from_0deg,#6366f1,#f59e0b,#d63a8c,#6366f1)] opacity-60 blur-[6px]"
              />
              <span className="relative grid h-[9.5rem] w-[9.5rem] place-items-center overflow-hidden rounded-[1.6rem] bg-gradient-to-br from-brand to-brand-magenta shadow-2xl ring-1 ring-white/10">
                {FOUNDER.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={FOUNDER.image}
                    alt={FOUNDER.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-display text-5xl font-extrabold text-white">{initials}</span>
                )}
              </span>

              {/* Floating badge chips — animated with framer-motion for all devices */}
              <motion.span
                animate={{ y: [-4, 4, -4] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-3 -right-4 grid h-10 w-10 place-items-center rounded-full border border-brand/40 bg-[#111528] text-gold-light shadow-lg backdrop-blur"
                style={{ animationDelay: "0s" }}
              >
                <span className="font-display text-[0.6rem] font-bold">CEO</span>
              </motion.span>

              <motion.span
                animate={{ y: [3, -3, 3] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -left-6 -top-2 flex items-center gap-1.5 rounded-full border border-ivory/15 bg-[#111528] px-2.5 py-1.5 shadow-lg backdrop-blur"
              >
                <span className="font-mono text-[0.5rem] font-bold text-gold-light">8+</span>
                <span className="text-[0.48rem] uppercase tracking-wider text-ivory/50">yrs</span>
              </motion.span>

              <motion.span
                animate={{ y: [-3, 5, -3] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute -top-4 right-2 flex items-center gap-1.5 rounded-full border border-ivory/15 bg-[#111528] px-2.5 py-1.5 shadow-lg backdrop-blur"
              >
                <span className="font-mono text-[0.5rem] font-bold text-brand">IELTS</span>
                <span className="text-[0.48rem] uppercase tracking-wider text-ivory/50">expert</span>
              </motion.span>
            </div>

            {/* Identity + content */}
            <div className="flex flex-col items-center text-center lg:items-start lg:text-start">
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15, duration: 0.5, ease }}
                className="font-display text-[0.64rem] font-bold uppercase tracking-[0.36em] text-gold-light"
              >
                {ACADEMY.foundedByLabel}
              </motion.p>
              <motion.h3
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.5, ease }}
                className="mt-2 font-display text-[2rem] font-black leading-[1.1] tracking-tight sm:text-4xl lg:text-[2.6rem]"
              >
                {FOUNDER.headline}
              </motion.h3>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.28, duration: 0.5, ease }}
                className="mt-4 flex flex-wrap items-center justify-center gap-2 lg:justify-start"
              >
                {FOUNDER.credentials.map((c, ci) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1.5 rounded-full border border-ivory/15 bg-ivory/[0.05] px-4 py-1.5 font-display text-[0.68rem] font-bold uppercase tracking-[0.14em] text-ivory/80 backdrop-blur"
                  >
                    <span
                      aria-hidden
                      className="h-1 w-1 rounded-full bg-gold-light"
                      style={{ animationDelay: `${ci * 0.5}s` }}
                    />
                    {c}
                  </span>
                ))}
              </motion.div>

              {/* Bio paragraphs */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.35, duration: 0.5, ease }}
                className="mt-6 flex flex-col gap-3"
              >
                {FOUNDER.bio.map((para, bi) => (
                  <p key={bi} className="text-[0.92rem] leading-relaxed text-ivory/70">
                    {para}
                  </p>
                ))}
              </motion.div>

              {/* Professional stats — compact inline */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.45, duration: 0.5, ease }}
                className="mt-7 flex w-full flex-wrap items-center gap-4 border-t border-ivory/[0.1] pt-6 sm:gap-6"
              >
                {ACADEMY_STATS.map((s) => (
                  <div key={s.label} className="flex flex-col items-center gap-1">
                    <span className="font-display text-[1.1rem] font-black text-white">{s.value}</span>
                    <span className="font-mono text-[0.52rem] uppercase tracking-[0.16em] text-ivory/45">
                      {s.label}
                    </span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Quote — elegant styled */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6, ease }}
              className="relative self-center rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-md"
            >
              <Quote className="h-10 w-10 text-gold/40" aria-hidden />
              <p className="mt-3 font-serif text-[1.15rem] italic leading-relaxed text-ivory/90">
                &ldquo;{FOUNDER.quote}&rdquo;
              </p>
              <span aria-hidden className="mt-5 inline-block h-px w-16 bg-gold/50" />
              <div className="mt-4 flex items-center justify-between">
                <p className="font-display text-[0.62rem] font-bold uppercase tracking-[0.2em] text-ivory/50">
                  — {ACADEMY.name}
                </p>
                <span className="flex items-center gap-1 text-[0.56rem] text-ivory/30">
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
