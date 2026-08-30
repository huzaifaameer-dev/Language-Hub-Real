"use client";

import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { gsap, pinStartAtTop } from "@/lib/scroll";
import { useIsTouch, useMediaQuery, usePrefersReducedMotion } from "@/lib/hooks";
import { scrollToId } from "@/lib/lenis";
import { Magnetic } from "@/components/ui/Magnetic";
import { Particles } from "@/components/ui/Particles";
import { WhatsAppCta } from "@/components/ui/WhatsAppCta";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

const WORDS = [
  { text: "SPEAK", left: "5%", top: "17%", size: "clamp(0.75rem,1.8vw,1.45rem)", tx: "19vw", ty: "-6vh", tone: "text-brand" },
  { text: "WRITE", left: "87%", top: "13%", size: "clamp(0.75rem,1.8vw,1.45rem)", tx: "-17vw", ty: "-4vh", tone: "text-brand-cyan" },
  { text: "THINK", left: "7%", top: "76%", size: "clamp(0.75rem,1.8vw,1.45rem)", tx: "17vw", ty: "-10vh", tone: "text-brand-magenta" },
  { text: "LEARN", left: "85%", top: "73%", size: "clamp(0.75rem,1.8vw,1.45rem)", tx: "-19vw", ty: "-6vh", tone: "text-brand-fern" },
  { text: "EXPRESS", left: "80%", top: "43%", size: "clamp(0.75rem,1.8vw,1.45rem)", tx: "-15vw", ty: "0vh", tone: "text-gold-deep" },
];

const SPARKS = Array.from({ length: 14 }, (_, i) => {
  const a = (i / 14) * Math.PI * 2;
  const r = 24 + ((i * 7) % 13);
  return {
    left: `${50 + Math.cos(a) * r}%`,
    top: `${48 + Math.sin(a) * r * 0.72}%`,
    tone: i % 3 === 0 ? "#c2a05c" : i % 3 === 1 ? "#6e5ae0" : "#2bb3d8",
    delay: ((i * 0.09) % 0.55).toFixed(2),
    dx: Math.round(Math.cos(a) * (40 + ((i * 13) % 50))),
    dy: Math.round(Math.sin(a) * (40 + ((i * 13) % 50))),
  };
});

