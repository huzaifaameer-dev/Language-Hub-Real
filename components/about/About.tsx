"use client";

import { motion } from "framer-motion";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ArrowUpRight } from "lucide-react";
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

  return (
    <section
      id="about"
      data-section
      className="relative overflow-hidden bg-white px-6 pt-6 pb-12 sm:px-12 sm:pt-8 sm:pb-16"
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
      </div>
    </section>
  );
}
