"use client";

/**
 * Anchor scrolling for the single-page marketing site.
 *
 * Uses the browser's native smooth scrolling. This replaced a Lenis + GSAP
 * ScrollTrigger setup whose initialiser was never called, so `scrollToId`
 * silently fell through to an instant jump — the motion library was bundled
 * for nothing.
 */

/** Height of the floating navbar, so the target is not hidden underneath it. */
const NAV_OFFSET = 72;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Scroll to the element with the given id, offset for the floating navbar.
 * Honours `prefers-reduced-motion` by jumping instead of animating.
 */
export function scrollToId(id: string): void {
  if (typeof document === "undefined") return;
  const target = document.getElementById(id);
  if (!target) return;

  const top =
    target.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;

  window.scrollTo({
    top: Math.max(0, top),
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
}