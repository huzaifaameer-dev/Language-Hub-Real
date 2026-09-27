"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Languages,
  Laptop,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { COURSE_CARDS, COURSE_FEATURES } from "@/lib/content";
import { courseSlug } from "@/lib/course-data";
import { registrationKeyForCatalogName } from "@/lib/registration-config";
import { ApplyButton } from "@/components/courses/ApplyButton";
import { useLang } from "@/components/LanguageProvider";
import { EASE_EXPO } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface LiveSeat {
  name: string;
  seatsTotal: number;
  seatsUsed: number;
  seatsLeft: number;
}

type SeatMap = Record<string, LiveSeat>;

const COURSE_ICONS: Record<string, LucideIcon> = {
  "Spoken English": MessageCircle,
  "IELTS Preparation": GraduationCap,
  "PTE Preparation": Laptop,
  "Duolingo English Test": Languages,
};

const gridVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_EXPO } },
};

/** Track the cursor so the hover spotlight follows it inside each card. */
function handleSpotlight(e: MouseEvent<HTMLElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
}

export function Courses() {
  const [seats, setSeats] = useState<SeatMap | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const scroller = useRef<HTMLDivElement>(null);
  const { dict, lang } = useLang();
  const isUr = lang === "ur";
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let on = true;
    fetch("/api/courses", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!on || !data?.courses) return;
        const map: SeatMap = {};
        for (const c of data.courses as LiveSeat[]) {
          map[c.name] = c;
        }
        setSeats(map);
      })
      .catch(() => {});
    return () => {
      on = false;
    };
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const update = () => {
      setCanPrev(el.scrollLeft > 8);
      setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scrollByDir = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(260, Math.round(el.clientWidth * 0.78)), behavior: "smooth" });
  };

  const total = COURSE_CARDS.length;

  return (
    <section
      id="courses"
      data-section
      className="relative overflow-hidden bg-site px-6 pt-12 pb-16 sm:px-12"
      aria-label="Courses"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          eyebrow={dict["courses.eyebrow"]}
          title={
            isUr ? (
              <>{dict["courses.title1"]} <span className="brand-text">{dict["courses.title2"]}</span></>
            ) : (
              <>
                Choose your path{" "}
                <span
                  style={{
                    backgroundImage: "linear-gradient(100deg,#1D4ED8,#2563EB,#38BDF8)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  forward.
                </span>
              </>
            )
          }
          subtitle={dict["courses.subtitle"]}
        />

        {/* Course scroller */}
        <div className="relative mt-14">
          {/* Arrows */}
          <button
            type="button"
            onClick={() => scrollByDir(-1)}
            disabled={!canPrev}
            aria-label="Scroll courses left"
            className={cn(
              "absolute -left-4 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-ink/10 bg-white/95 p-3 shadow-[0_12px_28px_-14px_rgb(15_23_42/0.5)] backdrop-blur transition-all duration-300 hover:-translate-x-0.5 hover:border-brand/40 hover:text-brand-deep lg:grid",
              !canPrev && "cursor-not-allowed opacity-30"
            )}
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.2} />
          </button>
          <button
            type="button"
            onClick={() => scrollByDir(1)}
            disabled={!canNext}
            aria-label="Scroll courses right"
            className={cn(
              "absolute -right-4 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-ink/10 bg-white/95 p-3 shadow-[0_12px_28px_-14px_rgb(15_23_42/0.5)] backdrop-blur transition-all duration-300 hover:translate-x-0.5 hover:border-brand/40 hover:text-brand-deep lg:grid",
              !canNext && "cursor-not-allowed opacity-30"
            )}
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2.2} />
          </button>

          <motion.div
            ref={scroller}
            variants={gridVariants}
            initial={reduceMotion ? false : "hidden"}
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {COURSE_CARDS.map((card, i) => {
              const live = seats?.[card.info.name];
              const seatLeft = live?.seatsLeft;
              const Icon = COURSE_ICONS[card.info.name] ?? MessageCircle;
              return (
                <motion.article
                  key={card.info.name}
                  variants={cardVariants}
                  onMouseMove={handleSpotlight}
                  className="group relative flex w-[min(100%,19.5rem)] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-ink/[0.07] bg-white transition-[transform,box-shadow,border-color] duration-500 ease-out hover:-translate-y-2 hover:border-ink/[0.12] hover:shadow-[0_34px_80px_-34px_rgb(15_23_42/0.38)]"
                >
                  <span
                    aria-hidden
                    className="relative h-1 w-full shrink-0 origin-left scale-x-50 transition-transform duration-500 group-hover:scale-x-100"
                    style={{ background: `linear-gradient(90deg, ${card.accent}, ${card.accent}1f)` }}
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(300px circle at var(--mx, 50%) var(--my, 50%), ${card.accent}1a, transparent 72%)`,
                    }}
                  />

                  <div className="relative flex flex-1 flex-col p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          aria-hidden
                          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-ivory transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110"
                          style={{
                            background: `linear-gradient(145deg, ${card.accent}, ${card.accent}b3)`,
                            boxShadow: `0 12px 26px -12px ${card.accent}`,
                          }}
                        >
                          <Icon className="h-5 w-5" strokeWidth={1.9} />
                        </span>
                        <div className="min-w-0">
                          <p className="font-mono text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-ink-3">
                            {String(i + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                          </p>
                          <h3 className="truncate font-display text-[1.22rem] font-extrabold leading-snug tracking-tight text-ink">
                            {card.info.name}
                          </h3>
                        </div>
                      </div>
                      <span
                        className="ml-1 inline-flex shrink-0 items-center rounded-md px-2.5 py-1 font-display text-[0.58rem] font-bold uppercase tracking-[0.16em]"
                        style={{ backgroundColor: `${card.accent}15`, color: card.accent }}
                      >
                        {card.info.duration}
                      </span>
                    </div>

                    <p className="mt-2.5 font-serif text-[0.92rem] italic leading-relaxed text-ink-3">
                      {card.info.tagline}
                    </p>

                    {live ? (
                      <div className="mt-4">
                        <div className="flex items-center justify-between font-mono text-[0.58rem] uppercase tracking-widest text-ink-3">
                          <span>{dict["courses.seatsFilled"]}</span>
                          <span className="flex items-center gap-2 text-ink-2">
                            {typeof seatLeft === "number" && seatLeft <= 0 ? (
                              <span className="rounded-full bg-rose-50 px-2 py-0.5 font-display text-[0.56rem] font-bold uppercase tracking-[0.12em] text-rose-600">
                                Waitlist
                              </span>
                            ) : typeof seatLeft === "number" && seatLeft <= 3 ? (
                              <span className="rounded-full bg-rose-50 px-2 py-0.5 font-display text-[0.56rem] font-bold uppercase tracking-[0.12em] text-rose-600">
                                Only {seatLeft} seats
                              </span>
                            ) : null}
                            {live.seatsUsed}/{live.seatsTotal}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink/[0.07]">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.min(100, (live.seatsUsed / Math.max(1, live.seatsTotal)) * 100)}%`,
                              backgroundColor: card.accent,
                            }}
                          />
                        </div>
                      </div>
                    ) : null}

                    <ul className="mt-5 flex flex-col gap-2.5 border-t border-ink/[0.06] pt-5">
                      {(COURSE_FEATURES[card.info.name] ?? []).slice(0, 3).map((f) => (
                        <li key={f} className="flex items-center gap-2.5 text-[0.85rem] text-ink-2">
                          <svg
                            aria-hidden
                            viewBox="0 0 12 12"
                            fill="none"
                            className="h-3.5 w-3.5 shrink-0"
                          >
                            <path
                              d="M2.2 6.4 4.8 9l4.9-6"
                              stroke={card.accent}
                              strokeWidth="1.7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-ink/[0.06] bg-[#f7f8fc] px-4 py-3">
                      <div>
                        <p className="font-display text-[0.56rem] font-bold uppercase tracking-[0.18em] text-ink-3">
                          From
                        </p>
                        <p className="font-display text-[1.05rem] font-extrabold leading-none text-ink">
                          {card.feeLabel}
                          <span className="text-[0.65rem] font-semibold text-ink-3"> /mo</span>
                        </p>
                      </div>
                      <div className="text-end">
                        <p className="font-display text-[0.56rem] font-bold uppercase tracking-[0.18em] text-ink-3">
                          Batches
                        </p>
                        <p className="font-mono text-[0.62rem] font-semibold leading-snug text-ink-2">
                          {card.batchSummary}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto flex flex-col gap-2.5 pt-4">
                      <ApplyButton
                        courseKey={registrationKeyForCatalogName(card.info.name)}
                        className="group/apply inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl font-display text-[0.7rem] font-bold uppercase tracking-[0.18em] text-ivory transition-all duration-300 active:scale-[0.98] hover:-translate-y-0.5 hover:brightness-110"
                        style={{
                          background: `linear-gradient(135deg, ${card.accent} 0%, ${card.accent}cc 100%)`,
                          boxShadow: `0 14px 30px -14px ${card.accent}`,
                        }}
                      >
                        {dict["courses.apply"]}
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/apply:translate-x-1" />
                      </ApplyButton>
                      <Link
                        href={`/courses/${courseSlug(card.info.name)}`}
                        className="group/details inline-flex h-[2.45rem] w-full items-center justify-center gap-2 rounded-xl border border-ink/[0.14] font-display text-[0.66rem] font-bold uppercase tracking-[0.18em] text-ink-2 transition-all duration-300 hover:border-ink hover:bg-ink hover:text-ivory"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        {dict["courses.details"]}
                      </Link>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        </div>

        {/* Full catalogue link — improved premium button */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex justify-center"
        >
          <Link
            href="/courses"
            className="group/see inline-flex h-12 items-center gap-2.5 rounded-full border-2 border-[#2563EB]/25 bg-white px-8 font-display text-[0.78rem] font-bold uppercase tracking-[0.16em] text-[#1647C7] shadow-[0_14px_32px_-18px_rgb(37_99_235/0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#2563EB] hover:bg-gradient-to-r hover:from-[#2563EB] hover:to-[#6D4AFF] hover:text-white hover:shadow-[0_20px_44px_-18px_rgb(37_99_235/0.9)]"
          >
            {dict["courses.seeAll"]}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/see:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}