"use client";

import { motion } from "framer-motion";
import { BookOpen, CalendarCheck, MessageCircle, Rocket } from "lucide-react";
import { useLang } from "@/components/LanguageProvider";
import { whatsappLink } from "@/lib/content";

const ease = [0.16, 1, 0.3, 1] as const;

const STEPS = [
  {
    icon: BookOpen,
    title: "Choose your programme",
    desc: "Review our structured learning paths and select the course aligned to your goal — Spoken English, IELTS, PTE or Duolingo DET.",
    tone: "#1D4ED8",
    tint: "rgba(29,78,216,0.08)",
  },
  {
    icon: CalendarCheck,
    title: "Book a free demo",
    desc: "Experience the Language Hub method first. Join a live session, meet the trainer, and assess the fit before you commit.",
    tone: "#2563EB",
    tint: "rgba(37,99,235,0.08)",
  },
  {
    icon: Rocket,
    title: "Start your journey",
    desc: "Enrol in your preferred batch — afternoon, evening or night, Monday through Saturday — and begin structured, trackable progress.",
    tone: "#38BDF8",
    tint: "rgba(56,189,248,0.10)",
  },
] as const;

/** Compact enrollment pathway — three clear steps, professional blue theme. */
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
          backgroundImage: "radial-gradient(rgb(37 99 235 / 0.10) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative mx-auto max-w-6xl">
        <p className="font-display text-[0.6rem] font-bold uppercase tracking-[0.36em] text-[#2563EB]">
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
              Three clear steps to{" "}
              <span
                style={{
                  backgroundImage: "linear-gradient(100deg,#1D4ED8,#2563EB,#38BDF8)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                get started.
              </span>
            </>
          )}
        </h2>
        <p className="mt-4 max-w-2xl text-[0.98rem] leading-relaxed text-ink-2" dir={isUr ? "rtl" : "ltr"}>
          {isUr
            ? "ہم نے داخلے کا عمل سادہ اور شفاف رکھا ہے — آپ ہر مرحلے پر مکمل اعتماد کے ساتھ آگے بڑھیں۔"
            : "We have streamlined the onboarding process so you move forward with full confidence at every stage — no hidden steps, no confusion."}
        </p>

        {/* Steps */}
        <div className="relative mt-14 grid gap-6 sm:grid-cols-1 lg:grid-cols-3">
          {/* connector line */}
          <span
            aria-hidden
            className="absolute left-[18%] right-[18%] top-[4.6rem] hidden border-t-2 border-dashed border-[#2563EB]/15 lg:block"
          />

          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease }}
              className="group relative flex flex-col items-center overflow-hidden rounded-3xl border border-ink/[0.06] bg-[#fafbfe] p-7 text-center transition-all duration-300 hover:-translate-y-1 hover:border-ink/[0.12] hover:shadow-[0_24px_60px_-30px_rgb(37_99_235/0.45)]"
            >
              {/* ghost number */}
              <span
                aria-hidden
                className="pointer-events-none absolute -right-1 -top-3 font-display text-[4rem] font-black leading-none opacity-[0.05]"
                style={{ color: step.tone }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 bg-gradient-to-r transition-transform duration-500 group-hover:scale-x-100"
                style={{ background: `linear-gradient(90deg, ${step.tone}, ${step.tone}88)` }}
              />

              <span className="rounded-full border px-3 py-1 font-mono text-[0.55rem] font-bold uppercase tracking-[0.22em]"
                style={{ borderColor: `${step.tone}40`, color: step.tone, backgroundColor: step.tint }}
              >
                Step {String(i + 1).padStart(2, "0")}
              </span>

              <span
                className="mt-5 grid h-16 w-16 place-items-center rounded-2xl text-white shadow-[0_16px_32px_-16px_rgb(37_99_235/0.7)] transition-transform duration-500 group-hover:-rotate-3 group-hover:scale-110"
                style={{
                  background: `linear-gradient(145deg, ${step.tone}, ${step.tone}b3)`,
                }}
              >
                <step.icon className="h-7 w-7" strokeWidth={1.7} />
              </span>

              <h3 className="mt-5 font-display text-[1.1rem] font-black tracking-tight text-ink" dir={isUr ? "rtl" : "ltr"}>
                {step.title}
              </h3>
              <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-2" dir={isUr ? "rtl" : "ltr"}>
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Assurance line — replaces the two repetitive buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.55, ease, delay: 0.2 }}
          className="mt-12 flex items-center justify-center gap-3"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <MessageCircle className="h-4 w-4" strokeWidth={2.1} />
          </span>
          <p className="text-center font-display text-[0.9rem] font-semibold leading-relaxed text-ink-2" dir={isUr ? "rtl" : "ltr"}>
            {isUr
              ? "پہلے بات کرنا چاہتے ہیں؟ واٹس ایپ پر پیغام بھیجیں — ہماری ٹیم منٹوں میں جواب دیتی ہے۔"
              : "Prefer to talk first? "}
            {isUr ? null : (
              <a
                href={whatsappLink("Assalam o alaikum! I'd like to ask about enrolment at Language Hub.")}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-emerald-600 underline decoration-emerald-300 underline-offset-4 transition-colors hover:text-emerald-700"
              >
                Message us on WhatsApp
              </a>
            )}
            {isUr ? null : <span className="text-ink-3">— our team replies within minutes.</span>}
          </p>
        </motion.div>
      </div>
    </section>
  );
}