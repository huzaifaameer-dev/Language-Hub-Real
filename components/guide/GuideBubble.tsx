"use client";

import { Volume2 } from "lucide-react";

interface GuideBubbleProps {
  /** The line Aina is currently saying (or the last thing she said). */
  text: string | null;
  /** True while Aina is talking — shows a live "speaking" equalizer. */
  speaking: boolean;
  name: string;
}

/**
 * The speech bubble pinned above the mascot. Glass-white with a tail, the
 * guide's name and a tiny audio equalizer that lights up while TTS speaks.
 */
export function GuideBubble({ text, speaking, name }: GuideBubbleProps) {
  const visible = Boolean(text && speaking);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-2.5 flex justify-center px-3">
      <div
        role="status"
        aria-live="polite"
        className={`relative max-w-[19rem] rounded-2xl rounded-br-md border border-white/70 bg-white/95 px-4 py-2.5 backdrop-blur-xl transition-all duration-300 ${
          visible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
        }`}
        style={{ boxShadow: "0 20px 48px -22px rgb(15 23 42 / 0.5)" }}
      >
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 font-display text-[0.7rem] font-extrabold text-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-brand to-brand-magenta" />
            {name}
          </span>
          {speaking ? (
            <span className="ml-auto flex h-3.5 items-end gap-[2px]" aria-hidden="true">
              <span className="w-[3px] animate-[wavebar_0.9s_ease-in-out_infinite] rounded-full bg-brand" style={{ height: "100%", animationDelay: "0ms" }} />
              <span className="w-[3px] animate-[wavebar_0.9s_ease-in-out_infinite] rounded-full bg-brand-magenta" style={{ height: "100%", animationDelay: "140ms" }} />
              <span className="w-[3px] animate-[wavebar_0.9s_ease-in-out_infinite] rounded-full bg-brand-cyan" style={{ height: "100%", animationDelay: "280ms" }} />
            </span>
          ) : (
            <Volume2 aria-hidden="true" className="ml-auto h-3.5 w-3.5 text-brand" />
          )}
        </div>
        <p className="mt-1.5 whitespace-pre-wrap text-[0.82rem] leading-relaxed text-ink-2">
          {text}
        </p>
        {/* Tail */}
        <span
          aria-hidden="true"
          className="absolute -bottom-[5px] left-4 h-2.5 w-2.5 rotate-45 border-b border-r border-white/70 bg-white/95"
        />
      </div>
    </div>
  );
}