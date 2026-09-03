"use client";

import { motion, useScroll, useSpring, useReducedMotion, useTransform } from "framer-motion";

/**
 * Thin gradient scroll-progress indicator pinned under the floating navbar.
 * The glow bar eases toward the latest scroll position; a trailing haze bar
 * follows with spring lag for a polished, layered feel. Reduced-motion users
 * get a static bar instead of the continuous spring.
 */
export function ScrollProgress({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();

  const progress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    restDelta: 0.001,
  });

  const glow = useTransform(progress, (v) => 1 - v);

  if (reduceMotion) {
    return (
      <div className={className} aria-hidden>
        <div
          className="h-full w-full origin-left bg-gradient-to-r from-brand via-brand-magenta to-gold"
          style={{ transform: `scaleX(${scrollYProgress.get()})` }}
        />
      </div>
    );
  }

  return (
    <div className={className} aria-hidden>
      <motion.div
        className="h-full w-full origin-left bg-gradient-to-r from-brand via-brand-magenta to-gold"
        style={{ scaleX: progress }}
      />
      <motion.div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-brand/40 to-gold/40 blur-[3px]"
        style={{ scaleX: glow, opacity: 0.5 }}
      />
    </div>
  );
}
