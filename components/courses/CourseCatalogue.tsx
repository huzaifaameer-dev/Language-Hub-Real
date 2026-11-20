"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  Check,
  Clock,
  GraduationCap,
  Languages,
  Laptop,
  MessageCircle,
  Sparkles,
  User,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { courseSlug, formatPKR, type CourseInfo } from "@/lib/course-data";
import { registrationKeyForCatalogName } from "@/lib/registration-config";
import { ApplyButton } from "@/components/courses/ApplyButton";
import { useReducedMotionSafe } from "@/lib/hooks";
import { EASE_EXPO } from "@/lib/motion";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  "Spoken English": MessageCircle,
  "IELTS Preparation": GraduationCap,
  "PTE Preparation": Laptop,
  "Duolingo English Test": Languages,
  "IELTS General & Academic": GraduationCap,
  "PTE · GRE · Duolingo": Languages,
  "Writing & Communication": BookOpen,
};

const COVERS = [
  "linear-gradient(138deg,#13806e 0%,#0f6b5c 42%,#073b33 100%)",
  "linear-gradient(138deg,#fb6a47 0%,#d0452a 52%,#9c2f18 100%)",
  "linear-gradient(138deg,#d99a1a 0%,#a86b00 55%,#7a4c00 100%)",
  "linear-gradient(138deg,#0f8f7c 0%,#0b7f70 50%,#064d44 100%)",
] as const;

const CLAY = ["clay", "clay clay-coral", "clay clay-amber", "clay clay-mint"] as const;
const ICON_INK = ["#0f6b5c", "#d0452a", "#8a5a00", "#0a4e43"] as const;

type FilterKey = "all" | "speaking" | "exam" | "writing";

const FILTERS: Array<{ key: FilterKey; label: string; note: string }> = [
  { key: "all", label: "All programmes", note: "The full catalogue" },
  { key: "speaking", label: "Spoken English", note: "Fluency & confidence" },
  { key: "exam", label: "Exam prep", note: "IELTS · PTE · Duolingo" },
  { key: "writing", label: "Writing", note: "Academic & professional" },
];

function groupOf(name: string): FilterKey {
  if (/ielts|pte|duolingo|gre/i.test(name)) return "exam";
  if (/writing|communication/i.test(name)) return "writing";
  if (/spoken|english/i.test(name)) return "speaking";
  return "exam";
}

function featuresOf(course: CourseInfo): string[] {
  const outcomes = course.outcomes ?? [];
  if (outcomes.length >= 3) return outcomes.slice(0, 3);
  const fallback = [
    "Live small-batch classes",
    "Weekly feedback",
    "Personal progress plan",
  ];
  return [...outcomes, ...fallback].slice(0, 3);
}

