"use client";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";
import { useLang } from "@/components/LanguageProvider";
import {
  BookOpen,
  MessageSquareHeart,
  Mic,
  PenTool,
  Presentation,
  Rocket,
  Star,
  UserCheck,
} from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

/* ─── Four-step journey ─── */
const STAGES = [
  { icon: BookOpen, accent: "#2563EB", wordKey: "journey.stage1.word", bodyKey: "journey.stage1.body", tag: "Foundation" },
  { icon: Mic, accent: "#0EA5E9", wordKey: "journey.stage2.word", bodyKey: "journey.stage2.body", tag: "Repetition" },
  { icon: PenTool, accent: "#7C3AED", wordKey: "journey.stage3.word", bodyKey: "journey.stage3.body", tag: "Your voice" },
  { icon: Rocket, accent: "#059669", wordKey: "journey.stage4.word", bodyKey: "journey.stage4.body", tag: "Results" },
];

/* ─── Inside every programme ─── */
const EXPERIENCES = [
  {
    icon: Presentation,
    title: "Mock interviews",
    caption: "Real interview practice that calms the nerves before the real thing.",
  },
  {
    icon: Star,
    title: "Sessions with chief guest",
    caption: "Guest mentors and experts share what examiners and employers look for.",
  },
  {
    icon: UserCheck,
    title: "One-on-one sessions",
    caption: "Personal attention so every learner gets the speaking time they need.",
  },
  {
    icon: MessageSquareHeart,
    title: "Constructive feedback",
    caption: "Clear, honest notes on your progress — never vague, always actionable.",
  },
];

export function Journey() {
  const { dict, lang } = useLang();
  const isUr = lang === "ur";

  return (
    <section
      id="journey"
      data-section
      className="relative overflow-hidden bg-site px-6 py-24 sm:px-12"
      aria-label="The learning journey"
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
          subtitle={dict["journey.subtitle"]}
        />

        {/* ─── Journey steps (premium rail) ─── */}
        <div className="relative mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* connecting line */}
          <span
            aria-hidden
            className="absolute left-[12%] right-[12%] top-7 hidden h-0.5 bg-gradient-to-r from-[#2563EB]/25 via-[#7C3AED]/25 to-[#059669]/25 lg:block"
          />

          {STAGES.map((s, i) => {
            const word = dict[s.wordKey];
            const body = dict[s.bodyKey];
            return (
              <Reveal
                key={s.wordKey}
                delay={i * 0.1}
                duration={0.55}
                hover
                className="group relative rounded-3xl border border-ink/[0.07] bg-white p-7 shadow-[0_18px_44px_-34px_rgb(15_23_42/0.4)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_32px_60px_-30px_rgb(37_99_235/0.35)]"
              >
                {/* ghost number */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-2 -top-3 font-display text-[4.2rem] font-black leading-none opacity-[0.06]"
                  style={{ color: s.accent }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                {/* node + tag */}
                <div className="relative flex items-center justify-between">
                  <span
                    className="relative z-10 grid h-12 w-12 place-items-center rounded-full text-white ring-4 ring-white shadow-[0_12px_28px_-12px_rgb(37_99_235/0.55)] transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: s.accent }}
                  >
                    <s.icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <span className="rounded-full border px-2.5 py-1 font-mono text-[0.55rem] font-bold uppercase tracking-[0.2em]"
                    style={{ borderColor: `${s.accent}33`, color: s.accent, backgroundColor: `${s.accent}0d` }}
                  >
                    {s.tag}
                  </span>
                </div>

                <h3 className="mt-6 font-display text-2xl font-extrabold tracking-tight text-ink" dir={isUr ? "rtl" : "ltr"}>
                  {word}.
                </h3>
                <p className="mt-2.5 text-[0.92rem] leading-relaxed text-ink-2">{body}</p>

                {/* bottom accent bar */}
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 rounded-b-3xl transition-transform duration-500 group-hover:scale-x-100"
                  style={{ backgroundColor: s.accent }}
                />
              </Reveal>
            );
          })}
        </div>

        {/* ─── Inside every programme ─── */}
        <Reveal delay={0.1} duration={0.6} className="mt-16">
          <div className="relative overflow-hidden rounded-[2rem] border border-[#2563EB]/15 bg-white p-8 shadow-[0_30px_70px_-40px_rgb(37_99_235/0.35)] sm:p-10">
            {/* ambient blue glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-[50%]"
              style={{ background: "radial-gradient(50% 50% at 50% 50%, rgb(37 99 235 / 0.12), transparent 70%)" }}
            />

            <div className="relative flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="flex items-center gap-3 font-mono text-[0.6rem] font-bold uppercase tracking-[0.3em] text-[#2563EB]">
                  <span aria-hidden className="h-px w-8 bg-[#2563EB]/40" />
                  Inside every programme
                </p>
                <h3 className="mt-3 font-display text-[clamp(1.4rem,2.8vw,2rem)] font-extrabold tracking-[-0.01em] text-ink">
                  Learning that feels <span className="brand-text">personal.</span>
                </h3>
                <p className="mt-2 max-w-xl text-[0.9rem] leading-relaxed text-ink-2">
                  Beyond the classroom, every programme is built around hands-on,
                  human-led experiences so you never practice alone.
                </p>
              </div>
            </div>

            <div className="relative mt-9 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#2563EB]/10 bg-[#2563EB]/10 sm:grid-cols-2 lg:grid-cols-4">
              {EXPERIENCES.map((x, i) => (
                <Reveal
                  key={x.title}
                  delay={i * 0.07}
                  duration={0.5}
                  className="group bg-white p-5 transition-colors duration-300 hover:bg-[#F2F6FF]"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#2563EB]/[0.08] text-[#2563EB] transition-transform duration-300 group-hover:scale-105">
                    <x.icon className="h-5 w-5" strokeWidth={1.9} />
                  </span>
                  <p className="mt-3.5 font-display text-[0.95rem] font-extrabold text-ink">{x.title}</p>
                  <p className="mt-1.5 text-[0.78rem] leading-relaxed text-ink-3">{x.caption}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}