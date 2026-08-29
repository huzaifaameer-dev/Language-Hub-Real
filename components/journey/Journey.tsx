"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { gsap, pinStartAtTop } from "@/lib/scroll";
import { useIsTouch, useMediaQuery, usePrefersReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";

interface Stage {
  word: string;
  index: string;
  accent: string;
  bg: string;
  head: string;
  body: string;
}

const STAGES: Stage[] = [
  {
    word: "LEARN",
    index: "01",
    accent: "text-brand",
    bg: "#faf8f4",
    head: "Learn",
    body: "Absorb the sounds, the rhythm, the structure. Every lesson builds a stronger foundation.",
  },
  {
    word: "PRACTICE",
    index: "02",
    accent: "text-brand-cyan",
    bg: "#f4efe6",
    head: "Practice",
    body: "Speak it out loud. Make mistakes. Try again. Fluency lives in friendly repetition.",
  },
  {
    word: "EXPRESS",
    index: "03",
    accent: "text-brand-magenta",
    bg: "#ece4d5",
    head: "Express",
    body: "Put your ideas into words — with clarity, with personality, with your own voice.",
  },
  {
    word: "GROW",
    index: "04",
    accent: "text-brand-fern",
    bg: "#f4efe6",
    head: "Grow",
    body: "Confidence compounds. Communication becomes natural. New doors begin to open.",
  },
];

const wordLetters = (word: string) =>
  word.split("").map((ch, i) => (
    <span key={`${word}-${i}`} className="inline-block will-change-transform">
      {ch}
    </span>
  ));

export function Journey() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const isTouch = useIsTouch();
  const reduced = usePrefersReducedMotion();
  const wide = useMediaQuery("(min-width: 1024px)");
  const pinned = wide && !isTouch && !reduced;

  useLayoutEffect(() => {
    if (!pinned) return;
    const section = sectionRef.current;
    const stage = stageRef.current;
    const stack = stackRef.current;
    if (!section || !stage || !stack) return;

    const ctx = gsap.context(() => {
      const bg = stage;
      const rail = stage.querySelector("[data-j-rail]");
      const fill = stage.querySelector("[data-j-fill]");
      const scenes = gsap.utils.toArray<HTMLElement>("[data-j-scene]");
      const words = gsap.utils.toArray<HTMLElement>("[data-j-word]");

      let transition: gsap.core.Timeline | null = null;

      const showWord = (i: number, prev: number) => {
        const target = words[i];
        const prevEl = prev !== i ? words[prev] : null;
        transition?.kill();
        transition = gsap.timeline();
        const tl = transition;
        if (prevEl && prevEl.children.length) {
          tl.set(target.children, { yPercent: 130, opacity: 0, rotateX: -70, filter: "blur(6px)" })
            .to(prevEl.children, {
              opacity: 0,
              yPercent: -60,
              scale: 0.92,
              rotateX: -40,
              duration: 0.3,
              stagger: 0.012,
              ease: "power2.in",
            })
            .call(() => {
              gsap.set(prevEl, { visibility: "hidden" });
              gsap.set(target, { visibility: "visible" });
            });
        } else {
          gsap.set(target, { visibility: "visible" });
        }
        tl.fromTo(
          target.children,
          { yPercent: 130, opacity: 0, rotateX: -70, filter: "blur(6px)" },
          {
            yPercent: 0,
            opacity: 1,
            rotateX: 0,
            filter: "blur(0px)",
            duration: 0.7,
            stagger: 0.045,
            ease: "expo.out",
          }
        );
      };

      showWord(0, 0);
      gsap.set(fill, { scaleY: 0 });

      // Calm arrival: drift the whole content column up and fade it in while
      // the section scrolls into view so the pin engage reads as a settle.
      const column = stack.parentElement;
      gsap.fromTo(
        column,
        { y: 90, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "top top",
            scrub: true,
          },
        }
      );

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: pinStartAtTop(section),
          end: "+=400%",
          pin: stage,
          scrub: 0.8,
          refreshPriority: 1,
          onUpdate: (self) => {
            if (!self.isActive) return;
            const idx = Math.min(3, Math.max(0, Math.floor(self.progress * 4)));
            if (fill) gsap.set(fill, { scaleY: self.progress });
            if (idx !== activeRef.current) {
              const prev = activeRef.current;
              activeRef.current = idx;
              setActive(idx);
              showWord(idx, prev);
            }
          },
        },
      });

      tl.set(bg, { backgroundColor: STAGES[0].bg })
        .to(bg, { backgroundColor: STAGES[1].bg, duration: 0.8 }, 0.6)
        .to(stack, { opacity: 0, y: -70, filter: "blur(10px)", duration: 1, ease: "power2.in" }, 3.55);

      scenes.forEach((scene, i) => {
        tl.fromTo(
          scene,
          { opacity: 0, scale: 0.82 },
          { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" },
          i * 1 + 0.25
        ).to(scene, { opacity: 0, scale: 1.05, duration: 0.5, ease: "power2.in" }, i * 1 + 0.85);
      });

      tl.to(bg, { backgroundColor: STAGES[2].bg, duration: 0.8 }, 1.6)
        .to(bg, { backgroundColor: STAGES[3].bg, duration: 0.8 }, 2.6);

      tl.fromTo(
        rail,
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" },
        0.1
      );
    }, section);

    return () => ctx.revert();
  }, [pinned]);

  const stage = STAGES[active];

  return (
    <section
      ref={sectionRef}
      className={cn("relative", pinned && "bg-ivory")}
      id="journey"
      data-section
      aria-label="The learning journey"
    >
      <div
        ref={stageRef}
        className={cn("relative overflow-hidden", pinned ? "h-screen" : "py-24")}
        data-j-bg
      >
        <div className="pointer-events-none absolute inset-0 grain" />
        <div className="aurora-blob left-[-15%] top-[-20%] h-[48vh] w-[48vh] bg-brand/12" />
        <div className="aurora-blob bottom-[-18%] right-[-12%] h-[50vh] w-[50vh] bg-brand-cyan/10" />

        {[0, 1, 2, 3].map((s) =>
          pinned ? (
            <div
              key={s}
              data-j-scene
              className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0"
              aria-hidden="true"
            >
              {s === 0 && (
              <svg width="320" height="140" viewBox="0 0 320 140" fill="none" className="overflow-visible">
                <path d="M15 128 H305" stroke="#6e5ae0" strokeOpacity="0.14" strokeWidth="2" strokeLinecap="round" />
                <path
                  d="M15 112 L70 112 L70 84 L125 84 L125 58 L180 58 L180 34 L235 34 L235 12 L295 12"
                  stroke="#6e5ae0"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  strokeDasharray="1"
                  className="animate-draw-hold"
                />
                {[
                  [70, 112],
                  [125, 84],
                  [180, 58],
                  [235, 34],
                ].map(([cx, cy], k) => (
                  <circle
                    key={k}
                    cx={cx}
                    cy={cy}
                    r="4.5"
                    fill="#6e5ae0"
                    className="svg-node animate-node-pop"
                    style={{ animationDelay: `${k * 0.42}s` }}
                  />
                ))}
                <circle cx="295" cy="12" r="5.5" fill="#6e5ae0" />
                <circle cx="295" cy="12" r="8" stroke="#6e5ae0" strokeWidth="2" className="svg-node animate-pulse-ring" />
              </svg>
            )}
            {s === 1 && (
              <svg width="320" height="140" viewBox="0 0 320 140" fill="none" className="overflow-visible">
                <path
                  d="M12 106 C 50 92, 74 116, 106 102 S 158 70, 190 80 S 250 42, 306 28"
                  stroke="#2bb3d8"
                  strokeOpacity="0.18"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M12 106 C 50 92, 74 116, 106 102 S 158 70, 190 80 S 250 42, 306 28"
                  stroke="#2bb3d8"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray="10 16"
                  className="animate-march"
                />
                <circle cx="306" cy="28" r="5" fill="#2bb3d8" className="svg-node animate-node-pop" style={{ animationDelay: "0.8s" }} />
                <circle cx="306" cy="28" r="9" stroke="#2bb3d8" strokeOpacity="0.55" strokeWidth="2" className="svg-node animate-pulse-ring" />
              </svg>
            )}
                {s === 2 && (
                  <svg width="320" height="140" viewBox="0 0 320 140" fill="none" className="overflow-visible">
                    <path
                      d="M10 70 C 60 10, 110 130, 160 70 S 260 10, 310 70"
                      stroke="#d63a8c"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray="8 10"
                    />
                  </svg>
                )}
{s === 3 && (
                  <div className="flex items-end gap-3">
                    {[36, 60, 90, 46, 74, 40, 96].map((h, k) => (
                      <span
                        key={k}
                        className="w-3 rounded-full bg-brand-fern/60 animate-wavebar"
                        style={{ height: h, animationDelay: `${k * 0.12}s` }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : null
        )}

        {pinned && (
          <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
            <p
              data-j-eyebrow
              className="flex items-center gap-4 font-display text-[0.68rem] font-bold uppercase tracking-[0.42em] text-gold-deep"
            >
              <span aria-hidden="true" className="h-px w-10 bg-gold/60" />
              One Learner. One Journey.
              <span aria-hidden="true" className="h-px w-10 bg-gold/60" />
            </p>

            <div
              ref={stackRef}
              className="relative flex h-[clamp(7rem,26vh,14rem)] w-full items-center justify-center"
            >
              {STAGES.map((s, i) =>
                i === 0 ? (
                  <motion.h2
                    key={s.word}
                    data-j-word
                    initial={{ opacity: 0, y: "40%", rotateX: -40 }}
                    whileInView={{ opacity: 1, y: "0%", rotateX: 0 }}
                    viewport={{ once: true, margin: "-15% 0px" }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                    className="absolute inset-0 flex items-center justify-center font-display font-extrabold leading-none tracking-[-0.03em] text-ink"
                    style={{
                      fontSize: "clamp(3.4rem,13vw,10rem)",
                      visibility: "visible",
                    }}
                  >
                    {wordLetters(s.word)}
                  </motion.h2>
                ) : (
                  <h2
                    key={s.word}
                    data-j-word
                    className="absolute inset-0 flex items-center justify-center font-display font-extrabold leading-none tracking-[-0.03em] text-ink"
                    style={{
                      fontSize: "clamp(3.4rem,13vw,10rem)",
                      visibility: "hidden",
                    }}
                  >
                    {wordLetters(s.word)}
                  </h2>
                )
              )}
            </div>

            <div className="mt-4 h-24 w-full max-w-md">
              <AnimatePresence mode="wait">
                <motion.div
                  key={stage.word}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                  className="flex flex-col items-center gap-3"
                >
                  <h3 className={cn("font-display text-[1.7rem] font-extrabold tracking-tight", stage.accent)}>
                    {stage.head}.
                  </h3>
                  <p className="max-w-md text-[1rem] leading-relaxed text-ink-2">{stage.body}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}

        {pinned && (
          <>
            <div
              data-j-rail
              className="absolute right-8 top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-6 opacity-0 md:flex lg:right-14"
            >
              <span className="font-display text-[0.62rem] font-bold tracking-[0.3em] text-ink-3">STAGE</span>
              <div data-j-fill className="relative h-40 w-px origin-top scale-y-0 bg-gradient-to-b from-brand via-brand-magenta to-brand-fern" />
              <div className="flex flex-col gap-4">
{STAGES.map((s, i) => (
                  <span
                    key={s.index}
                    className={cn(
                      "flex items-center gap-2 font-display text-[0.66rem] font-bold uppercase tracking-[0.22em] transition-colors duration-500",
                      active === i ? cn(s.accent, "opacity-100") : "text-ink-3 opacity-50"
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full transition-all duration-500",
                        active === i ? "bg-current scale-125" : "bg-ink/20"
                      )}
                    />
                    {s.word}
                  </span>
                ))}
              </div>
            </div>

            <motion.span
              data-j-counter
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-15% 0px" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 font-display text-[0.7rem] font-bold tracking-[0.35em] text-ink-3"
            >
              {stage.index} — 04
            </motion.span>
          </>
        )}

        {!pinned && (
          <div className="mx-auto max-w-3xl space-y-10 px-6">
            <p className="flex items-center justify-center gap-4 font-display text-[0.68rem] font-bold uppercase tracking-[0.42em] text-gold-deep">
              <span aria-hidden="true" className="h-px w-10 bg-gold/60" />
              One Learner. One Journey.
              <span aria-hidden="true" className="h-px w-10 bg-gold/60" />
            </p>
            {STAGES.map((s) => (
              <motion.div
                key={s.word}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                className="rounded-3xl border border-line bg-white/60 p-8 backdrop-blur-sm"
              >
                <span className={cn("font-display text-[0.66rem] font-bold tracking-[0.25em]", s.accent)}>
                  {s.index} — STAGE
                </span>
                <h3 className="mt-3 font-display text-[2.4rem] font-extrabold tracking-tight text-ink">
                  {s.word}.
                </h3>
                <p className="mt-2 max-w-md leading-relaxed text-ink-2">{s.body}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}