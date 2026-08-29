"use client";

import { useLayoutEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap, pinStartAtTop } from "@/lib/scroll";
import { useIsTouch, useMediaQuery, usePrefersReducedMotion } from "@/lib/hooks";
import { Magnetic } from "@/components/ui/Magnetic";
import { Logo } from "@/components/ui/Logo";
import { Particles } from "@/components/ui/Particles";
import { scrollToId } from "@/lib/lenis";
import { cn } from "@/lib/utils";

const MILESTONES = [
  { label: "EXPLORED", tone: "#8f7ae8" },
  { label: "DISCOVERED", tone: "#63cfea" },
  { label: "TRANSFORMED", tone: "#e567a8" },
  { label: "READY", tone: "#c2a05c" },
];

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const scrambleIn = (el: HTMLElement, target: string, color: string) => {
  const letters = target.split("");
  el.innerHTML = "";
  el.style.color = color;
  letters.forEach((ch) => {
    const span = document.createElement("span");
    span.className = "inline-block will-change-transform";
    span.textContent = ch;
    el.appendChild(span);
  });
  const spans = el.querySelectorAll("span");
  letters.forEach((finalCh, i) => {
    const totalFrames = 6 + i * 2;
    let frame = 0;
    const id = setInterval(() => {
      frame++;
      if (frame >= totalFrames) {
        spans[i].textContent = finalCh;
        clearInterval(id);
        return;
      }
      spans[i].textContent = CHARS[Math.floor(Math.random() * 26)];
    }, 25);
  });
};

