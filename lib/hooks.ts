"use client";

import { useEffect, useState, type RefObject } from "react";
import { animate, useInView, useMotionValue, useTransform, type MotionValue } from "framer-motion";

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

const EASE_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * Horizontal travel for a pinned gallery. Measures the real scrollable
 * distance (`track width − viewport`) so the layout always ends flush on the
 * final panel, regardless of screen size.
 */
export function useHorizontalTrackX(
  scrollYProgress: MotionValue<number>,
  track: RefObject<HTMLElement | null>,
  enabled: boolean
): MotionValue<number> {
  const [maxX, setMaxX] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const el = track.current;
    if (!el) return;
    const update = () =>
      setMaxX(Math.max(0, el.offsetWidth - (el.parentElement?.clientWidth ?? 0)));
    const raf = window.requestAnimationFrame(update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      window.cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [enabled, track]);

  return useTransform(scrollYProgress, [0, 1], [0, -maxX], { clamp: true });
}

/**
 * Scene progress source for horizontal galleries. When a `progress` motion
 * value is supplied (desktop horizontal mode) it maps `[start, end] → [0, 1]`.
 * Otherwise (stacked/touch mode) an internal value animates 0→1 when the scene
 * scrolls into view and resets when it leaves.
 */
export function useSceneProgress(
  progress: MotionValue<number> | null,
  start: number,
  end: number,
  ref: RefObject<Element | null>
): MotionValue<number> {
  const internal = useMotionValue(0);
  const isInView = useInView(ref, { margin: "-15% 0px -15% 0px" });

  useEffect(() => {
    if (progress) return;
    if (isInView) {
      const controls = animate(internal, 1, { duration: 1.5, ease: EASE_EXPO });
      return () => controls.stop();
    }
    internal.set(0);
  }, [isInView, progress, internal]);

  return useTransform(
    progress ?? internal,
    progress ? [start, end] : [0, 1],
    [0, 1],
    { clamp: true }
  );
}
