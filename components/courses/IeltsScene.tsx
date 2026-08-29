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
  { word: "READ", sub: "i. comprehension", tone: "#2bb3d8" },
  { word: "WRITE", sub: "ii. composition", tone: "#6e5ae0" },
  { word: "LISTEN", sub: "iii. understanding", tone: "#d63a8c" },
  { word: "SPEAK", sub: "iv. expression", tone: "#2e9e6b" },
];

// Uniform crossfade step: fades in, holds, fades out. No movement.
function Step({
  word,
  sub,
  tone,
  win,
  p,
}: {
  word: string;
  sub: string;
  tone: string;
  win: [number, number];
  p: MotionValue<number>;
}) {
  const opacity = useTransform(p, [win[0], win[0] + 0.08, win[1] - 0.06, win[1]], [0, 1, 1, 0]);
  return (
    <motion.div style={{ opacity }} className="col-start-1 row-start-1 flex flex-col items-center gap-3 text-center">
      <span className="font-display text-[clamp(2.2rem,5.4vw,4rem)] font-extrabold leading-none tracking-tight text-ink">
        {word}
      </span>
      <span className="font-display text-[0.62rem] font-bold uppercase tracking-[0.3em] text-ink-3">{sub}</span>
      <span aria-hidden="true" className="mt-1 h-[3px] w-14 rounded-full" style={{ backgroundColor: tone }} />
    </motion.div>
  );
}

export function IeltsScene({ progress, start, end }: SceneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const p = useSceneProgress(progress, start, end, rootRef);

  const finalOp = useTransform(p, [0.74, 0.88], [0, 1]);

  return (
    <SceneShell
      forwardedRef={rootRef}
      index="02"
      name="IELTS"
      tag="An exam is a conversation with the future."
      blurb="Structured preparation across reading, writing, listening and speaking — steady work, clear goals, calm confidence."
      accent="#2bb3d8"
      tint="bg-cream"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="grid w-full place-items-center px-6">
          {STEPS.map((st, i) => (
            <Step key={st.word} word={st.word} sub={st.sub} tone={st.tone} win={[0.05 + i * 0.16, 0.19 + i * 0.16]} p={p} />
          ))}

          <motion.span
            style={{ opacity: finalOp }}
            className="col-start-1 row-start-1 w-max max-w-[16rem] text-center font-display text-[0.66rem] font-bold uppercase leading-[1.7] tracking-[0.32em] text-brand-cyan/80 lg:max-w-none lg:whitespace-nowrap lg:tracking-[0.4em]"
          >
            International English Language Testing System
          </motion.span>
        </div>
      </div>
    </SceneShell>
  );
}
