"use client";

import { useEffect, useRef } from "react";
import { Logo } from "@/components/ui/Logo";

/**
 * Clean, fast brand reveal — ~2.5s, no heavy animation. Just a soft fade of
 * the logo + wordmark, then lifts away. Skips on reduced motion instantly.
 */
export function BrandIntro({ onComplete }: { onComplete: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const done = useRef(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      onComplete();
      return;
    }

    const finish = () => {
      if (done.current) return;
      done.current = true;
      onComplete();
    };

    root.style.transition = "opacity 0.7s cubic-bezier(0.16,1,0.3,1)";
    requestAnimationFrame(() => {
      root.style.opacity = "1";
    });

    const timer = window.setTimeout(() => {
      root.style.opacity = "0";
      window.setTimeout(finish, 700);
    }, 1800);

    const skip = () => finish();
    window.addEventListener("pointerdown", skip, { once: true });
    window.addEventListener("keydown", skip, { once: true });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
    };
  }, [onComplete]);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[120] flex flex-col items-center justify-center gap-6 bg-[#0c0a14] opacity-0"
      aria-label="Language Hub loading"
    >
      <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_20px_50px_-20px_rgb(0_0_0/0.6)] ring-1 ring-white/10">
        <Logo size="sm" eager />
      </span>
      <p className="font-display text-2xl font-extrabold tracking-[0.14em] text-white">
        LANGUAGE<span className="gold-text"> HUB</span>
      </p>
      <p className="font-display text-[0.62rem] font-bold uppercase tracking-[0.4em] text-white/50">
        Hub of Language Excellence
      </p>
    </div>
  );
}
