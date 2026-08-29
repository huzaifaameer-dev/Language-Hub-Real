"use client";

import type { ReactNode, RefObject } from "react";
import { scrollToId } from "@/lib/lenis";

interface ShellProps {
  index: string;
  name: string;
  tag: string;
  blurb: string;
  accent: string;
  tint: string;
  children: ReactNode;
  forwardedRef?: RefObject<HTMLDivElement | null>;
}

export function SceneShell({
  index,
  name,
  tag,
  blurb,
  accent,
  tint,
  children,
  forwardedRef,
}: ShellProps) {
  return (
    <div
      ref={forwardedRef}
      className="relative flex h-[100svh] min-h-[640px] w-screen shrink-0 flex-col overflow-hidden px-6 py-20 sm:px-12"
    >
      <div className={`pointer-events-none absolute inset-0 ${tint}`} />
      <div className="pointer-events-none absolute inset-0 grain" />
      <div
        className="pointer-events-none absolute -right-10 -top-24 font-display text-[clamp(8rem,20vw,16rem)] font-extrabold leading-none text-ink/5 select-none"
        aria-hidden="true"
      >
        {index}
      </div>

      <div className="relative z-10 mt-auto max-w-xl">
        <p className="mb-4 flex items-center gap-3 font-display text-[0.66rem] font-bold uppercase tracking-[0.3em] text-gold-deep">
          <span aria-hidden="true" className="h-px w-8 bg-gold/60" />
          {index} — {name}
        </p>
        <h3
          className="font-display text-[clamp(1.8rem,3.6vw,3rem)] font-extrabold leading-[1.05] tracking-[-0.02em]"
          style={{ color: accent }}
        >
          {tag}
        </h3>
        <p className="mt-4 max-w-md text-[1rem] leading-relaxed text-ink-2">{blurb}</p>
        <button
          type="button"
          onClick={() => scrollToId("hub")}
          className="group mt-6 inline-flex items-center gap-2 font-display text-[0.78rem] font-bold uppercase tracking-[0.22em] transition-colors duration-300"
          style={{ color: accent }}
          aria-label={`Learn more about ${name}`}
        >
          Explore the course
          <span className="inline-block transition-transform duration-500 group-hover:translate-x-1.5">→</span>
        </button>
      </div>

      <div className="pointer-events-none absolute inset-0 z-0">{children}</div>
    </div>
  );
}