function ProgrammeCard({
  course,
  index,
  reduce,
}: {
  course: CourseInfo;
  index: number;
  reduce: boolean;
}) {
  const Icon = ICONS[course.name] ?? BookOpen;
  const cover = COVERS[index % COVERS.length];
  const clay = CLAY[index % CLAY.length];
  const iconInk = ICON_INK[index % ICON_INK.length];
  const features = featuresOf(course);
  const modules = course.modules ?? [];
  const batches = course.batches ?? [];
  const seatsLeft =
    typeof course.seatsLeft === "number"
      ? course.seatsLeft
      : batches.reduce((sum, b) => sum + (b.seatsLeft ?? 0), 0);
  const hasLiveSeats = seatsLeft > 0;

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 26 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: Math.min(index, 4) * 0.07, ease: EASE_EXPO }}
      className="surface-card group relative flex h-full flex-col overflow-hidden"
    >
      <span aria-hidden className="card-sheen" />

      {/* cover */}
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
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="relative flex items-start justify-between gap-3">
          <span className={cn(clay, "card-icon h-12 w-12 shrink-0 rounded-2xl")}>
            <Icon className="relative z-10 h-5 w-5" strokeWidth={1.9} style={{ color: iconInk }} />
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/12 px-2.5 py-1 font-display text-[0.54rem] font-bold uppercase tracking-[0.12em] text-white/85 backdrop-blur-sm">
            <Clock className="h-3 w-3" strokeWidth={2.2} /> {course.duration || "Flexible"}
          </span>
        </div>

        <p className="relative mt-6 font-display text-[0.55rem] font-bold uppercase tracking-[0.22em] text-white/60">
          Programme {String(index + 1).padStart(2, "0")}
        </p>
        <h2 className="relative mt-1.5 font-display text-[1.5rem] font-extrabold leading-[1.1] tracking-[-0.03em] text-white sm:text-[1.66rem]">
          {course.name}
        </h2>
        <p className="relative mt-1.5 line-clamp-2 max-w-md font-sans text-[0.86rem] leading-relaxed text-white/75">
          {course.tagline || course.description}
        </p>
      </div>

      {/* body */}
      <div className="relative flex flex-1 flex-col p-6 sm:p-7">
        <ul className="flex flex-col gap-2.5">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 font-sans text-[0.82rem] leading-snug text-ink-2">
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
            {course.teacher}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-[#0f6b5c]" strokeWidth={2} />
            {course.schedule || "Monthly intakes"}
          </span>
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-[#0f6b5c]" strokeWidth={2} />
            {modules.length} modules
          </span>
        </div>

        <div className="mt-auto pt-5">
          <div className="flex flex-wrap items-end justify-between gap-3 border-t border-[#eef5f2] pt-4">
            <div>
              <p className="font-display text-[0.54rem] font-bold uppercase tracking-[0.2em] text-ink-3">
                Monthly fee
              </p>
              <p className="mt-1 font-display text-[1.4rem] font-extrabold leading-none tracking-[-0.02em] text-ink">
                {formatPKR(course.fee)}
                <span className="font-sans text-[0.66rem] font-semibold text-ink-3"> /mo</span>
              </p>
            </div>

            <ApplyButton
              courseKey={registrationKeyForCatalogName(course.name)}
              className="group/apply inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#0f6b5c] px-5 font-display text-[0.7rem] font-bold uppercase tracking-[0.12em] text-white shadow-[0_14px_28px_-14px_rgba(15,107,92,0.9)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0a4e43] active:translate-y-0"
            >
              Enrol now
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover/apply:translate-x-0.5"
                strokeWidth={2.4}
              />
            </ApplyButton>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link
              href={`/courses/${courseSlug(course.name)}`}
              className="group/details inline-flex items-center gap-1.5 font-display text-[0.7rem] font-semibold text-ink-3 transition-colors hover:text-[#0f6b5c]"
            >
              <BookOpen className="h-3.5 w-3.5" strokeWidth={2} />
              Course details
              <ArrowUpRight
                className="h-3 w-3 transition-transform duration-300 group-hover/details:-translate-y-0.5 group-hover/details:translate-x-0.5"
                strokeWidth={2.2}
              />
            </Link>

            <span
              className={cn(
                "ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-sans text-[0.62rem] font-semibold",
                hasLiveSeats ? "bg-[#eaf7f3] text-[#0a4e43]" : "bg-[#fdeee8] text-[#c0432a]"
              )}
            >
              <BadgeCheck className="h-3 w-3" strokeWidth={2.4} />
              {hasLiveSeats ? `${seatsLeft} seats left` : "Next batch forming"}
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export function CourseCatalogue({ courses }: { courses: CourseInfo[] }) {
  const reduce = useReducedMotionSafe();
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = useMemo(
    () => (filter === "all" ? courses : courses.filter((c) => groupOf(c.name) === filter)),
    [courses, filter]
  );

  return (
    <div>
      {/* filter bar */}
      <div className="flex flex-col gap-4 rounded-[1.4rem] border border-[#e3ede9] bg-white/80 p-3 shadow-[0_20px_44px_-40px_rgba(6,46,40,0.45)] backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:pb-0">
          {FILTERS.map((f) => {
            const count =
              f.key === "all" ? courses.length : courses.filter((c) => groupOf(c.name) === f.key).length;
            if (f.key !== "all" && count === 0) return null;
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 font-display text-[0.74rem] font-semibold transition-all duration-300",
                  active
                    ? "bg-[#0f6b5c] text-white shadow-[0_12px_24px_-16px_rgba(10,78,67,0.9)]"
                    : "border border-[#e3ede9] bg-white text-[#44615a] hover:border-[#cfe3da] hover:text-[#0f6b5c]"
                )}
              >
                {f.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-px text-[0.6rem] font-bold",
                    active ? "bg-white/20" : "bg-[#f1f8f4] text-[#0d6a58]"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <p className="flex shrink-0 items-center gap-1.5 px-2 font-sans text-[0.72rem] font-medium text-ink-3">
          <Wallet className="h-3.5 w-3.5 text-[#0f6b5c]" strokeWidth={2} />
          One clear fee · no hidden charges
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10 rounded-[1.6rem] border border-dashed border-[#cfe3da] bg-white/70 px-6 py-16 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#eaf7f3] text-[#0f6b5c]">
            <Sparkles className="h-6 w-6" strokeWidth={1.9} />
          </span>
          <p className="mt-4 font-display text-[1.05rem] font-extrabold text-ink">
            No programmes in this path yet
          </p>
          <p className="mx-auto mt-1 max-w-sm font-sans text-[0.85rem] text-ink-3">
            Choose another path — or see the full catalogue.
          </p>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#0f6b5c] px-5 py-2.5 font-display text-[0.78rem] font-bold text-white transition hover:bg-[#0a4e43]"
          >
            Show everything <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
          {filtered.map((c, i) => (
            <ProgrammeCard key={c.name} course={c} index={i} reduce={reduce} />
          ))}
        </div>
      )}

      {/* compare table */}
      <div className="mt-14 overflow-hidden rounded-[1.6rem] border border-[#e3ede9] bg-white shadow-[0_26px_60px_-46px_rgba(6,46,40,0.5)]">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#eef5f2] px-5 py-5 sm:px-7">
          <div>
            <p className="font-display text-[0.58rem] font-bold uppercase tracking-[0.28em] text-[#0f6b5c]">
              Side by side
            </p>
            <h3 className="mt-2 font-display text-[1.24rem] font-extrabold tracking-[-0.02em] text-ink">
              Compare every programme
            </h3>
          </div>
          <p className="flex items-center gap-1.5 font-sans text-[0.72rem] text-ink-3">
            <Users className="h-3.5 w-3.5 text-[#0f6b5c]" strokeWidth={2} />
            Small batches · max 12 learners
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[42rem]">
            <thead>
              <tr className="border-b border-[#eef5f2] bg-[#fbfefd]">
                {["Programme", "Duration", "Schedule", "Monthly fee", ""].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-5 py-3 text-left font-display text-[0.56rem] font-bold uppercase tracking-[0.16em] text-ink-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2f7f4]">
              {courses.map((c) => (
                <tr key={c.name} className="transition-colors hover:bg-[#fbfefd]">
                  <td className="px-5 py-4">
                    <p className="font-display text-[0.9rem] font-bold text-ink">{c.name}</p>
                    <p className="mt-0.5 line-clamp-1 max-w-xs font-sans text-[0.72rem] text-ink-3">
                      {c.tagline}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 font-sans text-[0.8rem] text-ink-2">
                    {c.duration || "Flexible"}
                  </td>
                  <td className="px-5 py-4 font-sans text-[0.8rem] text-ink-2">
                    {c.schedule || "Monthly intakes"}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 font-display text-[0.86rem] font-extrabold text-ink">
                    {formatPKR(c.fee)}
                    <span className="font-sans text-[0.64rem] font-semibold text-ink-3"> /mo</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/courses/${courseSlug(c.name)}`}
                      className="inline-flex items-center gap-1.5 font-display text-[0.72rem] font-bold text-[#0f6b5c] transition-colors hover:text-[#0a4e43]"
                    >
                      Details
                      <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
