"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, MessageSquareText, UsersRound, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEARNERS_GUIDED, OPENING_HOURS } from "@/lib/content";

const ease = [0.16, 1, 0.3, 1] as const;

/** Concrete, checkable promises — not vague adjectives. */
const SIGNALS = [
  { icon: MessageSquareText, title: "Live small-batch", sub: "Real speaking time, every class", tone: "clay" },
  { icon: CalendarDays, title: "6 days a week", sub: OPENING_HOURS.daysLabel, tone: "clay clay-coral" },
  { icon: Wand2, title: "Free demo + test", sub: "Try before you commit", tone: "clay clay-amber" },
] as const;

interface Row {
  id: string;
  image?: string | null;
}

/**
 * Trust bar sitting directly under the hero: real learner faces and the
 * verified count on the left, three concrete facts on the right, all inside a
 * clean white rail that matches the reference navbar.
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
      <div className="flex flex-col items-center gap-5 rounded-3xl border border-[#e3ede9] bg-white px-6 py-5 shadow-[0_24px_60px_-44px_rgba(6,46,40,0.45)] sm:flex-row sm:justify-between sm:gap-8 sm:px-8">
        <div className="flex items-center gap-3.5">
          {avatars.length > 0 ? (
            <div className="flex -space-x-3">
              {avatars.map((src, i) => (
                <span
                  key={`${src}-${i}`}
                  className="relative h-11 w-11 overflow-hidden rounded-full bg-[#eaf7f3] ring-2 ring-white"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </span>
              ))}
            </div>
          ) : (
            <span className="clay h-11 w-11 shrink-0 rounded-xl">
              <UsersRound className="relative z-10 h-5 w-5 text-[#0f6b5c]" strokeWidth={1.9} />
            </span>
          )}
          <span className="flex flex-col leading-tight">
            <span className="font-display text-[0.92rem] font-bold text-ink">
              Trusted by {LEARNERS_GUIDED.toLocaleString()}+ learners
            </span>
            <span className="mt-0.5 font-sans text-[0.72rem] text-ink-3">
              Spoken English · IELTS · PTE · Duolingo
            </span>
          </span>
        </div>

        <span aria-hidden className="hidden h-12 w-px bg-[#e3ede9] sm:block" />

        <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
          {SIGNALS.map((s) => (
            <span key={s.title} className="group flex items-center gap-2.5">
              <span className={cn(s.tone, "h-9 w-9 shrink-0 rounded-xl")}>
                <s.icon
                  className="icon-hover-pop relative z-10 h-4 w-4 text-[#0f6b5c]"
                  strokeWidth={1.9}
                />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="font-display text-[0.78rem] font-bold text-ink">{s.title}</span>
                <span className="mt-0.5 font-sans text-[0.68rem] text-ink-3">{s.sub}</span>
              </span>
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
