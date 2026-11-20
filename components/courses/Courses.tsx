"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  Check,
  GraduationCap,
  Languages,
  Laptop,
  MessageCircle,
  Sparkles,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import { COURSE_CARDS } from "@/lib/content";
import { courseSlug } from "@/lib/course-data";
import { registrationKeyForCatalogName } from "@/lib/registration-config";
import { ApplyButton } from "@/components/courses/ApplyButton";
import { useLang } from "@/components/LanguageProvider";
import { useReducedMotionSafe } from "@/lib/hooks";
import { EASE_EXPO } from "@/lib/motion";
import { cn } from "@/lib/utils";

const COURSE_ICONS: Record<string, LucideIcon> = {
  "Spoken English": MessageCircle,
  "IELTS Preparation": GraduationCap,
  "PTE Preparation": Laptop,
  "Duolingo English Test": Languages,
  "IELTS General & Academic": GraduationCap,
  "PTE · GRE · Duolingo": Languages,
  "Writing & Communication": BookOpen,
};

const FEATURES: Record<string, string[]> = {
  "Spoken English": ["Live conversation labs", "Pronunciation coaching", "Small-batch speaking time"],
  "IELTS Preparation": ["Weekly full mocks", "Examiner-style feedback", "Band-score tracking"],
  "IELTS General & Academic": ["Weekly full mocks", "Examiner-style feedback", "Band-score tracking"],
  "PTE Preparation": ["AI-scored practice", "Timed task mastery", "Score-boost templates"],
  "PTE · GRE · Duolingo": ["AI-scored practice", "Timed task mastery", "Score-boost templates"],
  "Duolingo English Test": ["Question-family strategy", "Adaptive mock tests", "Fast-track score plan"],
  "Writing & Communication": ["Structured writing labs", "Email & report templates", "One-to-one editing"],
};

const DEFAULT_FEATURES = ["Live small-batch classes", "Weekly feedback", "Personal progress plan"];

/** Cover gradients — every one stays dark enough for white type. */
const COVERS = [
  "linear-gradient(138deg, #13806e 0%, #0f6b5c 42%, #073b33 100%)",
  "linear-gradient(138deg, #fb6a47 0%, #d0452a 52%, #9c2f18 100%)",
  "linear-gradient(138deg, #d99a1a 0%, #a86b00 55%, #7a4c00 100%)",
  "linear-gradient(138deg, #0f8f7c 0%, #0b7f70 50%, #064d44 100%)",
] as const;

const CLAY = ["clay", "clay clay-coral", "clay clay-amber", "clay clay-mint"] as const;
const ICON_INK = ["#0f6b5c", "#d0452a", "#8a5a00", "#0a4e43"] as const;

const gridVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE_EXPO } },
};

/**
 * Programme cards, 2026 edition: a saturated editorial "cover" carries the
 * icon, programme number and promise, while a quiet white body holds the
 * practical detail and the fee. Equal 2 × 2 tiles, one hover language.
 */
