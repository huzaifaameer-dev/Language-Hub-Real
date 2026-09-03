"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { COURSE_CARDS, COURSE_FEATURES } from "@/lib/content";
import { courseSlug } from "@/lib/course-data";
import { useLang } from "@/components/LanguageProvider";

interface LiveSeat {
  name: string;
  seatsTotal: number;
  seatsUsed: number;
  seatsLeft: number;
}

type SeatMap = Record<string, LiveSeat>;

export function Courses() {
  const [seats, setSeats] = useState<SeatMap | null>(null);
  const { dict, lang } = useLang();
  const isUr = lang === "ur";

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

  return (
    <section
      id="courses"
      data-section
      className="relative overflow-hidden bg-[#f7f8fc] px-6 py-24 sm:px-12"
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
                Four ways to <span className="brand-text">move forward.</span>
              </>
            )
          }
          subtitle={dict["courses.subtitle"]}
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {COURSE_CARDS.map((card, i) => {
            const live = seats?.[card.info.name];
            const seatLeft = live?.seatsLeft;
            return (
              <motion.article
                key={card.info.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-ink/[0.07] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-28px_rgb(15_23_42/0.25)]"
              >
                <span
                  aria-hidden="true"
                  className="h-1 w-full"
                  style={{ backgroundColor: card.accent }}
                />
                <div className="flex flex-1 flex-col p-7">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="inline-block self-start rounded-md px-2.5 py-1 font-display text-[0.6rem] font-bold uppercase tracking-[0.18em]"
                      style={{ backgroundColor: `${card.accent}18`, color: card.accent }}
                    >
                      {card.info.duration}
                    </span>
                    {typeof seatLeft === "number" && (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-display text-[0.6rem] font-bold uppercase tracking-[0.12em] ${
                          seatLeft <= 3
                            ? "bg-rose-50 text-rose-600"
                            : "bg-emerald-50 text-emerald-600"
                        }`}
                      >
                        <Users className="h-3 w-3" strokeWidth={2.2} />
                        {seatLeft <= 0 ? "Waitlist" : seatLeft <= 3 ? "Only few seats" : `${seatLeft} seats left`}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-4 font-display text-[1.35rem] font-extrabold tracking-tight text-ink">
                    {card.info.name}
                  </h3>
                  <p className="mt-1 font-serif text-[0.92rem] italic text-ink-3">
                    {card.info.tagline}
                  </p>

                  {live ? (
                    <div className="mt-4">
                      <div className="flex items-center justify-between font-mono text-[0.6rem] uppercase tracking-widest text-ink-3">
                        <span>{dict["courses.seatsFilled"]}</span>
                        <span className="text-ink-2">
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
                      <li key={f} className="flex items-start gap-2.5 text-[0.86rem] text-ink-2">
                        <span
                          aria-hidden="true"
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: card.accent }}
                        />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-6">
                    <div className="flex items-center justify-between border-t border-ink/[0.06] pt-5">
                      <div>
                        <p className="font-display text-[0.6rem] font-bold uppercase tracking-[0.18em] text-ink-3">
                          From
                        </p>
                        <p className="font-display text-xl font-extrabold text-ink">
                          {card.feeLabel}
                          <span className="text-[0.7rem] font-semibold text-ink-3">/mo</span>
                        </p>
                      </div>
                      <Link
                        href={card.href}
                        className="group/link inline-flex items-center gap-2 font-display text-[0.78rem] font-bold text-brand-deep hover:text-ink"
                      >
                        Apply
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/link:translate-x-1" />
                      </Link>
                      <Link
                        href={`/courses/${courseSlug(card.info.name)}`}
                        className="inline-flex items-center font-mono text-[0.66rem] text-ink-3 transition-colors hover:text-brand-deep"
                      >
                        {dict["courses.details"]} →
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
