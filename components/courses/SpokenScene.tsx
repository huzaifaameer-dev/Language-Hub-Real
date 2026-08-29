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
  { word: "SPEAK", sub: "Say it out loud — today.", tone: "#6e5ae0" },
  { word: "LISTEN", sub: "Catch the rhythm of real speech.", tone: "#2bb3d8" },
  { word: "RESPOND", sub: "Answer with the words you own.", tone: "#d63a8c" },
  { word: "CONNECT", sub: "Turn small talk into real connection.", tone: "#2e9e6b" },
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
      <span className="font-display text-[clamp(2.2rem,5.4vw,4rem)] font-extrabold leading-none tracking-tight" style={{ color: tone }}>
        {word}
      </span>
      <span className="max-w-xs text-balance text-[0.95rem] leading-relaxed text-ink-2">{sub}</span>
      <span aria-hidden="true" className="mt-1 h-[3px] w-14 rounded-full" style={{ backgroundColor: tone }} />
    </motion.div>
  );
}

export function SpokenScene({ progress, start, end }: SceneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const p = useSceneProgress(progress, start, end, rootRef);

  const kickerOp = useTransform(p, [0.74, 0.84], [0, 1]);
  const headOp = useTransform(p, [0.78, 0.9], [0, 1]);
  const lineOp = useTransform(p, [0.84, 0.94], [0, 1]);

  return (
    <SceneShell
      forwardedRef={rootRef}
      index="01"
      name="Spoken English"
      tag="Speak it. Live it."
      blurb="Natural, confident conversation — built through real speaking practice from the very first session."
      accent="#6e5ae0"
      tint="bg-ivory"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="grid w-full place-items-center px-6">
          {STEPS.map((st, i) => (
            <Step key={st.word} word={st.word} sub={st.sub} tone={st.tone} win={[0.05 + i * 0.16, 0.19 + i * 0.16]} p={p} />
          ))}

          <motion.div style={{ opacity: headOp }} className="col-start-1 row-start-1 flex flex-col items-center gap-4 text-center">
            <motion.span style={{ opacity: kickerOp }} className="font-display text-[0.6rem] font-bold tracking-[0.35em] text-ink-3">
              SPEAK · LISTEN · RESPOND · CONNECT
            </motion.span>
            <span className="font-display text-[clamp(1.6rem,4.4vw,3.6rem)] font-extrabold leading-tight tracking-[-0.02em]">
              <span className="brand-text">CONFIDENT</span>{" "}
              <span className="text-ink">COMMUNICATION</span>
            </span>
            <motion.span
              aria-hidden="true"
              style={{ opacity: lineOp }}
              className="h-0.5 w-24 rounded-full bg-gradient-to-r from-brand via-brand-cyan to-brand-magenta"
            />
          </motion.div>
        </div>
      </div>
    </SceneShell>
  );
}
