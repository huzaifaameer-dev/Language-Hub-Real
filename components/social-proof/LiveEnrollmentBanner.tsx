"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, MessageSquareText, UsersRound, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEARNERS_GUIDED, OPENING_HOURS } from "@/lib/content";

const ease = [0.16, 1, 0.3, 1] as const;

/** Concrete, checkable promises — not vague adjectives. */
const SIGNALS = [
  { icon: MessageSquareText, title: "Live small-batch", sub: "Real speaking time, every class" },
  { icon: CalendarDays, title: "6 days a week", sub: OPENING_HOURS.daysLabel },
  { icon: Wand2, title: "Free demo + test", sub: "Try before you commit" },
];

interface Row {
  id: string;
  image?: string | null;
}

/**
 * Trust bar sitting directly under the hero.
 *
 * It leads with real proof — the faces of actual learners (pulled from the
 * testimonials feed) and the headline learner count — then three concrete,
 * checkable facts. No invented ratings, no filler adjectives; if the feed is
 * empty it degrades to a clean icon + text bar rather than a broken cluster.
 */
export function LiveEnrollmentBanner({ className }: { className?: string }) {
  const [avatars, setAvatars] = useState<string[]>([]);

  useEffect(() => {
    let on = true;
    fetch("/api/testimonials", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const rows: Row[] = Array.isArray(d?.testimonials) ? d.testimonials : [];
        const imgs = rows
          .map((r) => r.image)
          .filter((x): x is string => typeof x === "string" && x.length > 0)
          .slice(0, 4);
        if (on) setAvatars(imgs);
      })
      .catch(() => {});
    return () => {
      on = false;
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease }}
      className={cn("relative mx-auto max-w-6xl px-6 sm:px-12", className)}
    >
      <div className="flex flex-col items-center gap-5 rounded-2xl border border-ink/[0.07] bg-white/90 px-6 py-5 shadow-[0_24px_60px_-40px_rgb(15_23_42/0.45)] backdrop-blur sm:flex-row sm:justify-between sm:gap-8 sm:px-8">
        {/* Proof cluster — real faces + the verified count */}
        <div className="flex items-center gap-3.5">
          {avatars.length > 0 ? (
            <div className="flex -space-x-3">
              {avatars.map((src, i) => (
                <span
                  key={`${src}-${i}`}
                  className="relative h-11 w-11 overflow-hidden rounded-full bg-gradient-to-br from-[#E8F0FE] to-[#D3E2FB] ring-2 ring-white"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </span>
              ))}
            </div>
          ) : (
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand/[0.09] text-brand-deep ring-2 ring-white">
              <UsersRound className="h-5 w-5" strokeWidth={1.9} />
            </span>
          )}
          <span className="flex flex-col leading-tight">
            <span className="font-display text-[0.92rem] font-bold text-ink">
              Trusted by {LEARNERS_GUIDED.toLocaleString()}+ learners
            </span>
            <span className="mt-0.5 text-[0.72rem] text-ink-3">
              Spoken English · IELTS · PTE · Duolingo
            </span>
          </span>
        </div>

        {/* Divider (desktop) */}
        <span aria-hidden className="hidden h-12 w-px bg-ink/[0.08] sm:block" />

        {/* Concrete facts */}
        <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
          {SIGNALS.map((s) => (
            <span key={s.title} className="group flex items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand/[0.08] text-brand-deep">
                <s.icon className="icon-hover-pop h-4 w-4" strokeWidth={1.9} />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="font-display text-[0.78rem] font-bold text-ink">{s.title}</span>
                <span className="mt-0.5 text-[0.68rem] text-ink-3">{s.sub}</span>
              </span>
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
