"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

if (typeof window !== "undefined") {
  const w = window as unknown as Record<string, unknown>;
  if (!w.gsap) w.gsap = gsap;
  if (!w.ScrollTrigger) w.ScrollTrigger = ScrollTrigger;
}

export { gsap, ScrollTrigger };

export const DESKTOP_MQ = "(min-width: 1024px)";

export const clamp01 = (value: number): number =>
  Math.max(0, Math.min(1, value));

export function initScrollSystem() {
  ScrollTrigger.config({ ignoreMobileResize: true });
  ScrollTrigger.refresh();
  if (typeof document !== "undefined") {
    document.fonts?.ready.then(() => ScrollTrigger.refresh()).catch(() => undefined);
  }
}

export function pinStartAtTop(target: Element) {
  return () => {
    const r = target.getBoundingClientRect();
    return r.top + window.scrollY;
  };
}