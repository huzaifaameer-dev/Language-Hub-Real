"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { gsap, pinStartAtTop } from "@/lib/scroll";
import { useIsTouch, useMediaQuery, usePrefersReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const WORDS = [
  { word: "Confidence", note: "The quiet belief that your words are worth speaking.", accent: "#6e5ae0" },
  { word: "Communication", note: "The skill of being truly understood — and understanding.", accent: "#2bb3d8" },
  { word: "Expression", note: "The art of making your ideas sound like you.", accent: "#d63a8c" },
  { word: "Possibility", note: "The doors that open when you can say what you mean.", accent: "#c2a05c" },
];

const VB_H = 46;

export function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const railRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
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
    const path = pathRef.current;
    const rail = railRef.current;
    const dot = dotRef.current;
    if (!section || !stage || !path || !rail || !dot) return;

    const ctx = gsap.context(() => {
      const nodes = gsap.utils.toArray<HTMLElement>("[data-about-node]");
      const close = stage.querySelector("[data-about-close]");
      const inner = stage.querySelector("[data-about-inner]");
      const total = path.getTotalLength();
      gsap.set(rail, { strokeDasharray: total, strokeDashoffset: total });

      // Seamless arrival: the settle deliberately does NOT finish before the
      // pin engages — it hands over residual motion (y: 16) that the pinned
      // timeline keeps gliding to rest, so the freeze point is invisible.
      gsap.fromTo(
        inner,
        { y: 90 },
        {
          y: 16,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "top top",
            scrub: true,
          },
        }
      );
      gsap.fromTo(
        inner,
        { opacity: 0 },
        {
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "top 32%",
            scrub: true,
          },
        }
      );
      // Blend the stage background in from the previous section's end color
      // so no visible seam crosses the boundary.
      gsap.fromTo(
        stage,
        { backgroundColor: "#f4efe6" },
        {
          backgroundColor: "#faf8f4",
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "top top",
            scrub: true,
          },
        }
      );

      nodes.forEach((node, i) => {
        const point = path.getPointAtLength(total * (0.16 + i * 0.24));
        gsap.set(node, {
          xPercent: -50,
          yPercent: -50,
          left: point.x + "%",
          top: (point.y / VB_H) * 100 + "%",
        });
      });

      const settle = (i: number) => {
        nodes.forEach((n, k) => {
          if (k === i) {
            gsap.to(n, { scale: 1.08, y: -8, opacity: 1, duration: 0.5, ease: "power2.out" });
          } else {
            gsap.to(n, { scale: 0.92, y: 0, opacity: 0.35, duration: 0.5, ease: "power2.out" });
          }
        });
      };

      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        scrollTrigger: {
          trigger: section,
          start: pinStartAtTop(section),
          end: "+=340%",
          pin: stage,
          scrub: 0.8,
          refreshPriority: 1,
          onUpdate: (self) => {
            const p = self.progress;
            const draw = 0.12 + p * 0.86;
            rail.style.strokeDashoffset = String(total * (1 - Math.min(1, Math.max(0, draw))));
            const pt = path.getPointAtLength(total * Math.min(0.98, draw));
            gsap.set(dot, {
              left: pt.x + "%",
              top: (pt.y / VB_H) * 100 + "%",
              x: 0,
              y: 0,
              xPercent: -50,
              yPercent: -50,
            });
            const idx = p < 0.08 ? 0 : Math.min(3, Math.max(0, Math.floor((p - 0.08) / 0.24)));
            if (idx !== activeRef.current) {
              activeRef.current = idx;
              setActive(idx);
              settle(idx);
            }
          },
        },
      });

      // Continue the arrival glide to a full stop inside the pin.
      tl.fromTo(
        inner,
        { y: 16 },
        { y: 0, duration: 0.8, ease: "power2.out", immediateRender: false },
        0
      );

      nodes.forEach((node, i) => {
        tl.fromTo(
          node,
          { opacity: 0, scale: 0.72, filter: "blur(8px)" },
          { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.9 },
          1.2 + i * 2
        );
      });

      tl.fromTo(
        close,
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
        9.2
      );

      // Pre-release glide: drift up early, then fade out fully before the pin
      // releases, so the hand-off to the next section carries no snap.
      tl.to(inner, { y: -26, duration: 1, ease: "power1.in" }, 10.2);
      tl.to(
        inner,
        { opacity: 0, y: -70, filter: "blur(10px)", duration: 1.1, ease: "power2.in" },
        11
      );
    }, section);

    return () => ctx.revert();
  }, [pinned]);

  return (
    <section
      ref={sectionRef}
      className={cn("relative bg-ivory", pinned && "h-[420vh]")}
      id="about"
      data-section
      aria-label="Beyond English"
    >
      <div
        ref={stageRef}
        className={cn("relative overflow-hidden bg-ivory", pinned ? "h-screen" : "min-h-screen py-24")}
      >
        <div className="pointer-events-none absolute inset-0 grain" />
        <div className="aurora-blob right-[-18%] top-[-12%] h-[50vh] w-[50vh] bg-brand/12" />
        <div className="aurora-blob bottom-[-20%] left-[-14%] h-[48vh] w-[48vh] bg-brand-magenta/10" />

        <div
          data-about-inner
          className="relative flex h-full flex-col items-center justify-center px-6"
        >
          <div data-about-head className="flex flex-col items-center pb-8 text-center">
            <p className="mb-6 flex items-center gap-4 font-display text-[0.66rem] font-bold uppercase tracking-[0.42em] text-gold-deep">
              <span aria-hidden="true" className="h-px w-10 bg-gold/60" />
              About Language Hub
              <span aria-hidden="true" className="h-px w-10 bg-gold/60" />
            </p>
            <h2 className="font-display text-[clamp(2.6rem,8vw,6.5rem)] font-extrabold leading-none tracking-[-0.03em]">
              <span className="text-outline mr-4">BEYOND</span>
              <span className="brand-text">ENGLISH.</span>
            </h2>
            <p className="mt-6 max-w-xl text-balance text-[1.05rem] leading-relaxed text-ink-2">
              English is not an end in itself. At Language Hub, it becomes a
              doorway to a broader life — a skill that travels with you
              everywhere.
            </p>
          </div>

          {pinned ? (
            <div className="relative grid w-full max-w-6xl grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-center gap-8">
              <aside className="flex flex-col gap-6 pl-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[0.62rem] font-bold tracking-[0.32em] text-gold-deep">
                    PHASE {String(active + 1).padStart(2, "0")} / 04
                  </span>
                  <span aria-hidden="true" className="h-px flex-1 bg-line" />
                </div>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -14 }}
                    transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                  >
                    <h3
                      className="font-display text-[clamp(2.4rem,4.6vw,4rem)] font-extrabold leading-[0.95] tracking-tight"
                      style={{ color: WORDS[active].accent }}
                    >
                      {WORDS[active].word}
                    </h3>
                    <p className="mt-4 max-w-sm text-[1rem] leading-relaxed text-ink-2">{WORDS[active].note}</p>
                  </motion.div>
                </AnimatePresence>
                <div className="flex max-w-xs gap-1.5" aria-hidden="true">
                  {WORDS.map((w, i) => (
                    <span
                      key={w.word}
                      className="h-1 flex-1 rounded-full transition-colors duration-500"
                      style={{ backgroundColor: i <= active ? w.accent : "rgb(34 30 43 / 0.08)" }}
                    />
                  ))}
                </div>
              </aside>

              <div className="relative h-[44vh] rounded-3xl border border-line bg-white/35 p-3 shadow-card backdrop-blur-sm">
                <div
                  aria-hidden="true"
                  className="bg-grid absolute inset-3 rounded-2xl"
                  style={{
                    maskImage: "radial-gradient(ellipse at center, black 55%, transparent 100%)",
                    WebkitMaskImage: "radial-gradient(ellipse at center, black 55%, transparent 100%)",
                  }}
                />
                <div className="relative h-full w-full">
                  <svg
                    viewBox="0 0 100 46"
                    preserveAspectRatio="none"
                    className="absolute inset-0 h-full w-full overflow-visible"
                    aria-hidden="true"
                  >
                    <path
                      ref={pathRef}
                      d="M 10,38 C 32,30 38,10 50,18 S 76,6 90,8"
                      fill="none"
                      stroke="rgb(34 30 43 / 0.08)"
                      strokeWidth="0.7"
                      strokeLinecap="round"
                    />
                    <path
                      ref={railRef}
                      d="M 10,38 C 32,30 38,10 50,18 S 76,6 90,8"
                      fill="none"
                      stroke="url(#aboutgrad)"
                      strokeWidth="0.9"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="aboutgrad" x1="0" y1="1" x2="1" y2="0">
                        <stop offset="0%" stopColor="#6e5ae0" />
                        <stop offset="45%" stopColor="#2bb3d8" />
                        <stop offset="100%" stopColor="#d63a8c" />
                      </linearGradient>
                    </defs>
                  </svg>

                  <div ref={dotRef} className="pointer-events-none absolute left-0 top-0 z-20 h-3.5 w-3.5">
                    <span className="absolute inset-0 m-auto h-3.5 w-3.5 rounded-full border-2 border-gold/70 animate-pulse-ring svg-node" />
                    <span className="absolute inset-0 m-auto h-3 w-3 rounded-full bg-gold shadow-[0_0_22px_6px_rgb(194_160_92/0.45)]" />
                  </div>

                  {WORDS.map((w, i) => (
                    <div key={w.word} data-about-node className="absolute left-0 top-0 z-10 opacity-0">
                      <div
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl border px-3 py-2 backdrop-blur-md transition-all duration-500",
                          active === i ? "border-ink/15 bg-white/90 shadow-card" : "border-line bg-white/55"
                        )}
                      >
                        <span className="font-mono text-[0.6rem] font-bold tracking-[0.22em]" style={{ color: w.accent }}>
                          0{i + 1}
                        </span>
                        <span
                          className={cn(
                            "font-display text-sm font-extrabold tracking-tight transition-colors duration-500",
                            active === i ? "text-ink" : "text-ink-3"
                          )}
                        >
                          {w.word}
                        </span>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: w.accent }} />
                      </div>
                    </div>
                  ))}
                </div>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-2.5 right-4 font-mono text-[0.58rem] font-bold tracking-[0.28em] text-ink-3/70"
                >
                  TRACK {String(active + 1).padStart(2, "0")} · {WORDS[active].word.toUpperCase()}
                </span>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-3xl space-y-6">
              {WORDS.map((w, i) => (
                <motion.div
                  key={w.word}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-12% 0px" }}
                  transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                  className="relative overflow-hidden rounded-2xl border border-line bg-white/60 p-6 pl-7"
                >
                  <span aria-hidden="true" className="absolute left-0 top-0 h-full w-1" style={{ backgroundColor: w.accent }} />
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-display text-xl font-extrabold tracking-tight text-ink">{w.word}</h3>
                    <span className="font-mono text-[0.62rem] font-bold tracking-[0.25em]" style={{ color: w.accent }}>
                      0{i + 1} / 04
                    </span>
                  </div>
                  <p className="mt-1 text-[0.9rem] leading-relaxed text-ink-2">{w.note}</p>
                </motion.div>
              ))}
            </div>
          )}

          <div
            data-about-close
            className={cn(
              "mt-6 flex max-w-xl flex-col items-center gap-3 text-center",
              pinned ? "opacity-0" : ""
            )}
          >
            <span aria-hidden="true" className="h-px w-24 gold-underline" />
            <p className="font-serif text-[clamp(1.05rem,1.8vw,1.35rem)] italic leading-relaxed text-ink-2">
              In every lesson, we are not just teaching a language —
              we are widening what a person believes they can do.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}