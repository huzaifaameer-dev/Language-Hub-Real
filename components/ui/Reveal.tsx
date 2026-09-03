"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EASE_EXPO } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  /** initial vertical offset (px) */
  y?: number;
  /** initial horizontal offset (px) — positive slides in from the right */
  x?: number;
  /** initial scale (<1 zooms in on reveal) */
  scale?: number;
  /** cinematic blur-in reveal instead of plain rise */
  blur?: boolean;
  className?: string;
  as?: "div" | "span" | "li" | "p" | "h2" | "h3";
  duration?: number;
  margin?: string;
  /** apply a hover lift (px) while the element is in view */
  hover?: boolean;
  hoverScale?: number;
}

/**
 * Scroll-triggered fade + rise wrapper. A client island, so sections around it
 * can stay server-rendered (framer's runtime stays out of their static HTML).
 * Honors reduced motion by rendering children statically when enabled.
 */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  x = 0,
  scale = 1,
  blur = false,
  duration = 0.9,
  margin = "-10% 0px -10% 0px",
  hover = false,
  hoverScale = 1.03,
  className,
  as = "div",
}: RevealProps) {
  const reduceMotion = useReducedMotion();
  const Comp = motion[as];

  if (reduceMotion) {
    return <Comp className={cn(className)}>{children}</Comp>;
  }

  return (
    <Comp
      className={cn("will-change-transform", className)}
      variants={{
        hidden: {
          opacity: 0,
          x,
          y,
          scale,
          filter: blur ? "blur(10px)" : undefined,
        },
        visible: {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          filter: blur ? "blur(0px)" : undefined,
          transition: { duration, delay, ease: EASE_EXPO },
        },
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin }}
      whileHover={hover ? { y: -6, scale: hoverScale } : undefined}
      transition={{ duration: 0.45, ease: EASE_EXPO }}
    >
      {children}
    </Comp>
  );
}