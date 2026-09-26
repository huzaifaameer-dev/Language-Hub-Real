"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BadgeCheck, Quote, Sparkles, Star, Users, X } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/footer/Footer";

export interface Story {
  id: string;
  name: string;
  role: string;
  quote: string;
  outcome: string;
  course: string;
  image?: string | null;
}

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * The success-stories grid + modal. Stories are passed in already server-side
 * rendered (no client fetch, no spinner) — instant paint even on a cold
 * serverless instance.
 */
export function SuccessStoriesBoard({ stories }: { stories: Story[] }) {
  const [active, setActive] = useState<Story | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const close = () => setActive(null);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-site pt-[4.25rem]">
        <div className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
          <header className="text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-4 py-1.5 font-display text-[0.62rem] font-bold uppercase tracking-[0.24em] text-brand-deep">
              <Star className="h-3 w-3" /> Success stories
            </p>
            <h1 className="mt-4 font-display text-[clamp(2rem,5vw,3rem)] font-extrabold tracking-[-0.03em] text-ink">
              Students who <span className="brand-text">made it.</span>
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-[1rem] leading-relaxed text-ink-2">
              Candid words from the people who lived it. Tap any story to read the
              full review.
            </p>
          </header>

          {stories.length === 0 ? (
            <div className="mt-14 grid place-items-center rounded-[2rem] border border-dashed border-ink/15 py-24 text-center">
              <p className="font-display text-5xl font-extrabold text-slate-200">∅</p>
              <p className="mt-4 font-display text-[1.1rem] font-bold text-ink-2">Stories are on their way</p>
              <p className="mt-1 font-mono text-[0.7rem] text-ink-3">Check back after enrolment — success speaks for itself.</p>
            </div>
          ) : (
            <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {stories.map((s, i) => (
                <motion.article
                  key={s.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease, delay: Math.min(0.2, i * 0.05) }}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-ink/[0.07] bg-white shadow-[0_10px_30px_-18px_rgb(15_23_42/0.25)] transition-all duration-300 hover:-translate-y-1.5 hover:border-brand/25 hover:shadow-[0_28px_60px_-28px_rgb(110_90_224/0.4)]"
                >
                  <div aria-hidden className="h-1.5 w-full bg-gradient-to-r from-brand via-brand-magenta to-brand-cyan" />
                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <span className="relative grid h-13 w-13 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-brand/25 to-brand-magenta/25 font-display text-lg font-extrabold text-brand-deep ring-2 ring-white shadow-md h-[3.25rem] w-[3.25rem]">
                        {s.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.image} alt={`${s.name} avatar`} className="h-full w-full object-cover" />
                        ) : (
                          s.name.charAt(0)
                        )}
                        <span aria-hidden className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full border-2 border-white bg-emerald-500 text-white">
                          <BadgeCheck className="h-2.5 w-2.5" />
                        </span>
                      </span>
                      <div className="flex items-center gap-1 text-gold" aria-hidden>
                        {Array.from({ length: 5 }).map((_, s2) => (
                          <span key={s2} className="text-[0.7rem]">★</span>
                        ))}
                      </div>
                    </div>

                    <p className="font-display text-[0.98rem] font-extrabold leading-tight text-ink">{s.name}</p>
                    <p className="mt-0.5 font-display text-[0.58rem] font-bold uppercase tracking-[0.16em] text-brand-deep">
                      {s.course}
                    </p>

                    <blockquote className="mt-4 flex-1 overflow-y-auto pr-1 font-serif text-[0.92rem] italic leading-relaxed text-ink-2" style={{ maxHeight: "8.5rem" }}>
                      “{s.quote}”
                    </blockquote>

                    <div className="mt-5 flex items-center justify-between gap-2 border-t border-ink/[0.06] pt-4">
                      {s.outcome ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-display text-[0.55rem] font-bold uppercase tracking-[0.12em] text-emerald-700">
                          <Sparkles className="h-3 w-3" /> {s.outcome}
                        </span>
                      ) : <span />}
                      <button
                        type="button"
                        onClick={() => setActive(s)}
                        className="inline-flex items-center gap-1 font-display text-[0.68rem] font-bold text-brand-deep transition-colors hover:text-brand"
                      >
                        Read full story <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}

          <div className="mt-14 text-center">
            <Link
              href="/placement-test"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-brand-deep to-brand-magenta px-8 font-display text-[0.85rem] font-bold text-white shadow-[0_16px_40px_-16px_rgb(110_90_224/0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110"
            >
              <Users className="h-4 w-4" /> Be the next success story <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {active ? (
          <motion.div
            className="fixed inset-0 z-[400] flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label={`Full story by ${active.name}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              aria-label="Close story"
              onClick={close}
              className="absolute inset-0 cursor-default bg-ink/50 backdrop-blur-sm"
            />
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 16 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.28, ease }}
              className="relative z-10 max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-[1.75rem] bg-white shadow-[0_60px_140px_-40px_rgb(15_23_42/0.7)]"
            >
              <div aria-hidden className="sticky top-0 z-10 h-1.5 w-full shrink-0 bg-gradient-to-r from-brand via-brand-magenta to-brand-cyan" />
              <div className="p-7">
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close story"
                  className="sticky right-0 top-0 z-10 ml-auto grid h-9 w-9 place-items-center rounded-full border border-ink/10 bg-white text-ink-2 transition-colors hover:bg-ink/5 hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-4">
                  <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-brand/25 to-brand-magenta/25 font-display text-xl font-extrabold text-brand-deep ring-2 ring-white shadow-lg">
                    {active.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={active.image} alt={`${active.name} avatar`} className="h-full w-full object-cover" />
                    ) : (
                      active.name.charAt(0)
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 font-display text-[1.15rem] font-extrabold text-ink">
                      {active.name}
                      <BadgeCheck className="h-4 w-4 text-emerald-500" />
                    </p>
                    <p className="font-display text-[0.62rem] font-bold uppercase tracking-[0.16em] text-brand-deep">
                      {active.course}
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-gold" aria-hidden>
                      {Array.from({ length: 5 }).map((_, s) => (
                        <span key={s} className="text-[0.75rem]">★</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-[#f7f8fc] p-5">
                  <Quote className="h-6 w-6 text-brand/30" aria-hidden />
                  <p className="mt-2 font-serif text-[1.05rem] italic leading-relaxed text-ink-2">
                    “{active.quote}”
                  </p>
                </div>

                {active.outcome ? (
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-display text-[0.62rem] font-bold uppercase tracking-[0.14em] text-emerald-700">
                      <BadgeCheck className="h-3.5 w-3.5" /> {active.outcome}
                    </span>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <Footer />
    </>
  );
}