"use client";

import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/hooks";

/**
 * Premium typewriter: types text character by character with a blinking
 * gradient caret. Fully respects reduced-motion preferences (renders the full
 * text instantly). Re-runs when the `text` changes (e.g. language switch).
 *
 * State resets are done at render time (the recommended "adjust state during
 * render" pattern) instead of inside effects.
 */
export function Typewriter({
  text,
  speed = 16,
  startDelay = 350,
  caret = true,
  className,
  onDone,
}: {
  text: string;
  speed?: number;
  startDelay?: number;
  caret?: boolean;
  className?: string;
  onDone?: () => void;
}) {
  const reduce = usePrefersReducedMotion();

  const [snap, setSnap] = useState(() => ({
    key: text,
    reduce,
    out: reduce ? text : "",
    done: reduce,
  }));

  // Render-time reset when text or motion preference changes.
  if (snap.key !== text || snap.reduce !== reduce) {
    setSnap({ key: text, reduce, out: reduce ? text : "", done: reduce });
  }

  useEffect(() => {
    if (snap.done || snap.reduce) return;
    let i = snap.out.length;
    let interval: ReturnType<typeof setInterval> | null = null;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        i += 1;
        setSnap((prev) =>
          prev.key === text && !prev.reduce && !prev.done
            ? { ...prev, out: text.slice(0, i), done: i >= text.length }
            : prev
        );
        if (i >= text.length && interval) clearInterval(interval);
      }, speed);
    }, startDelay);
    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, [snap, text, speed, startDelay, reduce]);

  useEffect(() => {
    if (snap.done) onDone?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap.done]);

  return (
    <span className={className}>
      {snap.out}
      {caret && !snap.done ? <span aria-hidden className="tw-caret" style={{ height: "1em" }} /> : null}
    </span>
  );
}