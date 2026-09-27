"use client";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";
import { useLang } from "@/components/LanguageProvider";
import {
  MessageSquareHeart,
  Presentation,
  Star,
  UserCheck,
} from "lucide-react";

/* ─── The four experiences that define every programme ─── */
const FEATURES = [
  {
    icon: Presentation,
    accent: "#2563EB",
    title: "Mock interviews",
    caption: "Real interview practice that calms the nerves before the real thing.",
    tag: "Interview practice",
  },
  {
    icon: Star,
    accent: "#0EA5E9",
    title: "Sessions with chief guest",
    caption: "Guest mentors share exactly what examiners and employers look for.",
    tag: "Guest mentors",
  },
  {
    icon: UserCheck,
    accent: "#7C3AED",
    title: "One-on-one sessions",
    caption: "Dedicated personal time so every learner gets the speaking practice they need.",
    tag: "Personal",
  },
  {
    icon: MessageSquareHeart,
    accent: "#059669",
    title: "Constructive feedback",
    caption: "Clear, honest notes on your progress — never vague, always actionable.",
    tag: "Feedback",
  },
];

export function Journey() {
  const { dict, lang } = useLang();
  const isUr = lang === "ur";

  return (
    <section
      id="journey"
      data-section
      className="relative overflow-hidden bg-site px-6 pt-6 pb-10 sm:px-12 sm:pt-8"
      aria-label="What makes a Language Hub programme"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          eyebrow={dict["journey.eyebrow"]}
          title={
            isUr ? (
              <>{dict["journey.title1"]} <span className="brand-text">{dict["journey.title2"]}</span></>
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

        {/* Feature grid */}
        <div className="relative mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <span
            aria-hidden
            className="absolute left-[12%] right-[12%] top-7 hidden h-0.5 bg-gradient-to-r from-[#2563EB]/25 via-[#7C3AED]/25 to-[#059669]/25 lg:block"
          />

          {FEATURES.map((f, i) => (
            <Reveal
              key={f.title}
              delay={i * 0.1}
              duration={0.55}
              hover
              className="group relative rounded-3xl border border-ink/[0.07] bg-white p-7 shadow-[0_18px_44px_-34px_rgb(15_23_42/0.4)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_32px_60px_-30px_rgb(37_99_235/0.35)]"
            >
              {/* ghost number */}
              <span
                aria-hidden
                className="pointer-events-none absolute -right-2 -top-3 font-display text-[4.2rem] font-black leading-none opacity-[0.06]"
                style={{ color: f.accent }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              {/* node + tag */}
              <div className="relative flex items-center justify-between">
                <span
                  className="relative z-10 grid h-12 w-12 place-items-center rounded-full text-white ring-4 ring-white shadow-[0_12px_28px_-12px_rgb(37_99_235/0.55)] transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: f.accent }}
                >
                  <f.icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <span
                  className="rounded-full border px-2.5 py-1 font-mono text-[0.55rem] font-bold uppercase tracking-[0.2em]"
                  style={{ borderColor: `${f.accent}33`, color: f.accent, backgroundColor: `${f.accent}0d` }}
                >
                  {f.tag}
                </span>
              </div>

              <h3 className="mt-6 font-display text-[1.3rem] font-extrabold tracking-tight text-ink" dir={isUr ? "rtl" : "ltr"}>
                {f.title}
              </h3>
              <p className="mt-2.5 text-[0.92rem] leading-relaxed text-ink-2">{f.caption}</p>

              {/* bottom accent bar */}
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 rounded-b-3xl transition-transform duration-500 group-hover:scale-x-100"
                style={{ backgroundColor: f.accent }}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}