const charSpans = (text: string, className?: string) =>
  text.split("").map((ch, i) => (
    <span key={`${text}-${i}`} data-char className={cn("inline-block will-change-transform", className)}>
      {ch}
    </span>
  ));

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const restRef = useRef(true);
  const isTouch = useIsTouch();
  const reduced = usePrefersReducedMotion();
  const wide = useMediaQuery("(min-width: 1024px)");
  const motionActive = wide && !isTouch && !reduced;
  const { t } = useLang();

  useLayoutEffect(() => {
    if (!motionActive) return;
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;

    const ctx = gsap.context(() => {
      const words = gsap.utils.toArray<HTMLElement>("[data-word]");
      const line1 = gsap.utils.toArray<HTMLElement>("[data-line-1] [data-char]");
      const line2 = gsap.utils.toArray<HTMLElement>("[data-line-2] [data-char]");
      const eyebrow = stage.querySelector("[data-eyebrow]");
      const meta = stage.querySelector("[data-meta]");
      const cta = stage.querySelectorAll("[data-cta]");
      const cue = stage.querySelector("[data-cue]");
      const side = stage.querySelector("[data-side]");
      const statement = stage.querySelector("[data-statement]");
      const glow = stage.querySelector("[data-glow]");
      const celebrate = stage.querySelector("[data-celebrate]");

      // ---- Welcome entrance: plays when the intro curtain lifts (time-based),
      // so the hero comes alive the moment the page opens — never empty. ----
      const ent = gsap.timeline({ defaults: { ease: "power3.out" }, paused: true });
      ent.fromTo(
        words,
        { opacity: 0, scale: 0.75, y: 40 },
        { opacity: 0.65, scale: 1, y: 0, duration: 1, stagger: 0.05 },
        0
      )
        .fromTo(
          eyebrow,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.8 },
          0.1
        )
        .fromTo(
          line1,
          { yPercent: 115, opacity: 0, rotateX: -45 },
          { yPercent: 0, opacity: 1, rotateX: 0, duration: 1.1, stagger: 0.035, ease: "expo.out" },
          0.18
        )
        .fromTo(
          line2,
          { yPercent: 115, opacity: 0, rotateX: -45 },
          { yPercent: 0, opacity: 1, rotateX: 0, duration: 1.1, stagger: 0.035, ease: "expo.out" },
          0.34
        )
        .fromTo(meta, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, 0.5)
        .fromTo(cta, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.12 }, 0.6)
        .fromTo(cue, { opacity: 0 }, { opacity: 1, duration: 0.8 }, 0.75)
        .fromTo(glow, { opacity: 0.12, scale: 0.8 }, { opacity: 0.35, scale: 1, duration: 1.6 }, 0.6)
        .fromTo(celebrate, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 1.35)
        .to(celebrate, { opacity: 0, duration: 0.9 }, 3.4);

      const playWelcome = () => {
        stage.querySelectorAll<HTMLElement>(".spark").forEach((s) => {
          s.style.animationPlayState = "running";
        });
        if (window.scrollY > 10) {
          ent.progress(1);
          return;
        }
        if (!ent.isActive()) ent.play();
      };
      window.addEventListener("lh:intro-done", playWelcome, { once: true });
      if (!document.querySelector("main")?.hasAttribute("inert")) playWelcome();

      // ---- Scroll narrative: the title flies apart, then hands over to the
      // Transformation section. Scrubbed to the pin. ----
      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        scrollTrigger: {
          trigger: section,
          start: pinStartAtTop(section),
          end: "+=340%",
          pin: stage,
          scrub: 0.8,
          anticipatePin: 1,
          refreshPriority: 1,
          onUpdate: (self) => {
            const p = self.progress;
            if (p > 0.02 && ent.progress() < 1) ent.progress(1);
            if (p > 0.08) {
              restRef.current = false;
            } else if (p < 0.01 && !restRef.current) {
              restRef.current = true;
              gsap.delayedCall(1.1, () => {
                if (window.scrollY <= self.start + 4) {
                  gsap.set(words, { opacity: 0.65, scale: 1 });
                  gsap.set(line1, { opacity: 1, x: 0, y: 0, yPercent: 0, rotateX: 0, filter: "none" });
                  gsap.set(line2, { opacity: 1, scale: 1, y: 0, filter: "none" });
                  gsap.set(meta, { opacity: 1, y: 0 });
                  gsap.set(cta, { opacity: 1, y: 0 });
                  gsap.set(cue, { opacity: 1 });
                  gsap.set(side, { opacity: 1 });
                  gsap.set(statement, { opacity: 0, y: 0, filter: "blur(0px)" });
                  gsap.set(glow, { opacity: 0.35, scale: 1 });
                  gsap.set(stage, { clearProps: "backgroundColor" });
                }
              });
            }
          },
        },
      });

      tl.fromTo(
        words,
        { x: 0, y: 0 },
        {
          x: (i) => WORDS[i].tx,
          y: (i) => WORDS[i].ty,
          duration: 2.2,
          ease: "expo.inOut",
          immediateRender: false,
        },
        0
      )
        .to(glow, { opacity: 0.5, scale: 1.35, duration: 2 }, 0.1);

      tl.fromTo(
        line1,
        { x: 0, y: 0, opacity: 1, filter: "blur(0px)" },
        {
          x: (i) => (i % 2 === 0 ? -34 : 34),
          y: -64,
          opacity: 0,
          filter: "blur(8px)",
          duration: 1.3,
          stagger: 0.02,
          ease: "power2.in",
          immediateRender: false,
        },
        1.4
      )
        .fromTo(
          words,
          { opacity: 0.65, scale: 1 },
          {
            opacity: 0,
            scale: 0.55,
            duration: 1.2,
            stagger: 0.04,
            ease: "power2.in",
            immediateRender: false,
          },
          1.5
        )
        .to(line2, { scale: 1.16, duration: 1.5, ease: "expo.inOut" }, 1.4)
        .to(glow, { opacity: 0.9, scale: 1.7, duration: 1.6 }, 1.6);

      tl.fromTo(
        line2,
        { opacity: 1, y: 0, scale: 1.16 },
        {
          opacity: 0,
          y: -40,
          scale: 1.22,
          filter: "blur(10px)",
          duration: 1.3,
          stagger: 0.012,
          ease: "power2.in",
          immediateRender: false,
        },
        2.9
      )
        .fromTo(
          statement,
          { opacity: 0, y: 80, filter: "blur(14px)" },
          { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.6, ease: "expo.out" },
          3.1
        )
        .fromTo(meta, { opacity: 1, y: 0 }, { opacity: 0, y: -20, duration: 1, immediateRender: false }, 3.2)
        .fromTo(cta, { opacity: 1, y: 0 }, { opacity: 0, y: -24, duration: 1, immediateRender: false }, 3.3)
        .fromTo(cue, { opacity: 1 }, { opacity: 0, duration: 0.8, immediateRender: false }, 3.2)
        .fromTo(side, { opacity: 1 }, { opacity: 0, duration: 0.8, immediateRender: false }, 3.2)
        .to(glow, { opacity: 0.25, scale: 2, duration: 1.8 }, 3.3)
        .to(stage, { backgroundColor: "#f4efe6", duration: 2, ease: "none" }, 3.2);

      // Frame-out: fade the closing statement away as the pin hands off.
      tl.fromTo(
        statement,
        { opacity: 1, y: 0, filter: "blur(0px)" },
        { opacity: 0, y: -40, filter: "blur(10px)", duration: 1.1, ease: "power2.in", immediateRender: false },
        5.9
      );

      const layers = [
        { el: stage.querySelector("[data-line-1]"), depth: 7 },
        { el: stage.querySelector("[data-line-2]"), depth: 11 },
        { el: stage.querySelector("[data-statement]"), depth: 8 },
        { el: stage.querySelector("[data-meta]"), depth: 6 },
        { el: stage.querySelector("[data-cta]"), depth: 9 },
      ].filter((l): l is { el: HTMLElement; depth: number } => l.el !== null);
      const quicks = layers.map((l) => ({
        qx: gsap.quickTo(l.el, "xPercent", { duration: 0.8, ease: "power2.out" }),
        qy: gsap.quickTo(l.el, "yPercent", { duration: 0.8, ease: "power2.out" }),
        depth: l.depth,
      }));
      const wordLayer = stage.querySelector("[data-word-layer]");
      const wordQx = wordLayer ? gsap.quickTo(wordLayer, "x", { duration: 1.1, ease: "power2.out" }) : null;
      const wordQy = wordLayer ? gsap.quickTo(wordLayer, "y", { duration: 1.1, ease: "power2.out" }) : null;

      const onMove = (e: MouseEvent) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        for (let i = 0; i < quicks.length; i++) {
          const q = quicks[i];
          q.qx(nx * q.depth * 0.16);
          q.qy(ny * q.depth * 0.13);
        }
        wordQx?.(nx * 18);
        wordQy?.(ny * 12);
      };
      stage.addEventListener("mousemove", onMove);
    }, section);

    return () => ctx.revert();
  }, [motionActive]);

  const entrance = (delay: number) => ({
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.9,
      delay,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  });

  return (
    <section
      id="home"
      data-section
      ref={sectionRef}
      className="relative bg-ivory"
      aria-label="Welcome to Language Hub"
    >
      <div
        ref={stageRef}
        className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-ivory px-6"
      >
        <div className="aurora-blob left-[-12%] top-[-18%] h-[52vh] w-[52vh] bg-brand/20" />
        <div className="aurora-blob bottom-[-22%] right-[-12%] h-[56vh] w-[56vh] bg-brand-magenta/15" />
        <div className="aurora-blob left-[55%] top-[45%] h-[40vh] w-[40vh] bg-brand-cyan/10" />
        <div data-glow className="pointer-events-none absolute left-1/2 top-1/2 h-[68vmin] w-[68vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(110_90_224/0.1),transparent_65%)] opacity-30" />
        <div
          data-celebrate
          className="pointer-events-none absolute inset-0 opacity-0"
          aria-hidden="true"
        >
          {SPARKS.map((s, i) => (
            <span
              key={i}
              className="spark"
              style={
                {
                  left: s.left,
                  top: s.top,
                  background: s.tone,
                  animationDelay: `${0.05 + s.delay}s`,
                  animationPlayState: "paused",
                  "--sx": `${s.dx}px`,
                  "--sy": `${s.dy}px`,
                } as CSSProperties
              }
            />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-0 grain" />
        <Particles count={46} color="110, 90, 224" speed={0.14} />
        <Particles count={26} color="194, 160, 92" speed={0.2} />

        <div
          data-word-layer
          className="pointer-events-none absolute inset-0 hidden lg:block"
          aria-hidden="true"
        >
          {WORDS.map((w, i) => (
            <span
              key={w.text}
              data-word
              className={cn(
                "absolute font-display font-extrabold uppercase tracking-[0.14em]",
                w.tone,
                isTouch ? "animate-floaty opacity-85" : motionActive && "opacity-0"
              )}
              style={{
                left: w.left,
                top: w.top,
                fontSize: w.size,
                animationDelay: isTouch ? `${i * 0.7}s` : undefined,
                animationDuration: isTouch ? "12s" : undefined,
              }}
            >
              {w.text}
            </span>
          ))}
        </div>

        <motion.div
          {...entrance(0.15)}
          className="relative z-10 flex max-w-4xl flex-col items-center text-center"
        >
          <p
            data-eyebrow
            className={cn(
              "mb-6 flex items-center gap-4 font-display text-[0.68rem] font-bold uppercase tracking-[0.42em] text-gold-deep",
              motionActive && "opacity-0"
            )}
          >
            <span aria-hidden="true" className="h-px w-10 bg-gold/60" />
            {t("tagline")}
            <span aria-hidden="true" className="h-px w-10 bg-gold/60" />
          </p>

          <h1 className="font-display font-extrabold leading-[1.02] tracking-[-0.03em]">
            <span
              data-line-1
              className="block whitespace-nowrap text-[clamp(1.7rem,6.6vw,5.2rem)] text-ink"
              aria-label="MASTER THE LANGUAGE."
            >
              {charSpans("MASTER THE ")}
              {charSpans("LANGUAGE.", "brand-text")}
            </span>
            <span
              data-line-2
              className="mt-1 block whitespace-nowrap text-[clamp(1.7rem,6.6vw,5.2rem)] text-ink/85"
              aria-label="FIND YOUR VOICE."
            >
              {charSpans("FIND YOUR ")}
              {charSpans("VOICE.", "gold-text-shimmer")}
            </span>
          </h1>

          <div
            data-meta
            className={cn(
              "mt-8 flex flex-wrap items-center justify-center gap-2.5",
              motionActive && "opacity-0"
            )}
          >
            {["Spoken English", "IELTS", "PTE", "Duolingo"].map((course) => (
              <span
                key={course}
                className="rounded-full border border-ink/12 bg-white/60 px-4 py-1.5 font-display text-[0.7rem] font-bold uppercase tracking-[0.18em] text-ink-2"
              >
                {course}
              </span>
            ))}
          </div>

          <div
            data-cta
            className={cn(
              "mt-9 flex flex-wrap items-center justify-center gap-4",
              motionActive && "opacity-0"
            )}
          >
            <Magnetic>
              <button
                type="button"
                onClick={() => scrollToId("journey")}
                className="group inline-flex h-[3.2rem] items-center gap-3 rounded-full bg-ink px-8 font-display text-[0.95rem] font-bold text-ivory shadow-[0_18px_44px_-18px_rgb(34_30_43/0.6)] transition-all duration-500 hover:bg-brand-deep hover:shadow-[0_20px_50px_-18px_rgb(110_90_224/0.6)]"
              >
                {t("heroCtaJourney")}
                <span className="inline-block transition-transform duration-500 group-hover:translate-x-1.5">
                  →
                </span>
              </button>
            </Magnetic>
            <Magnetic>
              <button
                type="button"
                onClick={() => scrollToId("courses")}
                className="inline-flex h-[3.2rem] items-center rounded-full border border-ink/20 bg-transparent px-8 font-display text-[0.95rem] font-bold text-ink transition-all duration-500 hover:border-brand/60 hover:bg-brand/[0.04] hover:text-brand-deep"
              >
                {t("heroCtaCourses")}
              </button>
            </Magnetic>
            <WhatsAppCta />
          </div>
        </motion.div>

        <div
          data-statement
          className={cn(
            "pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 px-6 text-center",
            motionActive ? "opacity-0" : (isTouch || reduced) && "hidden"
          )}
        >
          <p className="font-display text-[clamp(1.5rem,4.4vw,3.4rem)] font-extrabold leading-tight tracking-[-0.02em] text-ink">
            {t("statementTitleA")}{" "}
            <span className="font-serif italic tracking-normal text-brand-magenta">
              {t("statementTitleB")}
            </span>
          </p>
          <span aria-hidden="true" className="h-px w-24 gold-underline" />
          <p className="max-w-md font-serif text-[1.05rem] italic leading-relaxed text-ink-3">
            {t("statementBody")}
          </p>
        </div>

        <motion.div
          {...entrance(1.4)}
          data-cue
          className={cn(
            "absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2.5",
            motionActive && "opacity-0"
          )}
        >
          <span className="font-display text-[0.6rem] font-bold uppercase tracking-[0.4em] text-ink-3">
            {t("heroScrollCue")}
          </span>
          <span className="relative flex h-11 w-7 items-start justify-center rounded-full border border-ink/20 p-1.5">
            <span className="h-2 w-1 rounded-full bg-brand animate-bob" />
          </span>
        </motion.div>

        <span
          data-side
          className="absolute right-6 top-1/2 hidden -translate-y-1/2 rotate-90 font-display text-[0.6rem] font-bold uppercase tracking-[0.5em] text-ink/30 xl:block"
        >
          {t("heroSideCue")}
        </span>
      </div>
    </section>
  );
}