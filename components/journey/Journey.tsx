"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useLang } from "@/components/LanguageProvider";
import { useInView, useReducedMotionSafe } from "@/lib/hooks";
import { EASE_EXPO } from "@/lib/motion";
import { Briefcase, Mic, Presentation, UserCheck } from "lucide-react";

/**
 * The four experiences of every programme, presented as a split "experience
 * stage": a quiet numbered index on the left drives a large, colour-graded
 * panel on the right. Each chapter owns its own gradient world — blue, violet,
 * teal, gold — and the stage crossfades between them while a hairline progress
 * bar counts down to the next. Hover a row to jump; tap on touch.
 *
 * Deliberately unlike anything else on the site: no illustration, no cards —
 * one composed object with light, colour and motion doing the work.
 *
 * The section header (eyebrow / title / subtitle) is intentionally untouched.
 */
const CHAPTERS = [
  {
    n: "01",
    label: "Speaking practice",
    icon: Mic,
    title: "Fluency & Confidence",
    desc: "Speak naturally, express your ideas clearly and build confidence for real-world communication.",
    from: "#0E2A6B",
    via: "#2E5BFF",
    to: "#7FB2FF",
  },
  {
    n: "02",
    label: "Guest mentors",
    icon: Presentation,
    title: "Chief Guest Sessions",
    desc: "Learn from experienced speakers and special guests who share practical insights.",
    from: "#2A1170",
    via: "#6D4AFF",
    to: "#B79BFF",
  },
  {
    n: "03",
    label: "Personal coaching",
    icon: UserCheck,
    title: "One-on-One Sessions",
    desc: "Get personalized attention, focused practice and feedback based on your goals.",
    from: "#06403C",
    via: "#0E9384",
    to: "#4FE0B3",
  },
  {
    n: "04",
    label: "Interview practice",
    icon: Briefcase,
    title: "Mock Interviews",
    desc: "Practice real interview situations, improve communication and receive constructive feedback.",
    from: "#5C3208",
    via: "#D98A0B",
    to: "#FBD46A",
  },
] as const;

const BEAT = 4000;

