"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useReducedMotion as useFramerReducedMotion } from "framer-motion";

/**
 * Tracks whether an element is on screen, so continuous animations (marquees,
 * cycling cards, drifting gradients) can be paused while the section is out of
 * view — the single biggest CPU/battery saving on mobile.
 *
 * Starts `true` so above-the-fold animations never begin paused; the observer
 * corrects it on the first callback. Pausing/resuming CSS animations and
 * resetting timers is glitch-free (play-state resumes mid-cycle), so callers
 * should prefer that over re-mounting anything.
 */
export function useInView<T extends Element = HTMLElement>(
  rootMargin = "200px"
): [(node: T | null) => void, boolean] {
  const [inView, setInView] = useState(true);
  const [node, setNode] = useState<T | null>(null);
  // callback ref: re-attaches the observer whenever the node (un)mounts, so
  // sections that render conditionally (e.g. after a fetch) still observe.
  const ref = useCallback((n: T | null) => setNode(n), []);

  useEffect(() => {
    if (!node || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin,
    });
    io.observe(node);
    return () => io.disconnect();
  }, [node, rootMargin]);

  return [ref, inView];
}

/** True when the user prefers reduced motion. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    const raf = window.requestAnimationFrame(() => {
      setReduced(mq.matches);
      mq.addEventListener("change", onChange);
    });
    return () => {
      window.cancelAnimationFrame(raf);
      mq.removeEventListener("change", onChange);
    };
  }, []);

  return reduced;
}

const subscribeMounted = () => () => {};
const mountedSnapshot = () => true;
const mountedServerSnapshot = () => false;

/**
 * Hydration-safe reduced-motion read for framer-motion.
 *
 * framer's own `useReducedMotion()` returns the real machine value during the
 * client's hydration render, which mismatches the server HTML for components
 * that use `initial={reduceMotion ? false : {...}}` — React then discards the
 * tree and logs a hydration error under `prefers-reduced-motion`.
 *
 * This returns `false` on the server AND on the first client paint (via the
 * store's server snapshot), so the initial render always matches. It flips to
 * the real user preference right after hydration.
 */
export function useReducedMotionSafe(): boolean {
  const mounted = useSyncExternalStore(
    subscribeMounted,
    mountedSnapshot,
    mountedServerSnapshot
  );
  // Always invoke the framer hook so hook order is stable across renders; the
  // gate only decides the returned value.
  const reduce = useFramerReducedMotion() === true;
  return mounted && reduce;
}

/** True when the pointer is coarse (touch device). */
export function useIsTouch(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const onChange = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    const raf = window.requestAnimationFrame(() => {
      setIsTouch(mq.matches);
      mq.addEventListener("change", onChange);
    });
    return () => {
      window.cancelAnimationFrame(raf);
      mq.removeEventListener("change", onChange);
    };
  }, []);

  return isTouch;
}

/** Locks body scroll while `locked` is true. */
export function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [locked]);
}

/** Match a media query and keep it reactive. Starts as `false` to keep the
 * server and the first client render identical. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    const raf = window.requestAnimationFrame(() => {
      onChange();
      mq.addEventListener("change", onChange);
    });
    return () => {
      window.cancelAnimationFrame(raf);
      mq.removeEventListener("change", onChange);
    };
  }, [query]);

  return matches;
}

/** True once the document is no longer hidden — pauses rAF work otherwise. */
export function useDocumentVisible(): boolean {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  return visible;
}