export function FinalScene() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const isTouch = useIsTouch();
  const reduced = usePrefersReducedMotion();
  const wide = useMediaQuery("(min-width: 1024px)");
  const pinned = wide && !isTouch && !reduced;

  useLayoutEffect(() => {
    if (!pinned) return;
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;

    const ctx = gsap.context(() => {
      const threadLine = stage.querySelector<HTMLElement>("[data-f-thread]");
      const nodes = gsap.utils.toArray<HTMLElement>("[data-f-node]");
      const nodeLabels = gsap.utils.toArray<HTMLElement>("[data-f-nlabel]");
      const nodeIdx = stage.querySelector("[data-f-node-idx]");
      const finalLine = stage.querySelector("[data-f-final]");
      const brand = stage.querySelector("[data-f-brand]");
      const cta = stage.querySelector("[data-f-cta]");
      const closeQuote = stage.querySelector("[data-f-quote]");

      if (threadLine) gsap.set(threadLine, { scaleX: 0 });

      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        scrollTrigger: {
          trigger: section,
          start: pinStartAtTop(section),
          end: "+=360%",
          pin: stage,
          scrub: 0.8,
          anticipatePin: 1,
          refreshPriority: 1,
        },
      });

      // Phase 1 (t=0–0.25): Thread line draws
      tl.to(threadLine, { scaleX: 1, duration: 0.25, ease: "power2.inOut" }, 0);

      // Phase 2 (t=0.20–0.58): Nodes light up sequentially
      MILESTONES.forEach((m, i) => {
        const t = 0.20 + i * 0.10;
        tl.fromTo(
          nodes[i],
          { scale: 0.3, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.10, ease: "back.out(2)" },
          t
        );
        tl.fromTo(
          nodeLabels[i],
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.08 },
          t + 0.03
        );
        // node index counter
        tl.add(() => {
          if (nodeIdx) nodeIdx.textContent = `${String(i + 1).padStart(2, "0")} / 04`;
        }, t + 0.04);
      });

      // Phase 3 (t=0.60–0.80): Nodes + thread fade, final text reveals
      tl.to([...nodes, ...nodeLabels], { opacity: 0, scale: 0.6, duration: 0.12 }, 0.58);
      tl.to(threadLine, { opacity: 0, duration: 0.08 }, 0.60);
      if (nodeIdx) tl.to(nodeIdx, { opacity: 0, duration: 0.04 }, 0.58);

      tl.add(() => {
        if (finalLine) scrambleIn(finalLine as HTMLElement, "YOUR STORY", "#c2a05c");
      }, 0.68);
      tl.fromTo(
        finalLine,
        { opacity: 0, scale: 0.88, filter: "blur(12px)" },
        { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.18, ease: "expo.out" },
        0.68
      );

      // Phase 4 (t=0.82–1.0): Brand + CTAs
      tl.fromTo(
        brand,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.12 },
        0.82
      );
      tl.fromTo(
        cta,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.10 },
        0.88
      );
      tl.fromTo(
        closeQuote,
        { opacity: 0 },
        { opacity: 1, duration: 0.10 },
        0.92
      );
    }, section);

    return () => ctx.revert();
  }, [pinned]);

  return (
    <section
      ref={sectionRef}
      className={cn("relative bg-night text-ivory", pinned && "h-[440vh]")}
      id="hub"
      data-section
      aria-label="The language hub"
    >
      <div
        ref={stageRef}
        className={cn("relative overflow-hidden bg-night", pinned ? "h-screen" : "min-h-screen py-28")}
      >
        <div className="pointer-events-none absolute inset-0 grain" />
        <div className="aurora-blob left-[-14%] top-[-16%] h-[50vh] w-[50vh] bg-brand/18" />
        <div className="aurora-blob bottom-[-20%] right-[-12%] h-[52vh] w-[52vh] bg-gold/12" />
        <Particles count={40} color="194, 160, 92" speed={0.15} />

        {/* Grid backdrop */}
        <div
          aria-hidden="true"
          className="bg-grid-dark pointer-events-none absolute inset-0"
          style={{
            maskImage: "radial-gradient(ellipse at center, black 25%, transparent 68%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 25%, transparent 68%)",
          }}
        />

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          {pinned ? (
            <>
              {/* Phase counter */}
              <p data-f-node-idx className="absolute left-8 top-8 font-mono text-[0.6rem] font-bold uppercase tracking-[0.4em] text-ivory/40">
                00 / 04
              </p>

              {/* Thread + nodes */}
              <div className="relative flex w-full max-w-3xl flex-col items-center">
                {/* Thread line */}
                <div
                  data-f-thread
                  className="absolute left-0 right-0 top-1/2 h-px origin-left bg-gradient-to-r from-gold/0 via-gold/60 to-gold/0"
                />

                {/* Nodes */}
                <div className="relative z-10 flex w-full items-center justify-between px-8">
                  {MILESTONES.map((m, i) => (
                    <div key={m.label} className="flex flex-col items-center gap-3">
                      <div
                        data-f-node
                        className="flex h-12 w-12 items-center justify-center rounded-full border-2 opacity-0"
                        style={{ borderColor: m.tone, boxShadow: `0 0 20px ${m.tone}33` }}
                      >
                        <span className="font-mono text-[0.55rem] font-bold" style={{ color: m.tone }}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <span
                        data-f-nlabel
                        className="font-display text-[0.65rem] font-bold uppercase tracking-[0.25em] opacity-0"
                        style={{ color: m.tone }}
                      >
                        {m.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final reveal */}
              <h2
                data-f-final
                className="mt-20 font-display text-[clamp(3rem,10vw,8rem)] font-extrabold leading-none tracking-[-0.03em] opacity-0"
              />

              {/* Brand + CTA */}
              <div data-f-brand className="mt-10 flex flex-col items-center gap-4 opacity-0">
                <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_20px_50px_-20px_rgb(0_0_0/0.7)]">
                  <Logo size="sm" eager />
                </span>
                <p className="font-display text-[clamp(1.4rem,3.6vw,2.4rem)] font-extrabold tracking-[0.02em]">
                  LANGUAGE<span className="gold-text"> HUB</span>
                </p>
                <p className="font-display text-[0.62rem] font-bold uppercase tracking-[0.5em] text-ivory/50">
                  Hub of Language Excellence
                </p>
              </div>

              <div data-f-cta className="mt-8 flex flex-wrap items-center justify-center gap-4 opacity-0">
                <Magnetic>
                  <button
                    type="button"
                    onClick={() => scrollToId("courses")}
                    className="group inline-flex h-[3.1rem] items-center gap-3 rounded-full bg-ivory px-8 font-display text-[0.92rem] font-bold text-ink transition-all duration-500 hover:bg-gold-light hover:shadow-[0_18px_50px_-16px_rgb(194_160_92/0.5)]"
                  >
                    Explore Courses
                    <span className="inline-block transition-transform duration-500 group-hover:translate-x-1.5">→</span>
                  </button>
                </Magnetic>
                <Magnetic>
                  <button
                    type="button"
                    onClick={() => scrollToId("home")}
                    className="inline-flex h-[3.1rem] items-center rounded-full border border-ivory/25 px-8 font-display text-[0.92rem] font-bold text-ivory transition-all duration-500 hover:border-gold/60 hover:text-gold-light"
                  >
                    Replay the Story
                  </button>
                </Magnetic>
              </div>

              <p data-f-quote className="absolute bottom-8 left-1/2 w-max -translate-x-1/2 font-serif text-[0.88rem] italic text-ivory/40 opacity-0">
                Language changes what you can express. What you express can change where you go.
              </p>
            </>
          ) : (
            <>
              <p className="mb-8 font-mono text-[0.6rem] font-bold uppercase tracking-[0.4em] text-gold/60">
                04 / 04
              </p>

              <div className="space-y-3">
                {MILESTONES.map((m, i) => (
                  <motion.div
                    key={m.label}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-8% 0px" }}
                    transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                    className="flex items-center gap-4"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2" style={{ borderColor: m.tone }}>
                      <span className="font-mono text-[0.5rem] font-bold" style={{ color: m.tone }}>{String(i + 1).padStart(2, "0")}</span>
                    </span>
                    <span className="font-display text-[0.7rem] font-bold uppercase tracking-[0.25em]" style={{ color: m.tone }}>{m.label}</span>
                  </motion.div>
                ))}
              </div>

              <motion.h2
                initial={{ opacity: 0, scale: 0.9, filter: "blur(12px)" }}
                whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                className="mt-16 font-display text-[clamp(2.8rem,9vw,6rem)] font-extrabold leading-none tracking-[-0.03em] gold-text"
              >
                YOUR STORY
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                className="mt-10 flex flex-col items-center gap-4"
              >
                <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_20px_50px_-16px_rgb(0_0_0/0.6)]">
                  <Logo size="sm" eager />
                </span>
                <p className="font-display text-[1.5rem] font-extrabold tracking-[0.02em]">
                  LANGUAGE<span className="gold-text"> HUB</span>
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.8, delay: 0.28, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                className="mt-8 flex flex-wrap items-center justify-center gap-4"
              >
                <button
                  type="button"
                  onClick={() => scrollToId("courses")}
                  className="group inline-flex h-[3.1rem] items-center gap-3 rounded-full bg-ivory px-7 font-display text-[0.92rem] font-bold text-ink transition-all duration-500 hover:bg-gold-light"
                >
                  Explore Courses
                  <span className="inline-block transition-transform duration-500 group-hover:translate-x-1.5">→</span>
                </button>
                <button
                  type="button"
                  onClick={() => scrollToId("home")}
                  className="inline-flex h-[3.1rem] items-center rounded-full border border-ivory/25 px-7 font-display text-[0.92rem] font-bold text-ivory transition-all duration-500 hover:border-gold/60 hover:text-gold-light"
                >
                  Replay the Story
                </button>
              </motion.div>

              <p className="mt-10 font-serif text-[0.88rem] italic text-ivory/50">
                Language changes what you can express. What you express can change where you go.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