export function Courses() {
  const { dict } = useLang();
  const reduce = useReducedMotionSafe();

  return (
    <section
      id="courses"
      data-section
      aria-label="Programmes"
      className="relative overflow-hidden border-y border-[#edf5f2] bg-[#f9fdfc] px-5 pb-20 pt-16 sm:px-8 sm:pb-24 sm:pt-[4.5rem]"
    >
      <span aria-hidden className="pointer-events-none absolute -left-32 top-28 h-[24rem] w-[24rem] rounded-full bg-[#14a08c]/10 blur-[120px]" />
      <span aria-hidden className="pointer-events-none absolute -right-28 bottom-10 h-[22rem] w-[22rem] rounded-full bg-[#f5b93c]/10 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl">
        {/* header */}
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <motion.span
              initial={reduce ? false : { opacity: 0, y: 10 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8% 0px" }}
              transition={{ duration: 0.55, ease: EASE_EXPO }}
              className="eyebrow-ref"
            >
              {dict["courses.eyebrow"] ?? "Our programmes"}
            </motion.span>

            <motion.h2
              initial={reduce ? false : { opacity: 0, y: 20, filter: "blur(6px)" }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-8% 0px" }}
              transition={{ duration: 0.8, delay: 0.06, ease: EASE_EXPO }}
              className="section-title-ref mt-4"
            >
              Find the course that{" "}
              <span className="relative inline-block text-[#0f6b5c]">
                fits your goal.
                <svg aria-hidden viewBox="0 0 240 12" fill="none" className="absolute -bottom-1 left-0 h-2 w-full" preserveAspectRatio="none">
                  <path d="M2 8.5C58 4.5 160 4 238 7" stroke="#fb6a47" strokeWidth="2.6" strokeLinecap="round" opacity="0.65" />
                </svg>
              </span>
            </motion.h2>

            <motion.p
              initial={reduce ? false : { opacity: 0, y: 14 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8% 0px" }}
              transition={{ duration: 0.65, delay: 0.14, ease: EASE_EXPO }}
              className="mt-5 max-w-xl font-sans text-[0.98rem] leading-[1.8] text-ink-2"
            >
              {dict["courses.subtitle"] ??
                "Four focused paths, live small-batch teaching and a clear outcome at the end of each one — with a teacher who knows your name."}
            </motion.p>
          </div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: EASE_EXPO }}
            className="flex flex-col gap-2.5 lg:mb-1"
          >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-line bg-white px-4 py-3 shadow-[0_18px_36px_-32px_rgba(10,78,67,0.5)]">
              <span className="flex items-center gap-2 font-sans text-[0.74rem] font-medium text-ink-2">
                <CalendarDays className="h-4 w-4 text-[#0f6b5c]" strokeWidth={2} /> Monthly intakes
              </span>
              <span className="hidden h-4 w-px bg-line sm:block" />
              <span className="flex items-center gap-2 font-sans text-[0.74rem] font-medium text-ink-2">
                <Users className="h-4 w-4 text-[#0f6b5c]" strokeWidth={2} /> Max 12 per batch
              </span>
            </div>
            <Link
              href="/courses"
              className="group inline-flex items-center gap-1.5 self-start font-display text-[0.74rem] font-semibold text-[#0f6b5c] transition-colors hover:text-[#0a4e43] lg:self-end"
            >
              Compare all programmes
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={2.2} />
            </Link>
          </motion.div>
        </div>

        {/* 2 × 2 programme covers */}
        <motion.div
          variants={gridVariants}
          initial={reduce ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6"
        >
          {COURSE_CARDS.map((card, i) => {
            const Icon = COURSE_ICONS[card.info.name] ?? BookOpen;
            const features = FEATURES[card.info.name] ?? DEFAULT_FEATURES;
            const cover = COVERS[i % COVERS.length];
            const clay = CLAY[i % CLAY.length];
            const iconInk = ICON_INK[i % ICON_INK.length];

            return (
              <motion.div key={card.info.name} variants={cardVariants} className="h-full">
                <article className="surface-card group relative flex h-full flex-col overflow-hidden">
                  <span aria-hidden className="card-sheen" />

                  {/* ── cover ── */}
                  <div className="relative overflow-hidden px-6 pb-7 pt-6 sm:px-7">
                    <span
                      aria-hidden
                      className="absolute inset-0 transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.035]"
                      style={{ background: cover }}
                    />
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 opacity-60"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(135deg, rgba(255,255,255,0.055) 0 1px, transparent 1px 22px)",
                      }}
                    />
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -right-3 -top-10 select-none font-display text-[8.5rem] font-black leading-none tracking-[-0.06em] text-white/[0.07] transition-transform duration-700 group-hover:-translate-y-1 group-hover:translate-x-1"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    <div className="relative flex items-start justify-between gap-3">
                      <span className={cn(clay, "card-icon h-12 w-12 shrink-0 rounded-2xl")}>
                        <Icon
                          className="relative z-10 h-5 w-5"
                          strokeWidth={1.9}
                          style={{ color: iconInk }}
                        />
                      </span>

                      {i === 0 ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ffd57e] px-2.5 py-1 font-display text-[0.54rem] font-bold uppercase tracking-[0.12em] text-[#8a5a00] shadow-[0_10px_22px_-12px_rgba(0,0,0,0.55)]">
                          <Sparkles className="h-3 w-3" strokeWidth={2.2} /> Most popular
                        </span>
                      ) : i === 2 ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/12 px-2.5 py-1 font-display text-[0.54rem] font-bold uppercase tracking-[0.12em] text-white/85 backdrop-blur-sm">
                          <BadgeCheck className="h-3 w-3" strokeWidth={2.2} /> Exam path
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 font-display text-[0.54rem] font-bold uppercase tracking-[0.12em] text-white/75">
                          <CalendarDays className="h-3 w-3" strokeWidth={2.2} /> {card.info.duration}
                        </span>
                      )}
                    </div>

                    <p className="relative mt-6 font-display text-[0.55rem] font-bold uppercase tracking-[0.22em] text-white/60">
                      Programme {String(i + 1).padStart(2, "0")}
                      <span className="mx-1.5 text-white/30">·</span>
                      {card.info.duration}
                    </p>
                    <h3 className="relative mt-1.5 font-display text-[1.55rem] font-extrabold leading-[1.08] tracking-[-0.03em] text-white sm:text-[1.72rem]">
                      {card.info.name}
                    </h3>
                    <p className="relative mt-1.5 max-w-md font-sans text-[0.86rem] leading-relaxed text-white/75">
                      {card.info.tagline}
                    </p>
                  </div>

                  {/* ── body ── */}
                  <div className="relative flex flex-1 flex-col p-6 sm:p-7">
                    <ul className="flex flex-col gap-2.5">
                      {features.map((f) => (
                        <li
                          key={f}
                          className="flex items-start gap-2.5 font-sans text-[0.82rem] leading-snug text-ink-2"
                        >
                          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#eaf7f3]">
                            <Check className="h-3 w-3 text-[#0f6b5c]" strokeWidth={3} />
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-sans text-[0.74rem] text-ink-3">
                      <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-[#0f6b5c]" strokeWidth={2} />
                        {card.info.teacher}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-[#0f6b5c]" strokeWidth={2} />
                        {card.info.schedule}
                      </span>
                    </div>

                    <div className="mt-auto pt-5">
                      <div className="flex flex-wrap items-end justify-between gap-3 border-t border-[#eef5f2] pt-4">
                        <div>
                          <p className="font-display text-[0.54rem] font-bold uppercase tracking-[0.2em] text-ink-3">
                            Monthly fee
                          </p>
                          <p className="mt-1 font-display text-[1.4rem] font-extrabold leading-none tracking-[-0.02em] text-ink">
                            {card.feeLabel}
                            <span className="font-sans text-[0.66rem] font-semibold text-ink-3"> /mo</span>
                          </p>
                        </div>

                        <ApplyButton
                          courseKey={registrationKeyForCatalogName(card.info.name)}
                          className="group/apply inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#0f6b5c] px-5 font-display text-[0.7rem] font-bold uppercase tracking-[0.12em] text-white shadow-[0_14px_28px_-14px_rgba(15,107,92,0.9)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0a4e43] active:translate-y-0"
                        >
                          {dict["courses.apply"] ?? "Enrol now"}
                          <ArrowRight
                            className="h-3.5 w-3.5 transition-transform duration-300 group-hover/apply:translate-x-0.5"
                            strokeWidth={2.4}
                          />
                        </ApplyButton>
                      </div>

                      <Link
                        href={`/courses/${courseSlug(card.info.name)}`}
                        className="group/details mt-3 inline-flex items-center gap-1.5 font-display text-[0.7rem] font-semibold text-ink-3 transition-colors hover:text-[#0f6b5c]"
                      >
                        <BookOpen className="h-3.5 w-3.5" strokeWidth={2} />
                        {dict["courses.details"] ?? "Course details"}
                        <ArrowUpRight
                          className="h-3 w-3 transition-transform duration-300 group-hover/details:-translate-y-0.5 group-hover/details:translate-x-0.5"
                          strokeWidth={2.2}
                        />
                      </Link>
                    </div>
                  </div>
                </article>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, delay: 0.15, ease: EASE_EXPO }}
          className="mt-10 flex flex-col items-center gap-3"
        >
          <Link href="/courses" className="btn-teal group relative h-12 overflow-hidden px-7 text-[0.84rem]">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 -left-full w-2/3 -skew-x-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)] transition-transform duration-[900ms] ease-out group-hover:translate-x-[450%]"
            />
            <span className="relative">{dict["courses.viewAll"] ?? "View the full catalogue"}</span>
            <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={2.2} />
          </Link>
          <p className="font-sans text-[0.68rem] font-medium uppercase tracking-[0.18em] text-ink-3">
            Fees in PKR · Payment plans available
          </p>
        </motion.div>
      </div>
    </section>
  );
}
