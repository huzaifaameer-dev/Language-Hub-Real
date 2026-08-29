"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export interface BookData {
  id: string;
  title: string;
  note: string;
  quote: string;
  from: string;
  to: string;
}

interface BookProps {
  data: BookData;
  className?: string;
  style?: CSSProperties;
  onOpen?: () => void;
  label?: string;
}

const TITLE = { fontFamily: "var(--font-display), serif" };

export function Book({ data, className, style, onOpen, label }: BookProps) {
  return (
    <div
      className={cn("book3d relative select-none", className)}
      style={{
        width: 148,
        height: 222,
        ...style,
      }}
    >
      <div className="page3d" aria-hidden="true" />
      <div className="spine3d" style={{ background: `linear-gradient(180deg, ${data.from}, ${data.to})` }} aria-hidden="true" />

      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open the book: ${data.title}`}
        className="cover3d flex flex-col justify-between overflow-hidden rounded-r-[8px] p-4 text-left text-white"
        style={{
          background: `radial-gradient(130% 90% at 82% 8%, rgb(255 255 255 / 0.22), transparent 46%), linear-gradient(158deg, ${data.from} 0%, ${data.to} 100%)`,
          boxShadow:
            "inset 0 0 0 1px rgb(255 255 255 / 0.18), inset 0 0 40px rgb(0 0 0 / 0.28)",
        }}
      >
        <div className="book-emboss" aria-hidden="true" />
        <div className="book-corner top-left" aria-hidden="true" />
        <div className="book-corner bottom-right" aria-hidden="true" />

        <span className="relative z-10 flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 shrink-0 rotate-[-8deg] items-center justify-center rounded-full font-display text-[0.72rem] font-extrabold tracking-tight"
            style={{
              color: data.to,
              background: "rgb(255 255 255 / 0.92)",
              boxShadow: "0 2px 10px rgb(0 0 0 / 0.28)",
            }}
            aria-hidden="true"
          >
            LH
          </span>
          <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, rgb(244 239 230 / 0.65), transparent)" }} aria-hidden="true" />
        </span>

        <span className="relative z-10 flex flex-col gap-1.5">
          <span
            className="font-serif text-[clamp(1.3rem,0.9vw,1.55rem)] font-bold leading-tight tracking-[0.02em]"
            style={{ textShadow: "0 1px 14px rgb(0 0 0 / 0.35)", ...TITLE }}
          >
            {data.title}
          </span>
          <span className="h-px w-9" style={{ background: "linear-gradient(90deg, rgb(244 239 230 / 0.9), rgb(244 239 230 / 0.1))" }} aria-hidden="true" />
          <span className="font-serif text-[0.64rem] italic leading-snug text-ivory/90">
            {data.note}
          </span>
        </span>

        <span className="relative z-10 flex items-center justify-between">
          <span className="font-display text-[0.5rem] font-bold uppercase tracking-[0.3em]" style={{ opacity: 0.75 }}>
            Language Hub
          </span>
          <span className="font-serif text-[0.58rem] italic" style={{ opacity: 0.7 }}>
            Press
          </span>
        </span>
      </button>

      <div
        className="back3d rounded-[8px]"
        style={{ background: `linear-gradient(160deg, ${data.to}, ${data.from})` }}
        aria-hidden="true"
      />
      {label && (
        <button
          type="button"
          onClick={onOpen}
          className="absolute -bottom-8 left-1/2 w-max -translate-x-1/2 rounded-full border border-ink/15 bg-white/85 px-4 py-1.5 font-display text-[0.6rem] font-bold uppercase tracking-[0.24em] text-ink-2 backdrop-blur-sm transition-colors duration-300 hover:border-brand/50 hover:text-brand-deep"
        >
          {label}
        </button>
      )}
    </div>
  );
}