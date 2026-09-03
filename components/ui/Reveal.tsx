"use client";

import { motion } from "framer-motion";
import { EASE_EXPO } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  /** cinematic blur-in reveal instead of plain rise */
  blur?: boolean;
  className?: string;
  as?: "div" | "span" | "li" | "p";
  duration?: number;
  margin?: string;
  /** apply a hover lift (px) while the element is in view */
  hover?: boolean;
}

/**
 * Scroll-triggered fade + rise wrapper. A client island, so sections around it
 * can stay server-rendered (framer's runtime stays out of their static HTML).
 */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  blur = false,
  duration = 0.9,
  margin = "-10% 0px -10% 0px",
  hover = false,
  className,
  as = "div",
}: RevealProps) {
  const Comp = motion[as];
  return (
    <Comp
      className={cn(className)}
      variants={{
        hidden: blur ? { opacity: 0, y, filter: "blur(10px)" } : { opacity: 0, y },
        visible: {
          opacity: 1,
          y: 0,
          filter: blur ? "blur(0px)" : undefined,
          transition: { duration, delay, ease: EASE_EXPO },
        },
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin }}
      whileHover={hover ? { y: -8 } : undefined}
    >
      {children}
    </Comp>
  );
}