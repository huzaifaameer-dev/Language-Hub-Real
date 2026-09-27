"use client";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";
import {
  CalendarClock,
  Lightbulb,
  MessageCircle,
  Rocket,
  Users,
  Languages,
} from "lucide-react";
import { useLang } from "@/components/LanguageProvider";

const FEATURES = [
  {
    icon: MessageCircle,
    tint: "bg-indigo-50 text-indigo-600",
    bar: "#6366F1",
  },
  {
    icon: Users,
    tint: "bg-sky-50 text-sky-600",
    bar: "#0EA5E9",
  },
  {
    icon: Lightbulb,
    tint: "bg-pink-50 text-pink-600",
    bar: "#D946EF",
  },
  {
    icon: Languages,
    tint: "bg-amber-50 text-amber-600",
    bar: "#F59E0B",
  },
  {
    icon: Rocket,
    tint: "bg-emerald-50 text-emerald-600",
    bar: "#10B981",
  },
  {
    icon: CalendarClock,
    tint: "bg-violet-50 text-violet-600",
    bar: "#8B5CF6",
  },
] as const;

export function Features() {
  const { dict, lang } = useLang();
  const isUr = lang === "ur";

  return (
    <section
      id="why"
      data-section
      className="relative overflow-hidden bg-site px-6 pt-10 pb-16 sm:px-12"
      aria-label="Why Language Hub"
    >
      {/* ambient accents */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-0 h-64 w-[42rem] -translate-x-1/2"
          style={{ background: "radial-gradient(50% 100% at 50% 0%, rgb(99 102 241 / 0.08), transparent 70%)" }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <SectionHeader
          eyebrow={dict["features.eyebrow"]}
          title={
            isUr ? (
              <>{dict["features.title1"]} <span className="brand-text">{dict["features.title2"]}</span></>
            ) : (
              <>
                Why learners choose <span className="brand-text">Language Hub.</span>
              </>
            )
          }
          subtitle={dict["features.subtitle"]}
        />

        {/* Benefit grid — scannable, professional rows */}
        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {FEATURES.map((f, i) => {
            const title = dict[`features.f${i + 1}.title`];
            const desc = dict[`features.f${i + 1}.desc`];
            const num = String(i + 1).padStart(2, "0");
            return (
              <Reveal
                key={title}
                delay={(i % 2) * 0.08}
                duration={0.55}
                className="group relative overflow-hidden rounded-2xl border border-ink/[0.07] bg-white p-6 shadow-[0_16px_40px_-36px_rgb(15_23_42/0.4)] transition-all duration-300 hover:-translate-y-1 hover:border-ink/[0.12] hover:shadow-[0_30px_60px_-32px_rgb(15_23_42/0.4)]"
              >
                {/* accent hairline */}
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-1 origin-top scale-y-0 bg-gradient-to-b transition-transform duration-500 group-hover:scale-y-100"
                  style={{ background: `linear-gradient(180deg, ${f.bar}, ${f.bar}88)` }}
                />
                {/* ghost number */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-1 -top-2 font-display text-[2.6rem] font-black leading-none opacity-[0.06]"
                  style={{ color: f.bar }}
                >
                  {num}
                </span>

                <div className="flex items-start gap-4">
                  {/* icon */}
                  <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${f.tint} ring-1 ring-inset transition-transform duration-300 group-hover:scale-105`}>
                    <f.icon className="h-6 w-6" strokeWidth={1.7} />
                  </span>

                  {/* title + desc */}
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-[0.55rem] font-bold tracking-[0.2em] text-ink-3">{num}</span>
                      <span aria-hidden className="h-px w-6" style={{ backgroundColor: `${f.bar}55` }} />
                    </span>
                    <h3
                      className="mt-1.5 font-display text-[1.02rem] font-extrabold leading-snug tracking-tight text-ink"
                      dir={isUr ? "rtl" : "ltr"}
                    >
                      {title}
                    </h3>
                    <p className="mt-2 text-[0.86rem] leading-relaxed text-ink-2">{desc}</p>
                  </span>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* CTA footer — professional blue line */}
        <Reveal delay={0.1} duration={0.6} className="mt-12 flex items-center justify-center gap-4">
          <span aria-hidden className="h-px w-14 bg-[#2563EB]/30 sm:w-20" />
          <p className="text-center font-display text-[0.86rem] font-bold tracking-wide text-[#2563EB]">
            One method. Every programme. Real results — the Language Hub difference.
          </p>
          <span aria-hidden className="h-px w-14 bg-[#2563EB]/30 sm:w-20" />
        </Reveal>
      </div>
    </section>
  );
}