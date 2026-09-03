"use client";

import { motion } from "framer-motion";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ACADEMY, FOUNDER } from "@/lib/content";
import { BadgeCheck, Quote } from "lucide-react";
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
          className="relative mt-14 overflow-hidden rounded-[2rem] bg-ink px-8 py-10 text-ivory sm:px-12"
        >
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/40 blur-3xl" />
            <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
          </div>

          <div className="relative flex flex-col items-center gap-8 lg:flex-row lg:items-start">
            <div className="relative shrink-0">
              <span className="grid h-28 w-28 place-items-center rounded-3xl bg-gradient-to-br from-brand to-brand-magenta font-display text-4xl font-extrabold text-white shadow-[0_24px_50px_-20px_rgb(110_90_224/0.8)]">
                {initials}
              </span>
              <span
                aria-hidden
                className="absolute -bottom-2 -right-2 grid h-9 w-9 place-items-center rounded-full bg-emerald-500 text-white"
              >
                <BadgeCheck className="h-5 w-5" />
              </span>
            </div>

            <div className="flex-1 text-center lg:text-start">
              <p className="font-display text-[0.66rem] font-bold uppercase tracking-[0.34em] text-gold-light">
                {ACADEMY.foundedByLabel}
              </p>
              <h3 className="mt-2 font-display text-3xl font-extrabold tracking-tight">
                {FOUNDER.headline}
              </h3>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                {FOUNDER.credentials.map((c) => (
                  <span
                    key={c}
                    className="rounded-full border border-ivory/15 bg-ivory/[0.05] px-4 py-1.5 font-display text-[0.68rem] font-bold uppercase tracking-[0.14em] text-ivory/80"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative max-w-md lg:self-center">
              <Quote className="absolute -left-3 -top-4 h-10 w-10 text-gold/30" aria-hidden />
              <p className="font-serif text-[1.15rem] italic leading-relaxed text-ivory/90">
                “{FOUNDER.quote}”
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
