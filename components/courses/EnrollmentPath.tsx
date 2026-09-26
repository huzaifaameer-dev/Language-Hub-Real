"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarCheck, Rocket } from "lucide-react";
import { useLang } from "@/components/LanguageProvider";

const ease = [0.16, 1, 0.3, 1] as const;

const STEPS = [
  {
    icon: BookOpen,
    title: "Choose your programme",
    desc: "Review our structured learning paths and select the course aligned to your goal — Spoken English, IELTS, PTE or Duolingo DET.",
    tone: "#6366f1",
  },
  {
    icon: CalendarCheck,
    title: "Book a free demo",
    desc: "Experience the Language Hub method first. Join a live session, meet the trainer, and assess the fit before you commit.",
    tone: "#0ea5e9",
  },
  {
    icon: Rocket,
    title: "Start your journey",
    desc: "Enrol in your preferred batch — afternoon, evening or night, Monday through Saturday — and begin structured, trackable progress.",
    tone: "#8b5cf6",
  },
] as const;

/** Compact enrollment pathway — replaces the redundant pricing section with an actionable professional strip. */
export function EnrollmentPath() {
  const { lang } = useLang();
  const isUr = lang === "ur";

  return (
    <section
      id="enroll"
      data-section
      className="relative overflow-hidden bg-white px-6 py-24 sm:px-12"
      aria-label="How to enrol"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.2]"
        style={{
          backgroundImage:
            "radial-gradient(rgb(15 23 42 / 0.04) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative mx-auto max-w-6xl">
        <p className="font-display text-[0.6rem] font-bold uppercase tracking-[0.36em] text-brand-deep">
          {isUr ? "داخلہ کا طریقہ" : "How it works"}
        </p>
        <h2
          className="mt-3 font-display text-[clamp(1.5rem,3.5vw,2.2rem)] font-black leading-[1.15] tracking-tight text-ink"
          dir={isUr ? "rtl" : "ltr"}
        >
          {isUr ? (
            <>شروع کرنے کے <span className="brand-text">تین آسان قدم</span></>
          ) : (
            <>
              Three clear steps to <span className="brand-text">get started.</span>
            </>
          )}
        </h2>
        <p className="mt-4 max-w-2xl text-[0.98rem] leading-relaxed text-ink-2" dir={isUr ? "rtl" : "ltr"}>
          {isUr
            ? "ہم نے داخلے کا عمل سادہ اور شفاف رکھا ہے — آپ ہر مرحلے پر مکمل اعتماد کے ساتھ آگے بڑھیں۔"
            : "We have streamlined the onboarding process so you move forward with full confidence at every stage — no hidden steps, no confusion."}
        </p>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease }}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-ink/[0.06] bg-[#fafbfe] p-7 transition-all duration-300 hover:border-ink/[0.12] hover:shadow-[0_22px_56px_-28px_rgb(15_23_42/0.2)]"
            >
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 bg-gradient-to-r transition-transform duration-500 group-hover:scale-x-100"
                style={{
                  background: `linear-gradient(90deg, ${step.tone}, ${step.tone}88)`,
                }}
              />
              <span className="mb-4 font-mono text-[0.6rem] font-bold text-ink-3">Step {i + 1}</span>
              <span
                className="grid h-14 w-14 place-items-center rounded-2xl"
                style={{
                  background: `${step.tone}12`,
                  color: step.tone,
                }}
              >
                <step.icon className="h-7 w-7" strokeWidth={1.7} />
              </span>
              <h3 className="mt-5 font-display text-[1.1rem] font-black tracking-tight text-ink">
                {step.title}
              </h3>
              <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-2">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/courses"
            className="group inline-flex h-12 items-center gap-2.5 rounded-full bg-ink px-7 font-display text-[0.82rem] font-bold text-ivory transition-all duration-300 hover:bg-brand-deep hover:-translate-y-0.5"
          >
            {isUr ? "کورسز دیکھیں" : "View all courses"}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2.2} />
          </Link>
          <Link
            href="#pricing"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("courses")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex h-12 items-center gap-2 rounded-full border border-ink/15 bg-white px-7 font-display text-[0.82rem] font-bold text-ink transition-all duration-300 hover:border-ink/30 hover:-translate-y-0.5"
          >
            {isUr ? "فیس اور شیڈول" : "Fees & schedule"}
          </Link>
        </div>
      </div>
    </section>
  );
}
