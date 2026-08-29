"use client";

import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/scroll";

let lenis: Lenis | null = null;

/** Start Lenis smooth scrolling, synced with GSAP ScrollTrigger. */
export function initLenis(): Lenis | null {
  if (typeof window === "undefined" || lenis) return lenis;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;

  lenis = new Lenis({
    duration: 1.15,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.5,
  });

  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  return lenis;
}

function tick(time: number) {
  lenis?.raf(time * 1000);
}

export function destroyLenis(): void {
  gsap.ticker.remove(tick);
  lenis?.destroy();
  lenis = null;
}

export function getLenis(): Lenis | null {
  return lenis;
}

/** Smoothly scroll to an anchor id, offset for the floating nav. */
export function scrollToId(id: string): void {
  const target = document.getElementById(id);
  if (!target) return;

  if (lenis) {
    lenis.scrollTo(target, { offset: -72, duration: 1.5 });
    return;
  }
  target.scrollIntoView({ behavior: "auto" });
}
