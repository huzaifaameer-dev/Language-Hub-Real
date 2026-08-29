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

const STEPS = [
  { word: "hello", sub: "Your very first word." },
  { word: "speak", sub: "Then a sentence. Then a story." },
  { word: "grow", sub: "Then a habit that carries you." },
];

// Uniform crossfade step: fades in, holds, fades out. No movement.
function Step({
  word,
  sub,
  win,
  p,
}: {
  word: string;
  sub: string;
  win: [number, number];
  p: MotionValue<number>;
}) {
  const opacity = useTransform(p, [win[0], win[0] + 0.09, win[1] - 0.06, win[1]], [0, 1, 1, 0]);
  return (
    <motion.div style={{ opacity }} className="col-start-1 row-start-1 flex flex-col items-center gap-4 text-center">
      <span className="font-serif italic leading-none text-ink" style={{ fontSize: "clamp(2.6rem,6vw,4.8rem)" }}>
        {word}
      </span>
      <span className="max-w-xs text-balance text-[0.95rem] leading-relaxed text-ink-2">{sub}</span>
      <span aria-hidden="true" className="mt-1 h-[3px] w-14 rounded-full bg-brand-fern/70" />
    </motion.div>
  );
}

const BUILD = ["ONE", "WORD", "AT", "A", "TIME"];

export function DuolingoScene({ progress, start, end }: SceneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const p = useSceneProgress(progress, start, end, rootRef);

  const shapesOp = useTransform(p, [0.02, 0.12], [0, 1]);
  const buildOp = useTransform(p, [0.7, 0.82], [0, 1]);
  const chipOp = useTransform(p, [0.88, 0.97], [0, 1]);

  return (
    <SceneShell
      forwardedRef={rootRef}
      index="04"
      name="Duolingo"
      tag="Small steps. Everyday magic."
      blurb="Playful, progressive preparation that makes the language a daily habit — a little every day, always moving forward."
      accent="#2e9e6b"
      tint="bg-ivory"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div aria-hidden="true" style={{ opacity: shapesOp }} className="absolute h-[34vmin] w-[34vmin] rounded-[2.4rem] bg-brand/5" />
        <motion.div aria-hidden="true" style={{ opacity: shapesOp }} className="absolute h-[24vmin] w-[24vmin] rounded-full bg-brand-magenta/5" />

        <div className="grid w-full place-items-center px-6">
          {STEPS.map((st, i) => (
            <Step key={st.word} word={st.word} sub={st.sub} win={[0.06 + i * 0.2, 0.24 + i * 0.2]} p={p} />
          ))}

          <motion.div style={{ opacity: buildOp }} className="col-start-1 row-start-1 flex flex-col items-center gap-6 text-center">
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              {BUILD.map((w, i) => (
                <span
                  key={`${w}-${i}`}
                  className="font-display font-extrabold tracking-tight"
                  style={{
                    color: w === "WORD" || w === "TIME" ? "#2e9e6b" : "#221e2b",
                    fontSize: "clamp(1.6rem,4.6vw,3.6rem)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {w}
                </span>
              ))}
            </div>
            <motion.span
              style={{ opacity: chipOp }}
              className="rounded-full border border-brand-fern/30 bg-brand-fern/10 px-5 py-2 font-display text-[0.62rem] font-bold uppercase tracking-[0.3em] text-brand-fern"
            >
              Consistency beats intensity
            </motion.span>
          </motion.div>
        </div>
      </div>
    </SceneShell>
  );
}