export function Journey() {
  const { dict, lang } = useLang();
  const isUr = lang === "ur";
  const reduce = useReducedMotionSafe();
  const [active, setActive] = useState(0);
  const [sectionRef, inView] = useInView();

  useEffect(() => {
    // Only advance while the stage is on screen — off-screen the beat and the
    // drifting gradient both hold, and the interval restarts cleanly on return.
    if (reduce || !inView) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % CHAPTERS.length), BEAT);
    return () => window.clearInterval(id);
  }, [reduce, active, inView]);

  const c = CHAPTERS[active];

  return (
    <section
      id="journey"
      ref={sectionRef}
      data-section
      className="relative overflow-hidden bg-site px-6 pb-20 pt-14 sm:px-10 sm:pt-16 md:pb-28"
      aria-label="What makes a Language Hub programme"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-[#305CDE]/[0.06] blur-[120px]"
      />

      <div className="relative mx-auto max-w-6xl">
        <SectionHeader
          eyebrow={dict["journey.eyebrow"]}
          title={
            isUr ? (
              <>
                {dict["journey.title1"]} <span className="brand-text">{dict["journey.title2"]}</span>
              </>
            ) : (
              <>
                From quiet to <span className="brand-text">confident.</span>
              </>
            )
          }
          subtitle={
            isUr
              ? dict["journey.subtitle"]
              : "Live classes paired with real, human-led practice — the experiences that build confident communicators."
          }
        />
      </div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 34 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
        transition={{ duration: 0.8, ease: EASE_EXPO }}
        className="relative mx-auto mt-14 max-w-[1160px]"
      >
        <div className="overflow-hidden rounded-[1.75rem] border border-ink/[0.08] bg-white shadow-[0_50px_120px_-60px_rgb(11_27_58/0.55)] sm:rounded-[2rem]">
          <div className="grid lg:grid-cols-[0.82fr_1.18fr]">
            {/* ── index ── */}
            <div className="relative z-10 flex flex-col justify-center bg-white px-6 py-7 sm:px-9 sm:py-9 lg:px-11 lg:py-12">
              <span className="font-mono text-[0.56rem] font-bold uppercase tracking-[0.3em] text-ink-3">
                Four experiences
              </span>
              <div className="mt-5 flex flex-col lg:mt-7">
                {CHAPTERS.map((ch, i) => {
                  const on = active === i;
                  return (
                    <button
                      key={ch.n}
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onFocus={() => setActive(i)}
                      onClick={() => setActive(i)}
                      aria-pressed={on}
                      className="group relative flex w-full items-center gap-4 border-t border-ink/[0.07] py-4 text-left outline-none first:border-t-0 lg:py-5"
                    >
                      <span
                        className={[
                          "font-mono text-[0.62rem] font-bold tracking-[0.2em] transition-colors duration-300",
                          on ? "text-[#305CDE]" : "text-ink-3",
                        ].join(" ")}
                      >
                        {ch.n}
                      </span>
                      <span
                        className={[
                          "font-display text-[1.02rem] font-bold tracking-tight transition-all duration-300 lg:text-[1.18rem]",
                          on ? "translate-x-0.5 text-ink" : "text-ink-3 group-hover:text-ink-2",
                        ].join(" ")}
                      >
                        {ch.title}
                      </span>
                      <span
                        className={[
                          "ml-auto h-2 w-2 rounded-full transition-all duration-300",
                          on ? "scale-100 bg-[#305CDE]" : "scale-0 bg-transparent",
                        ].join(" ")}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── stage ── */}
            <div className="relative min-h-[360px] overflow-hidden lg:min-h-[480px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={c.n}
                  initial={reduce ? false : { opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.99 }}
                  transition={{ duration: 0.6, ease: EASE_EXPO }}
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${c.from} 0%, ${c.via} 55%, ${c.to} 100%)`,
                  }}
                >
                  {/* drifting light + grain for material depth */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 motion-safe:animate-[gradient-pan_9s_ease-in-out_infinite]"
                    style={{
                      animationPlayState: inView ? "running" : "paused",
                      backgroundImage:
                        "radial-gradient(58% 58% at 22% 18%, rgb(255 255 255 / 0.30), transparent 70%), radial-gradient(48% 48% at 88% 92%, rgb(255 255 255 / 0.16), transparent 72%)",
                    }}
                  />

                  <div className="relative flex h-full flex-col justify-end p-7 text-white sm:p-9 lg:p-11">
                    <span className="font-mono text-[0.58rem] font-bold uppercase tracking-[0.3em] text-white/70">
                      {c.label}
                    </span>
                    <h3 className="mt-3 max-w-[16ch] font-display text-[1.7rem] font-extrabold leading-[1.05] tracking-[-0.02em] sm:text-[2rem] lg:text-[2.3rem]">
                      {c.title}
                    </h3>
                    <p className="mt-3.5 max-w-[42ch] text-[0.92rem] leading-relaxed text-white/85 lg:text-[0.98rem]">
                      {c.desc}
                    </p>

                    <div className="mt-6 flex items-center gap-4">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/15 ring-1 ring-inset ring-white/30 backdrop-blur-sm lg:h-14 lg:w-14">
                        <c.icon className="h-5 w-5 lg:h-6 lg:w-6" strokeWidth={1.8} />
                      </span>
                      <span className="font-mono text-[0.68rem] font-bold tracking-[0.2em] text-white/70">
                        {c.n} <span className="text-white/40">/ 04</span>
                      </span>
                    </div>
                  </div>

                  {/* oversized ghost numeral */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-4 -top-10 select-none font-display text-[10rem] font-black leading-none text-white/10 lg:text-[15rem]"
                  >
                    {c.n}
                  </span>
                </motion.div>
              </AnimatePresence>

              {/* countdown bar — only while visible, so it restarts in sync
                  with the interval when the stage comes back on screen */}
              {!reduce && inView ? (
                <span className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[3px] bg-black/15">
                  <motion.span
                    key={`${active}-bar`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: BEAT / 1000, ease: "linear" }}
                    className="block h-full origin-left bg-white/70"
                  />
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
