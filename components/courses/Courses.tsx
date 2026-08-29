"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from "framer-motion";
import { SpokenScene } from "@/components/courses/SpokenScene";
import { IeltsScene } from "@/components/courses/IeltsScene";
import { PteScene } from "@/components/courses/PteScene";
import { DuolingoScene } from "@/components/courses/DuolingoScene";
import { useMediaQuery, usePrefersReducedMotion } from "@/lib/hooks";
import { scrollToId } from "@/lib/lenis";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

interface SceneProps {
  progress: MotionValue<number> | null;
  start: number;
  end: number;
}

const PANELS = 5;
const SCENES: { k: number; Scene: ComponentType<SceneProps> }[] = [
  { k: 1, Scene: SpokenScene },
  { k: 2, Scene: IeltsScene },
  { k: 3, Scene: PteScene },
  { k: 4, Scene: DuolingoScene },
];

const DOTS = [
  { label: "Intro", tone: "#6e5ae0" },
  { label: "Spoken English", tone: "#6e5ae0" },
  { label: "IELTS", tone: "#2bb3d8" },
  { label: "PTE", tone: "#d63a8c" },
  { label: "Duolingo", tone: "#2e9e6b" },
];

function SceneSlot({ k, progress }: { k: number; progress: MotionValue<number> }) {
  const p = useTransform(
    progress,
    [k / PANELS + 0.008, (k + 1) / PANELS - 0.008],
    [0, 1],
    { clamp: true }
  );
  // Depth treatment: panels away from the resting point dim, scale down and
  // drift slightly against the travel direction — gives the gallery real
  // parallax depth instead of a flat slide.
  const pos = useTransform(progress, (v) => v * PANELS - k);
  const abs = useTransform(pos, (v) => Math.min(1, Math.abs(v)));
  const depthScale = useTransform(abs, [0, 1], [1, 0.93]);
  const depthOpacity = useTransform(abs, [0, 1], [1, 0.45]);
  const parallax = useTransform(pos, (v) => v * -70);
  const { Scene } = SCENES[k - 1];
  return (
    <motion.div
      className="relative h-full w-screen shrink-0"
      style={{ scale: depthScale, opacity: depthOpacity }}
    >
      <motion.div className="h-full w-full" style={{ x: parallax }}>
        <Scene progress={p} start={0} end={1} />
      </motion.div>
    </motion.div>
  );
}

export function Courses() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const desktop = useMediaQuery("(min-width: 1024px)");
  const reduced = usePrefersReducedMotion();
  const pinned = desktop && !reduced;
  const [maxX, setMaxX] = useState(0);
  const [dot, setDot] = useState(0);
  const { t } = useLang();

  useEffect(() => {
    if (!pinned) return;
    const el = trackRef.current;
    if (!el) return;
    const update = () =>
      setMaxX(Math.max(0, el.offsetWidth - (el.parentElement?.clientWidth ?? 0)));
    const raf = window.requestAnimationFrame(update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      window.cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [pinned]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Step the gallery one panel at a time: it stops on each course, the
  // course's animation plays out fully, then a spring carries it to the next.
  const step = useTransform(scrollYProgress, (v) =>
    Math.min(PANELS - 1, Math.max(0, Math.floor(v * PANELS)))
  );
  const stepX = useTransform(step, (s) => -maxX * (s / (PANELS - 1)));
  const x = useSpring(stepX, { stiffness: 165, damping: 27, mass: 1 });

  // Velocity-aware skew: the track tilts a touch while travelling between
  // courses and settles flat as it comes to rest.
  const xV = useVelocity(x);
  const skewRaw = useTransform(xV, [-2600, 2600], [3.2, -3.2], { clamp: true });
  const skewX = useSpring(skewRaw, { stiffness: 230, damping: 32 });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const idx = Math.min(PANELS - 1, Math.max(0, Math.round(v * (PANELS - 1))));
    setDot(idx);
  });

  const intro = (
    <div className="relative flex h-[100svh] min-h-[640px] w-screen shrink-0 flex-col items-center justify-center overflow-hidden px-6 py-20 text-center sm:px-12">
      <div className="pointer-events-none absolute inset-0 bg-ivory" />
      <div className="pointer-events-none absolute inset-0 grain" />
      <div className="aurora-blob left-[-14%] top-[-16%] h-[48vh] w-[48vh] bg-brand/15" />
      <div className="aurora-blob bottom-[-20%] right-[-12%] h-[50vh] w-[50vh] bg-brand-magenta/12" />

      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ opacity: 0, y: 34 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      >
        <p className="mb-6 flex items-center gap-4 font-display text-[0.66rem] font-bold uppercase tracking-[0.42em] text-gold-deep">
          <span aria-hidden="true" className="h-px w-10 bg-gold/60" />
          {t("coursesEyebrow")}
          <span aria-hidden="true" className="h-px w-10 bg-gold/60" />
        </p>
        <h2 className="font-display text-[clamp(2.4rem,7vw,5.6rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-ink">
          {t("coursesTitleA")}
          <br />
          <span className="brand-text">{t("coursesTitleB")}</span>
        </h2>
        <p className="mt-7 max-w-lg text-balance text-[1.02rem] leading-relaxed text-ink-2">
          {t("coursesIntro")}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {DOTS.slice(1).map((d) => (
            <span
              key={d.label}
              className="rounded-full border border-ink/12 px-4 py-1.5 font-display text-[0.68rem] font-bold uppercase tracking-[0.18em]"
              style={{ color: d.tone }}
            >
              {d.label}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => scrollToId("resources")}
          className="mt-10 inline-flex h-[3.1rem] items-center gap-3 rounded-full bg-ink px-8 font-display text-[0.92rem] font-bold text-ivory transition-all duration-500 hover:bg-brand-deep"
        >
          {t("coursesCta")}
          <span className="inline-block transition-transform duration-500 group-hover:translate-y-0.5">↓</span>
        </button>
      </motion.div>
    </div>
  );

  return (
    <section
      ref={sectionRef}
      id="courses"
      data-section
      className={cn("relative", pinned ? "h-[700vh]" : "bg-ivory")}
      aria-label="Courses"
    >
      <div className={cn("relative overflow-hidden bg-ivory", pinned && "sticky top-0 h-screen")}>
        <motion.div
          ref={trackRef}
          data-track
          data-cursor="explore"
          className="flex h-full w-max"
          style={{ x: pinned ? x : undefined, skewX: pinned ? skewX : undefined, flexDirection: pinned ? "row" : "column" }}
          aria-label="Course gallery — scroll to explore"
        >
          {intro}
          {SCENES.map(({ k, Scene }) =>
            pinned ? (
              <SceneSlot key={k} k={k} progress={scrollYProgress} />
            ) : (
              <Scene key={k} progress={null} start={0} end={1} />
            )
          )}
        </motion.div>

        {pinned && (
          <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-4">
            {DOTS.map((d, i) => (
              <span
                key={d.label}
                className={cn(
                  "h-2 rounded-full transition-all duration-500",
                  i === dot ? "w-7 opacity-100" : "w-2 opacity-40"
                )}
                style={{ backgroundColor: d.tone }}
                aria-hidden="true"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}