"use client";

import { useRef } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { SceneShell } from "@/components/courses/SceneShell";
import { useSceneProgress } from "@/lib/hooks";

interface SceneProps {
  progress: MotionValue<number> | null;
  start: number;
  end: number;
}

const HEIGHTS = [14, 26, 42, 64, 88, 70, 96, 52, 78, 34, 58, 84, 40, 66, 92, 48, 74, 30, 60, 86, 38, 68, 90, 46, 24];

const PHASES = [
  { word: "Language", sub: "You hear it, you understand it, you respond." },
  { word: "Response", sub: "Clear, structured, natural — under the clock." },
  { word: "Confidence", sub: "Repetition becomes automatic. Doubt fades." },
];

interface PhaseProps {
  phase: { word: string; sub: string };
  i: number;
  p: MotionValue<number>;
}

function Phase({ phase, i, p }: PhaseProps) {
  const s = 0.14 + i * 0.27;
  const opacity = useTransform(p, [s, s + 0.1, s + 0.21, s + 0.27], [0, 1, 1, 0]);
  return (
    <motion.div
      className="col-start-1 row-start-1 flex flex-col items-center text-center"
      style={{ opacity }}
    >
      <span className="font-display text-[clamp(1.2rem,2.6vw,2rem)] font-extrabold tracking-tight text-ink">
        {phase.word}
      </span>
      <span className="mt-1 max-w-[11rem] text-[0.78rem] leading-snug text-ink-2">{phase.sub}</span>
    </motion.div>
  );
}

export function PteScene({ progress, start, end }: SceneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const p = useSceneProgress(progress, start, end, rootRef);

  const bars = useTransform(p, [0.04, 0.3], [0, 1]);
  const footOpacity = useTransform(p, [0.92, 1], [0, 1]);

  return (
    <SceneShell
      forwardedRef={rootRef}
      index="03"
      name="PTE"
      tag="Train the rhythm of your response."
      blurb="Fast, structured practice for a computer-marked exam — clarity, timing and intonation that carry you through."
      accent="#d63a8c"
      tint="bg-parchment"
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex h-[30vh] items-center gap-1.5" aria-hidden="true">
          {HEIGHTS.map((h, i) => (
            <motion.span
              key={i}
              className="w-[2.5vw] max-w-4 min-w-[8px] origin-bottom rounded-full bg-gradient-to-t from-brand-magenta/35 to-brand-magenta/80"
              style={{
                height: `${h}px`,
                scaleY: bars,
                animation: i % 2 === 0 ? "wavebar 1.5s ease-in-out infinite" : "wavebar 1.9s ease-in-out infinite",
                animationDelay: `${(i % 7) * 0.14}s`,
              }}
            />
          ))}
        </div>

        <div className="relative mt-10 grid h-24 w-full place-items-center">
          {PHASES.map((phase, i) => (
            <Phase key={phase.word} phase={phase} i={i} p={p} />
          ))}
        </div>

        <motion.span
          className="mt-8 font-display text-[0.62rem] font-bold uppercase tracking-[0.22em] text-ink-3 lg:tracking-[0.4em]"
          style={{ opacity: footOpacity }}
        >
          Language → Response → Confidence
        </motion.span>
      </div>
    </SceneShell>
  );
}