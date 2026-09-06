"use client";

import { motion } from "framer-motion";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ACADEMY, ACADEMY_STATS, FOUNDER } from "@/lib/content";
import { Award, BadgeCheck, GraduationCap, Quote, Users } from "lucide-react";
import { useLang } from "@/components/LanguageProvider";

const PILLARS = [
  { title: "Confidence", note: "The quiet belief that your words are worth speaking.", tone: "#6366f1" },
  { title: "Communication", note: "Being truly understood — and understanding.", tone: "#0ea5e9" },
  { title: "Expression", note: "Making your ideas sound like you.", tone: "#d63a8c" },
  { title: "Possibility", note: "Doors that open when you say what you mean.", tone: "#f59e0b" },
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
      className="relative overflow-hidden bg-white px-6 py-24 sm:px-12"
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
          subtitle={dict["about.subtitle"]}
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-4">
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease }}
              whileHover={{ y: -6 }}
              className="rounded-3xl border border-ink/[0.07] bg-[#fafbfe] p-7"
            >
              <span
                aria-hidden
                className="grid h-2.5 w-12 rounded-full"
                style={{ background: p.tone }}
              />
              <h3 className="mt-5 font-display text-[1.3rem] font-extrabold tracking-tight text-ink">
                {p.title}
              </h3>
              <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-2">{p.note}</p>
            </motion.div>
          ))}
        </div>

        {/* Founder highlight */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.7, ease }}
          className="relative mt-20 overflow-hidden rounded-[2.5rem] bg-[#0d0c16] text-ivory shadow-[0_60px_120px_-60px_rgb(79_70_229/0.5)]"
        >
          {/* Decorative layers */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "radial-gradient(rgb(255 255 255 / 0.07) 1px, transparent 1px)",
              backgroundSize: "26px 26px",
            }}
          />
          <div
            aria-hidden
            className="gradient-pan absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "conic-gradient(from 90deg, #6366f1, #d63a8c, #f59e0b, #0ea5e9, #6366f1)",
            }}
          />
          <div aria-hidden className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-brand/40 blur-[90px]" />
          <div aria-hidden className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-brand-magenta/25 blur-[90px]" />
          <div aria-hidden className="shine-sweep" />

          <div className="relative grid gap-10 p-8 sm:p-12 lg:grid-cols-[auto_1fr_0.9fr] lg:gap-12 lg:p-14">
            {/* Avatar */}
            <div className="relative mx-auto lg:mx-0">
              <span
                aria-hidden
                className="ring-spin-slow absolute -inset-3 rounded-[1.8rem] bg-[conic-gradient(from_0deg,#6366f1,#f59e0b,#d63a8c,#6366f1)] opacity-70 blur-[8px]"
              />
              <span className="relative grid h-32 w-32 place-items-center rounded-[1.8rem] bg-gradient-to-br from-brand to-brand-magenta font-display text-5xl font-extrabold text-white shadow-2xl ring-1 ring-white/10">
                {initials}
              </span>
              <span className="absolute -bottom-2 -right-2 grid h-10 w-10 place-items-center rounded-full bg-emerald-500 text-white ring-4 ring-[#0d0c16]">
                <BadgeCheck className="h-5 w-5" />
              </span>
            </div>

            {/* Identity */}
            <div className="flex flex-col items-center text-center lg:items-start lg:text-start">
              <p className="font-display text-[0.66rem] font-bold uppercase tracking-[0.34em] text-gold-light">
                {ACADEMY.foundedByLabel}
              </p>
              <h3 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                {FOUNDER.headline}
              </h3>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                {FOUNDER.credentials.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1.5 rounded-full border border-ivory/15 bg-ivory/[0.05] px-4 py-1.5 font-display text-[0.68rem] font-bold uppercase tracking-[0.14em] text-ivory/80"
                  >
                    <Award className="h-3.5 w-3.5 text-gold-light/80" strokeWidth={2} />
                    {c}
                  </span>
                ))}
              </div>

              <div className="mt-7 grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
                {ACADEMY_STATS.map((s, i) => (
                  <div
                    key={s.label}
                    className="rounded-2xl border border-ivory/10 bg-ivory/[0.04] px-3 py-4 text-center"
                  >
                    <div className="flex items-center justify-center gap-1.5 font-display text-[1.35rem] font-extrabold text-white">
                      {i === 1 ? <Users className="h-4 w-4 text-gold-light/70" /> : i === 2 ? <GraduationCap className="h-4 w-4 text-gold-light/70" /> : null}
                      {s.value}
                    </div>
                    <p className="mt-1 font-mono text-[0.56rem] uppercase tracking-[0.16em] text-ivory/50">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quote */}
            <div className="relative self-center rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-md">
              <Quote className="h-10 w-10 text-gold/40" aria-hidden />
              <p className="mt-3 font-serif text-[1.15rem] italic leading-relaxed text-ivory/90">
                “{FOUNDER.quote}”
              </p>
              <span aria-hidden className="mt-5 inline-block h-px w-16 bg-gold/50" />
              <p className="mt-3 font-display text-[0.62rem] font-bold uppercase tracking-[0.2em] text-ivory/50">
                — {ACADEMY.name}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
