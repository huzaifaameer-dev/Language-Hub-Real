"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { gsap, pinStartAtTop } from "@/lib/scroll";
import { useIsTouch, useMediaQuery, usePrefersReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const PHASES = [
  { word: "VOICE", note: "Everyone has one. Most never use it fully.", scale: 1, tone: "#f5f2ea" },
  { word: "YOUR VOICE", note: "Not a copy of anyone else's. Yours.", scale: 0.62, tone: "#f5f2ea" },
  { word: "YOUR IDEAS", note: "Worth arranging into the right words.", scale: 0.46, tone: "#f5f2ea" },
  { word: "YOUR FUTURE", note: "Opened one confident sentence at a time.", scale: 0.36, tone: "#c2a05c" },
];

const wordLetters = (word: string) =>
  word.split("").map((ch, i) => (
    <span key={`${word}-${i}`} className="inline-block will-change-transform">
      {ch}
    </span>
  ));

export function Voice() {
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
      const words = gsap.utils.toArray<HTMLElement>("[data-v-word]");
      const note = stage.querySelector("[data-v-note]");
      const counter = stage.querySelector("[data-v-counter]");
      const glow = stage.querySelector("[data-v-glow]");
      const wrap = stage.querySelector("[data-v-wrap]");

      // Hide all letters up front so every phase — including the first —
      // gets the same animated entrance.
      words.forEach((w) => gsap.set(w.children, { opacity: 0 }));

      // Single render function — kills all running tweens first, then
      // either animates (forward) or instantly places (backward/scrub).
      const renderPhase = (i: number, { instant = false } = {}) => {
        // Kill every pending tween on every word + note so nothing races.
        words.forEach((w) => gsap.killTweensOf(w.children));
        gsap.killTweensOf(note);

        words.forEach((w, k) => {
          if (k === i) {
            gsap.set(w, { visibility: "visible" });
            if (instant) {
              gsap.set(w.children, {
                opacity: 1,
                scale: PHASES[k].scale,
                filter: "blur(0px)",
                y: 0,
                yPercent: 0,
              });
            } else {
              gsap.fromTo(
                w.children,
                { opacity: 0, scale: 0.7, filter: "blur(14px)" },
                {
                  opacity: 1,
                  scale: PHASES[k].scale,
                  filter: "blur(0px)",
                  duration: 0.85,
                  stagger: 0.02,
                  ease: "expo.out",
                }
              );
            }
          } else {
            gsap.set(w, { visibility: "hidden" });
            gsap.set(w.children, { opacity: 0 });
          }
        });

        gsap.set(note, { opacity: instant ? 1 : 0, y: instant ? 0 : 16 });
        if (!instant) {
          gsap.to(note, {
            opacity: 1,
            y: 0,
            duration: 0.7,
            delay: 0.45,
            ease: "power2.out",
          });
        }
      };

      // Calm arrival: the whole HUD settles in while the section approaches.
      gsap.fromTo(
        wrap,
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

      // First phase entrance fires just before the pin engages so the word
      // is already alive when the freeze point arrives.
      gsap
        .timeline({
          scrollTrigger: { trigger: section, start: "top 55%", once: true },
        })
        .add(() => renderPhase(0));

      gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: pinStartAtTop(section),
          end: "+=300%",
          pin: stage,
          scrub: 0.8,
          refreshPriority: 1,
          onUpdate: (self) => {
            const p = self.progress;
            const idx = p < 0.18 ? 0 : p < 0.42 ? 1 : p < 0.66 ? 2 : 3;
            if (idx !== activeRef.current) {
              const prev = activeRef.current;
              activeRef.current = idx;
              setActive(idx);
              const instant = idx < prev || Math.abs(idx - prev) > 1;
              renderPhase(idx, { instant });
            }
            gsap.to(glow, { opacity: 0.25 + p * 0.5, scale: 0.8 + p * 0.6, duration: 0.2, overwrite: true });
          },
        },
      });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "+=300%",
            scrub: 0.8,
          },
        })
        .fromTo(stack, { opacity: 1, y: 0 }, { opacity: 0, y: -70, filter: "blur(10px)", duration: 0.09, ease: "power2.in" }, 0.77)
        .fromTo(note, { opacity: 1, y: 0 }, { opacity: 0, y: -46, filter: "blur(8px)", duration: 0.06 }, 0.82)
        .fromTo(counter, { opacity: 1 }, { opacity: 0, duration: 0.04 }, 0.82);
    }, section);

    return () => ctx.revert();
  }, [pinned]);

  const phase = PHASES[active];

  return (
    <section
      ref={sectionRef}
      className={cn("relative bg-[#14111d] text-ivory", pinned && "h-[380vh]")}
      id="voice"
      data-section
      aria-label="Find your voice"
    >
      <div
        ref={stageRef}
        className={cn("relative overflow-hidden bg-[#14111d]", pinned ? "h-screen" : "min-h-screen py-28")}
      >
        <div className="pointer-events-none absolute inset-0 grain" />
        <div
          aria-hidden="true"
          className="bg-grid-dark pointer-events-none absolute inset-0"
          style={{
            maskImage: "radial-gradient(ellipse at center, black 40%, transparent 78%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 78%)",
          }}
        />
        <div className="aurora-blob left-[10%] top-[-14%] h-[46vh] w-[46vh] bg-brand/18" />

        <div
          data-v-glow
          className="pointer-events-none absolute left-1/2 top-1/2 h-[64vmin] w-[64vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(194_160_92/0.12),transparent_62%)]"
        />
        <div
          aria-hidden="true"
          className="svg-node pointer-events-none absolute left-1/2 top-1/2 h-[46vmin] w-[46vmin] -translate-x-1/2 -translate-y-1/2 animate-pulse-ring rounded-full border border-gold/20"
        />

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <div data-v-wrap className="flex flex-col items-center">
            <p data-v-counter className="mb-7 font-mono text-[0.66rem] font-bold uppercase tracking-[0.45em] text-gold/80">
              PHASE {String(active + 1).padStart(2, "0")} / 04
            </p>

            {pinned ? (
              <div ref={stackRef} className="relative flex h-[clamp(8rem,30vh,15rem)] w-full items-center justify-center">
                {PHASES.map((p, i) => (
                  <h2
                    key={p.word}
                    data-v-word
                    className="absolute inset-0 flex items-center justify-center font-display font-extrabold leading-none tracking-[-0.03em]"
                    style={{
                      color: p.tone,
                      fontSize: "clamp(3rem,13vw,10.5rem)",
                      visibility: i === 0 ? "visible" : "hidden",
                    }}
                  >
                    {wordLetters(p.word)}
                  </h2>
                ))}
              </div>
            ) : (
              <>
                <h2 className="font-display text-[clamp(3rem,13vw,8rem)] font-extrabold leading-none tracking-[-0.03em]">
                  YOUR <span className="gold-text">VOICE.</span>
                </h2>
                <div className="mt-12 grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
                  {PHASES.map((p, i) => (
                    <div
                      key={p.word}
                      className="rounded-2xl border border-ivory/10 bg-white/[0.03] p-6 text-left"
                    >
                      <p className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.3em] text-gold/70">
                        Phase {i + 1} / 04
                      </p>
                      <p className="mt-2 font-display text-[1.6rem] font-extrabold tracking-tight text-ivory">{p.word}</p>
                      <p className="mt-1 font-serif text-[0.92rem] italic text-ivory/70">{p.note}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div aria-hidden="true" className="mt-9 flex h-9 items-end gap-1.5">
              {[18, 34, 26, 46, 30, 50, 24, 38, 20].map((h, i) => (
                <span
                  key={i}
                  className="w-1.5 origin-bottom animate-wavebar rounded-full bg-gradient-to-t from-brand/70 to-gold/80"
                  style={{ height: `${h}px`, animationDelay: `${i * 0.13}s`, animationDuration: `${1.4 + (i % 3) * 0.25}s` }}
                />
              ))}
            </div>

            <p data-v-note className="mt-8 max-w-md font-serif text-[clamp(1.05rem,2vw,1.4rem)] italic leading-relaxed text-ivory/70">
              {phase.note}
            </p>

            <div aria-hidden="true" className="mt-9 flex items-center gap-2">
              {PHASES.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1 rounded-full transition-all duration-500",
                    i <= active ? "w-12 bg-gold" : "w-5 bg-ivory/15"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}