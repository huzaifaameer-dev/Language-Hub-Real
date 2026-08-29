"use client";

import { motion } from "framer-motion";
import { VIEWPORT_ONCE, fadeUp } from "@/lib/motion";
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
}

/** Scroll-triggered fade + rise wrapper used throughout the site. */
export function Reveal({ children, delay = 0, y = 28, blur = false, className, as = "div" }: RevealProps) {
  const Comp = motion[as];
  return (
    <Comp
      className={cn(className)}
      variants={blur ? fadeUp(delay, y, true) : fadeUp(delay, y)}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_ONCE}
    >
      {children}
    </Comp>
  );
}
