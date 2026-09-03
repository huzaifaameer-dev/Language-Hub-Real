"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_EXPO } from "@/lib/motion";

interface SectionHeaderProps {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  center?: boolean;
  /** delay the whole reveal (useful when staggered after a prior section) */
  delay?: number;
}

/**
 * Premium section heading used across the site. Reveals the eyebrow, title and
 * subtitle with a soft, staggered cinematic rise — cheap to render because the
 * wrapping sections are client components already.
 */
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  center = true,
  delay = 0,
}: SectionHeaderProps) {
  const reduceMotion = useReducedMotion();
  const d = (extra = 0) => delay + extra;

  return (
    <div className={center ? "flex flex-col items-center text-center" : "flex flex-col"}>
      <motion.span
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-8% 0px -8% 0px" }}
        transition={{ duration: 0.6, delay: d(0), ease: EASE_EXPO }}
        className="inline-flex items-center gap-2.5 font-display text-[0.62rem] font-bold uppercase tracking-[0.32em] text-gold-deep"
      >
        <span aria-hidden="true" className="h-px w-8 bg-gold/60" />
        {eyebrow}
        {center && <span aria-hidden="true" className="h-px w-8 bg-gold/60" />}
      </motion.span>

      <motion.h2
        initial={reduceMotion ? false : { opacity: 0, y: 26, filter: "blur(6px)" }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-8% 0px -8% 0px" }}
        transition={{ duration: 0.8, delay: d(0.08), ease: EASE_EXPO }}
        className="mt-5 font-display text-[clamp(1.9rem,4.4vw,3.2rem)] font-extrabold leading-[1.08] tracking-[-0.02em] text-ink"
      >
        {title}
      </motion.h2>

      {subtitle ? (
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8% 0px -8% 0px" }}
          transition={{ duration: 0.7, delay: d(0.16), ease: EASE_EXPO }}
          className="mt-5 max-w-2xl text-[1rem] leading-relaxed text-ink-2"
        >
          {subtitle}
        </motion.p>
      ) : null}
    </div>
  );
}
