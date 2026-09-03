"use client";

import { motion } from "framer-motion";
import { ArrowRight, PlayCircle, ShieldCheck, Sparkles, Star, TrendingUp } from "lucide-react";
import { HERO_WORDS } from "@/lib/content";
import { BookDemoButton } from "@/components/contact/BookDemoButton";
import { useLang } from "@/components/LanguageProvider";
import { scrollToId } from "@/lib/lenis";

export function Hero() {
  const { lang, dict } = useLang();
  const isUr = lang === "ur";

  return (
    <section
      id="home"
      data-section
      className="relative overflow-hidden bg-[#f7f8fc]"
      aria-label="Welcome to Language Hub"
    >
      {/* Decorative background mesh */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[38rem] w-[38rem] rounded-full bg-gradient-to-br from-brand/[0.12] to-brand-magenta/[0.1] blur-3xl" />
        <div className="absolute -bottom-48 -right-32 h-[34rem] w-[34rem] rounded-full bg-gradient-to-tr from-gold/[0.15] to-orange-200/[0.1] blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-40 w-40 rounded-full bg-brand-cyan/[0.1] blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgb(99 102 241 / 0.05) 1px, transparent 1px), linear-gradient(90deg, rgb(99 102 241 / 0.05) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
          }}
        />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 pb-24 pt-36 sm:px-8 sm:pt-40 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-28">
        {/* LEFT — copy (always visible, no entrance animation dependency) */}
        <div className="flex max-w-2xl flex-col items-start">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/15 bg-white/80 px-4 py-1.5 text-[0.72rem] font-semibold text-brand-deep shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-gold-deep" />
            {dict["hero.eyebrow"] || "Hub of Language Excellence"}
            <span className="ml-1 rounded-full bg-brand/[0.08] px-2 py-0.5 text-[0.6rem] font-bold text-brand-deep">{dict["hero.badge"]}</span>
          </div>

          <h1 className="mt-6 font-display text-[clamp(2.6rem,5.6vw,4.6rem)] font-extrabold leading-[1.04] tracking-[-0.03em] text-ink" dir={isUr ? "rtl" : "ltr"}>
            {isUr ? (
              <>
                <span className="brand-text">{dict["hero.headline.english"]}</span>{" "}
                {dict["hero.headline.a"]} {dict["hero.headline.b"]}{" "}
                <span className="text-brand-deep">{dict["hero.headline.c"]}</span>
              </>
            ) : (
              <>
                Master{" "}
                <span className="relative inline-block">
                  <span className="brand-text">English</span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none" aria-hidden>
                    <path d="M3 9C50 3 150 3 197 8" stroke="url(#hhero)" strokeWidth="4" strokeLinecap="round" />
                    <defs>
                      <linearGradient id="hhero" x1="0" y1="0" x2="200" y2="0">
                        <stop stopColor="#6366f1" />
                        <stop offset="1" stopColor="#f59e0b" />
                      </linearGradient>
                    </defs>
                  </svg>
                </span>{" "}
                and speak with{" "}
                <span className="text-brand-deep">confidence</span>.
              </>
            )}
          </h1>

          <p className="mt-6 max-w-xl text-[1.08rem] leading-relaxed text-ink-2" dir={isUr ? "rtl" : "ltr"}>
            {dict["hero.subtitle"]}
            <span className="font-semibold text-ink"> Ms. Javeria Malik</span>.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <BookDemoButton variant="solid" />
            <button
              type="button"
              onClick={() => scrollToId("courses")}
              className="group inline-flex h-12 items-center gap-2 rounded-full border border-ink/15 bg-white/80 px-7 font-display text-[0.9rem] font-bold text-ink transition-all duration-300 hover:-translate-y-0.5 hover:border-ink hover:shadow-lg"
            >
              <PlayCircle className="h-5 w-5 text-brand-deep" strokeWidth={1.8} />
              {dict["hero.explore"] || "Explore Courses"}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>

          {/* trust row */}
          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2.5">
                {["H", "A", "B", "F"].map((c, i) => (
                  <span
                    key={i}
                    className="grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-gradient-to-br from-brand to-brand-magenta text-xs font-bold text-white"
                  >
                    {c}
                  </span>
                ))}
              </div>
              <div className="text-[0.78rem]">
                <div className="flex items-center gap-1 text-gold" aria-hidden>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="text-[0.7rem]">★</span>
                  ))}
                </div>
                <p className="font-semibold text-ink-2">{dict["hero.studentsGuided"] || "600+ students guided"}</p>
              </div>
            </div>
            <div className="hidden h-10 w-px bg-ink/10 sm:block" />
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                <ShieldCheck className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <p className="text-[0.85rem] font-semibold text-ink-2">{dict["hero.certified"] || "Certified IELTS · PTE · DET coaching"}</p>
            </div>
          </div>

          {/* course chips */}
          <div className="mt-9 flex flex-wrap items-center gap-2.5">
            {HERO_WORDS.map((course, i) => (
              <span
                key={course}
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 font-display text-[0.7rem] font-bold tracking-wide"
                style={{
                  borderColor: i % 2 === 0 ? "rgb(99 102 241 / 0.25)" : "rgb(245 158 11 / 0.3)",
                  color: i % 2 === 0 ? "rgb(79 70 229)" : "rgb(180 83 9)",
                  backgroundColor: i % 2 === 0 ? "rgb(99 102 241 / 0.04)" : "rgb(245 158 11 / 0.05)",
                }}
              >
                {course}
              </span>
            ))}
          </div>
        </div>

        {/* RIGHT — custom SVG illustration (always visible) */}
        <div className="relative mx-auto w-full max-w-xl">
          <div className="relative">
            {/* main illustration card */}
            <div className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-[0_40px_90px_-40px_rgb(15_23_42/0.4)]">
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(120% 120% at 0% 0%, rgb(99 102 241 / 0.12), transparent 50%), radial-gradient(120% 120% at 100% 100%, rgb(245 158 11 / 0.12), transparent 50%)",
                }}
              />
              <HeroIllustration />
            </div>

            {/* floating mini-cards (content always visible; only float animates) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                animate={{ y: [0, -14, 0], rotate: [0, 0.4, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -left-5 -top-5 flex items-center gap-2 rounded-2xl border border-ink/[0.06] bg-white px-4 py-3 shadow-[0_18px_40px_-20px_rgb(15_23_42/0.4)]"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand/[0.1] text-brand-deep">
                  <TrendingUp className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <div className="text-ink">
                  <p className="font-display text-sm font-extrabold text-ink">Band 8+</p>
                  <p className="text-[0.68rem] font-semibold text-ink-3">{dict["hero.card.ielts.label"] || "IELTS average"}</p>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                animate={{ y: [0, 14, 0], rotate: [0, -0.4, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                className="absolute -bottom-5 -right-3 flex items-center gap-2 rounded-2xl border border-ink/[0.06] bg-white px-4 py-3 shadow-[0_18px_40px_-20px_rgb(15_23_42/0.4)]"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Star className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <div className="text-ink">
                  <p className="font-display text-sm font-extrabold text-ink">+90% fluency</p>
                  <p className="text-[0.68rem] font-semibold text-ink-3">{dict["hero.card.progress.label"] || "learner progress"}</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Custom inline SVG illustration — a learner in a lively English class scene. */
function HeroIllustration() {
  return (
    <svg viewBox="0 0 600 480" className="relative block h-auto w-full" role="img" aria-label="Illustration of a live English lesson">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eef1ff" />
          <stop offset="100%" stopColor="#fff7ed" />
        </linearGradient>
        <linearGradient id="card" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f3f4ff" />
        </linearGradient>
        <linearGradient id="btn" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>

      <rect width="600" height="480" rx="32" fill="url(#sky)" />
      <g opacity="0.5">
        <circle cx="510" cy="90" r="120" fill="#fef3c7" />
        <circle cx="80" cy="420" r="110" fill="#e0e7ff" />
      </g>

      <g>
        <rect x="70" y="70" width="140" height="34" rx="17" fill="white" stroke="#e2e8f0" />
        <path d="M95 96 l-8 14 18 -6 z" fill="white" stroke="#e2e8f0" />
        <circle cx="100" cy="87" r="4" fill="#6366f1" />
        <circle cx="130" cy="87" r="4" fill="#6366f1" opacity="0.5" />
        <circle cx="160" cy="87" r="4" fill="#6366f1" opacity="0.3" />
      </g>
      <g>
        <rect x="400" y="60" width="150" height="34" rx="17" fill="white" stroke="#e2e8f0" />
        <path d="M520 86 l14 14 -20 -2 z" fill="white" stroke="#e2e8f0" />
        <rect x="420" y="75" width="58" height="6" rx="3" fill="#f59e0b" opacity="0.6" />
        <rect x="486" y="75" width="44" height="6" rx="3" fill="#94a3b8" opacity="0.4" />
      </g>

      <g transform="translate(190 230)">
        <rect x="-90" y="-70" width="180" height="120" rx="16" fill="url(#card)" stroke="#e2e8f0" />
        <circle cx="0" cy="-28" r="22" fill="url(#btn)" />
        <path d="M-10 -34 a22 22 0 0 1 20 0" fill="white" opacity="0.35" />
        <text x="0" y="-24" textAnchor="middle" fill="white" fontSize="16" fontWeight="700">J</text>
        <rect x="-56" y="4" width="112" height="11" rx="5.5" fill="#334155" />
        <rect x="-44" y="22" width="88" height="8" rx="4" fill="#94a3b8" opacity="0.6" />
      </g>

      {[
        { dx: 70, dy: 120 },
        { dx: 400, dy: 120 },
        { dx: 80, dy: 320 },
        { dx: 410, dy: 330 },
      ].map((p, i) => (
        <g key={i} transform={`translate(${p.dx} ${p.dy})`}>
          <circle r="22" fill={["#6366f1", "#f59e0b", "#10b981", "#8b5cf6"][i]} opacity="0.18" />
          <circle cx="-6" cy="-6" r="18" fill={["#6366f1", "#f59e0b", "#10b981", "#8b5cf6"][i]} opacity="0.9" />
          <path d="M-12 12 a18 18 0 0 1 12 -18" fill="white" opacity="0.3" />
        </g>
      ))}

      <g transform="translate(320 400)">
        <rect width="120" height="42" rx="12" fill="white" stroke="#e2e8f0" />
        <rect x="14" y="16" width="92" height="8" rx="4" fill="#eef1f9" />
        <rect x="14" y="16" width="66" height="8" rx="4" fill="url(#btn)" />
      </g>

      <g transform="translate(40 300)">
        <circle r="24" fill="white" stroke="#e2e8f0" />
        <path d="M-8 -6 h16 M0 -12 v16" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
      </g>
      <g transform="translate(540 240)">
        <circle r="24" fill="white" stroke="#e2e8f0" />
        <path d="M-6 6 a8 8 0 0 0 12 0 M-12 4 a14 14 0 0 0 24 0" stroke="#f59e0b" strokeWidth="3" fill="none" strokeLinecap="round" />
        <rect x="-2.5" y="-14" width="5" height="10" rx="2.5" fill="#f59e0b" />
      </g>
    </svg>
  );
}
