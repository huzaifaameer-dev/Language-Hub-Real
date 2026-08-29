import type { Transition, Variants } from "framer-motion";

/** Signature easing — a refined expo-out used across the site. */
export const EASE_EXPO = [0.16, 1, 0.3, 1] as const;
/** Softer quint-out for slower, more luxurious motion. */
export const EASE_QUINT = [0.22, 1, 0.36, 1] as const;

export const VIEWPORT_ONCE = { once: true, margin: "-10% 0px -10% 0px" } as const;

export function transition(duration = 0.9, delay = 0): Transition {
  return { duration, delay, ease: EASE_EXPO };
}

/** Rise + fade used for most reveal-on-scroll content. */
export function fadeUp(delay = 0, y = 28, blur = false, duration = 0.9): Variants {
  return {
    hidden: blur ? { opacity: 0, y, filter: "blur(10px)" } : { opacity: 0, y },
    visible: {
      opacity: 1,
      y: 0,
      filter: blur ? "blur(0px)" : undefined,
      transition: { duration, delay, ease: EASE_EXPO },
    },
  };
}

/** Soft fade with slight blur — used for background layers. */
export function fadeIn(delay = 0, duration = 1.2): Variants {
  return {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration, delay, ease: EASE_EXPO } },
  };
}

/** Masked line reveal for headlines: content rises out of an opaque mask. */
export function lineReveal(delay = 0, duration = 1): Variants {
  return {
    hidden: { y: "115%" },
    visible: { y: "0%", transition: { duration, delay, ease: EASE_QUINT } },
  };
}

/** Shared props for stagger orchestration. */
export const stagger = (staggerChildren = 0.09, delayChildren = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren, delayChildren } },
});
