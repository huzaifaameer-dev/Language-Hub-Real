"use client";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";
import {
  MessageCircle,
  Users,
  Lightbulb,
  Rocket,
  Languages,
  CalendarClock,
} from "lucide-react";
import { useLang } from "@/components/LanguageProvider";

const FEATURE_ICONS = [MessageCircle, Users, Lightbulb, Languages, Rocket, CalendarClock];
const FEATURE_TONES = ["#6366f1", "#0ea5e9", "#d63a8c", "#f59e0b", "#10b981", "#8b5cf6"];
const FEATURE_TINTS = [
  "bg-brand/[0.08] text-brand-deep",
  "bg-sky-50 text-sky-600",
  "bg-pink-50 text-pink-600",
  "bg-amber-50 text-amber-600",
  "bg-emerald-50 text-emerald-600",
  "bg-violet-50 text-violet-600",
];

export function Features() {
  const { dict, lang } = useLang();
  const isUr = lang === "ur";

  return (
    <section
      id="why"
      data-section
      className="relative overflow-hidden bg-[#f7f8fc] px-6 py-24 sm:px-12"
      aria-label="Why Language Hub"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          eyebrow={dict["features.eyebrow"]}
          title={
            isUr ? (
              <>{dict["features.title1"]} <span className="brand-text">{dict["features.title2"]}</span></>
            ) : (
              <>
                Why learners <span className="brand-text">choose us.</span>
              </>
            )
          }
          subtitle={dict["features.subtitle"]}
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_ICONS.map((Icon, i) => {
            const title = dict[`features.f${i + 1}.title`];
            const desc = dict[`features.f${i + 1}.desc`];
            const tone = FEATURE_TONES[i];
            const tint = FEATURE_TINTS[i];
            return (
              <Reveal
                key={title}
                delay={(i % 3) * 0.08}
                duration={0.55}
                hover={false}
                className="group relative overflow-hidden rounded-3xl border border-ink/[0.07] bg-[#fafbfe] p-7 transition-all duration-300 hover:border-ink/12 hover:shadow-[0_28px_60px_-30px_rgb(15_23_42/0.3)]"
              >
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r transition-transform duration-500 group-hover:scale-x-100"
                  style={{
                    background: `linear-gradient(90deg, ${tone}, ${tone}88)`,
                  }}
                />
                <span className={`grid h-14 w-14 place-items-center rounded-2xl ${tint}`}>
                  <Icon className="h-7 w-7" strokeWidth={1.6} />
                </span>
                <h3 className="mt-5 font-display text-xl font-extrabold tracking-tight text-ink" dir={isUr ? "rtl" : "ltr"}>
                  {title}
                </h3>
                <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-2">{desc}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
