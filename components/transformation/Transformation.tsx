"use client";

import { useLayoutEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap, pinStartAtTop } from "@/lib/scroll";
import { useMediaQuery, usePrefersReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const STEPS = [
  { word: "Thought", line: "An idea begins inside you." },
  { word: "Expression", line: "It finds the right words." },
  { word: "Communication", line: "Those words reach another person." },
  { word: "Confidence", line: "Speaking becomes natural." },
  { word: "Opportunity", line: "New doors begin to open." },
];

export function Transformation() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const desktop = useMediaQuery("(min-width: 1024px)");
  const reduced = usePrefersReducedMotion();
  const pinned = desktop && !reduced;

  useLayoutEffect(() => {
    if (!pinned) return;
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;

    const ctx = gsap.context(() => {
      const line = section.querySelector("[data-line]");
      const dot = section.querySelector("[data-dot]");
      const labels = gsap.utils.toArray<HTMLElement>("[data-step]");

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: pinStartAtTop(section),
          end: "+=180%",
          scrub: 0.7,
          pin: stage,
          anticipatePin: 1,
          refreshPriority: 1,
        },
      });

      tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 2.4 }, 0)
        .fromTo(
          dot,
          { left: "0%" },
          { left: "calc(100% - 18px)", duration: 2.4 },
          0
        );

      labels.forEach((label, i) => {
        tl.fromTo(
          label,
          { opacity: 0.16, y: 0, filter: "blur(0px)", scale: 1 },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            scale: 1,
            duration: 0.6,
            ease: "power2.out",
          },
          (i / labels.length) * 2.4 + 0.1
        );
      });
    }, section);

    return () => ctx.revert();
  }, [pinned]);

  return (
    <section
      ref={sectionRef}
      className={cn(
        "relative overflow-hidden bg-night text-ivory",
        pinned ? "h-[280vh]" : "pb-4"
      )}
      aria-label="How language transforms a learner"
    >
      <div
        ref={stageRef}
        className={cn(
          "flex w-full items-center justify-center px-6",
          pinned ? "h-screen" : "min-h-[80vh] py-24"
        )}
      >
        <div className="pointer-events-none absolute inset-0 grain" />
        <div className="aurora-blob right-[-15%] top-[-15%] h-[50vh] w-[50vh] bg-brand/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="ghost-word-light text-[clamp(8rem,26vw,20rem)]">LH</span>
        </div>

        <div className="relative w-full max-w-6xl">
          <motion.p
            data-chapter
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-25% 0px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="mb-16 flex items-center gap-4 font-display text-[0.68rem] font-bold uppercase tracking-[0.42em] text-gold-light"
          >
            <span aria-hidden="true" className="h-px w-10 bg-gold/50" />
            The Transformation
            <span aria-hidden="true" className="h-px w-10 bg-gold/50" />
          </motion.p>

          <div className="relative">
            <div className="relative h-px w-full bg-ivory/10">
              <div
                data-line
                className="absolute inset-0 origin-left bg-gradient-to-r from-brand via-brand-magenta to-gold"
              />
              <div
                data-dot
                className="absolute top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-full bg-gold shadow-[0_0_24px_6px_rgb(194_160_92/0.45)]"
              />
            </div>

            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
              {STEPS.map((step, i) => (
                <motion.div
                  key={step.word}
                  data-step
                  className="flex flex-col gap-2 text-left opacity-[0.16] lg:items-center lg:text-center"
                  initial={pinned ? undefined : { opacity: 0, y: 20 }}
                  whileInView={
                    pinned ? undefined : { opacity: 1, y: 0, transition: { delay: i * 0.12, duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } }
                  }
                  viewport={{ once: true, margin: "-15% 0px" }}
                >
                  <span className="font-display text-[0.62rem] font-bold tracking-[0.2em] text-gold/70">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-display text-[clamp(1.15rem,1.8vw,1.6rem)] font-extrabold tracking-tight text-ivory">
                    {step.word}
                  </span>
                  <span className="max-w-[16rem] text-[0.82rem] leading-relaxed text-ivory/55">
                    {step.line}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            data-divider
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20% 0px" }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="mt-20 flex items-center gap-6"
          >
            <span aria-hidden="true" className="h-px flex-1 bg-ivory/10" />
            <p className="text-center font-serif text-[clamp(1.1rem,2vw,1.5rem)] italic leading-relaxed text-ivory/80">
              Language becomes more than words — it becomes a way of being.
            </p>
            <span aria-hidden="true" className="h-px flex-1 bg-ivory/10" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}