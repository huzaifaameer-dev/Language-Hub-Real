"use client";

import { useEffect, useState } from "react";

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
