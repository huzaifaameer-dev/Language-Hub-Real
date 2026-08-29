"use client";

import { useLayoutEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap, pinStartAtTop } from "@/lib/scroll";
import { useIsTouch, useMediaQuery, usePrefersReducedMotion } from "@/lib/hooks";
import { Particles } from "@/components/ui/Particles";
import { cn } from "@/lib/utils";

const LINES: { text: string; tail?: string; key?: { word: string; tx: string; ty: string; rot: number; tone: string } }[] = [
  { text: "Every idea begins as a", key: { word: "thought.", tx: "-14vw", ty: "-16vh", rot: -8, tone: "#8f7ae8" } },
  { text: "Every thought wants to become a", key: { word: "word.", tx: "16vw", ty: "-22vh", rot: 6, tone: "#63cfea" } },
  { text: "Every word wants to be", key: { word: "spoken.", tx: "-18vw", ty: "12vh", rot: 10, tone: "#e567a8" } },
  { text: "And every spoken word can change" },
  { text: "a moment — a", key: { word: "conversation", tx: "20vw", ty: "14vh", rot: -6, tone: "#dfc68d" }, tail: " — a life." },
];

const MORPHS = [
  { word: "STORIES", tone: "#8f7ae8", sub: "Narratives that move people." },
  { word: "EMOTIONS", tone: "#e567a8", sub: "The force behind every sentence." },
  { word: "TRUTH", tone: "#dfc68d", sub: "Spoken clearly, it changes rooms." },
  { word: "IMPACT", tone: "#63cfea", sub: "The echo of well-chosen words." },
];

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const scrambleWord = (el: HTMLElement, target: string, color: string, done: () => void) => {
  const letters = target.split("");
  el.innerHTML = "";
  letters.forEach((ch) => {
    const span = document.createElement("span");
    span.className = "inline-block will-change-transform";
    span.textContent = ch;
    span.style.color = color;
    el.appendChild(span);
  });
  const spans = el.querySelectorAll("span");
  let settled = 0;
  letters.forEach((finalCh, i) => {
    const totalFrames = 8 + i * 2;
    let frame = 0;
    const id = setInterval(() => {
      frame++;
      if (frame >= totalFrames) {
        spans[i].textContent = finalCh;
        settled++;
        clearInterval(id);
        if (settled === letters.length) done();
        return;
      }
      spans[i].textContent = CHARS[Math.floor(Math.random() * 26)];
    }, 28);
  });
};

export function Expression() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
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
      const head = stage.querySelector("[data-ex-head]");
      const para = stage.querySelector("[data-ex-para]");
      const segs = gsap.utils.toArray<HTMLElement>("[data-ex-seg]");
      const keys = gsap.utils.toArray<HTMLElement>("[data-ex-key]");
      const morphEl = stage.querySelector("[data-ex-morph-word]");
      const morphCounter = stage.querySelector("[data-ex-morph-counter]");
      const morphSub = stage.querySelector("[data-ex-morph-sub]");
      const scanLine = stage.querySelector("[data-ex-scan]");
      const close = stage.querySelector("[data-ex-close]");

      const showMorph = (i: number) => {
        const m = MORPHS[i];
        gsap.killTweensOf(morphEl);

        // Scan line sweep
        if (scanLine) {
          gsap.fromTo(scanLine, { y: "-100%", opacity: 0 }, { y: "200%", opacity: 1, duration: 0.5, ease: "power2.inOut", overwrite: true });
        }

        // Scramble decode
        scrambleWord(morphEl as HTMLElement, m.word, m.tone, () => {});

        // Counter
        if (morphCounter) morphCounter.textContent = `${String(i + 1).padStart(2, "0")} / 04`;

        // Subtitle
        if (morphSub) {
          gsap.fromTo(morphSub, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, delay: 0.3, ease: "power2.out", overwrite: true });
        }

        // Bracket color
        const frame = stage.querySelector<HTMLElement>("[data-ex-morph-frame]");
        if (frame) frame.style.setProperty("--bracket-color", m.tone);
      };
      showMorph(0);
      gsap.set(stack, { opacity: 0 });

      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        scrollTrigger: {
          trigger: section,
          start: pinStartAtTop(section),
          end: "+=440%",
          pin: stage,
          scrub: 0.8,
          anticipatePin: 1,
          refreshPriority: 1,
          onUpdate: (self) => {
            const p = self.progress;
            gsap.set(head, {
              opacity: p < 0.1 ? 1 : Math.max(0, 1 - (p - 0.1) / 0.12),
              y: p < 0.1 ? 0 : -30 * Math.min(1, (p - 0.1) / 0.12),
            });
            gsap.set(para, {
              opacity: p < 0.1 ? 1 : Math.max(0, 1 - (p - 0.1) / 0.1),
              y: p < 0.1 ? 0 : -18 * Math.min(1, (p - 0.1) / 0.1),
            });
            const idx = p < 0.52 ? 0 : p < 0.66 ? 1 : p < 0.8 ? 2 : 3;
            if (idx !== activeRef.current) {
              activeRef.current = idx;
              showMorph(idx);
            }
          },
        },
      });

      segs.forEach((seg) => {
        tl.fromTo(seg, { opacity: 1, scale: 1 }, { opacity: 0.12, scale: 0.94, duration: 0.25 }, 0.2);
      });

      keys.forEach((k, i) => {
        tl.to(
          k,
          {
            x: () => `${LINES[i].key?.tx ?? 0}`,
            y: () => `${LINES[i].key?.ty ?? 0}`,
            rotation: () => LINES[i].key?.rot ?? 0,
            scale: 1.7,
            duration: 0.35,
            ease: "expo.inOut",
          },
          0.18
        ).to(k, { opacity: 0, scale: 0.5, duration: 0.15, ease: "power2.in" }, 0.34);
      });

      tl.set(stack, { opacity: 1 }, 0.56)
        .to(stage, { backgroundColor: "#14111d", duration: 1.44, ease: "none" }, 0.56)
        .fromTo(close, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.3 }, 1.56);
    }, section);

    return () => ctx.revert();
  }, [pinned]);

  return (
    <section
      ref={sectionRef}
      className={cn("relative bg-[#1b1826] text-ivory", pinned && "h-[520vh]")}
      aria-label="Your words have power"
    >
      <div
        ref={stageRef}
        className={cn("relative overflow-hidden bg-[#1b1826]", pinned ? "h-screen" : "min-h-screen py-28")}
      >
        <div className="pointer-events-none absolute inset-0 grain" />
        <div className="aurora-blob left-[-16%] top-[-18%] h-[50vh] w-[50vh] bg-brand/20" />
        <div className="aurora-blob bottom-[-20%] right-[-14%] h-[52vh] w-[52vh] bg-brand-magenta/15" />
        <Particles count={34} color="214, 58, 140" speed={0.12} />
        <Particles count={20} color="194, 160, 92" speed={0.2} />

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <motion.div
            data-ex-head
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20% 0px" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="flex flex-col items-center"
          >
            <p className="mb-6 flex items-center gap-4 font-display text-[0.66rem] font-bold uppercase tracking-[0.42em] text-gold-light">
              <span aria-hidden="true" className="h-px w-10 bg-gold/50" />
              Creative Expression
              <span aria-hidden="true" className="h-px w-10 bg-gold/50" />
            </p>
            <h2 className="font-display text-[clamp(2rem,6.4vw,5.2rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
              YOUR WORDS <span className="gold-text">HAVE POWER.</span>
            </h2>
          </motion.div>

          {pinned ? (
            <>
              <motion.p
                data-ex-para
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-15% 0px" }}
                transition={{ duration: 0.9, delay: 0.12, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                className="mt-10 max-w-3xl font-display text-[clamp(1rem,2.1vw,1.55rem)] font-semibold leading-[1.7] tracking-tight text-ivory/85"
              >
                {LINES.map((line, li) => (
                  <span key={li} className="inline">
                    {line.key ? (
                      <>
                        <span data-ex-seg className="inline">{line.text} </span>
                        <span
                          data-ex-key={line.key.word}
                          data-ex-seg
                          className="inline-block"
                          style={{ color: line.key.tone, fontStyle: "italic" }}
                        >
                          {line.key.word}
                        </span>
                        {"tail" in line ? line.tail : null}{" "}
                      </>
                    ) : (
                      <span data-ex-seg className="inline">{line.text} </span>
                    )}
                  </span>
                ))}
              </motion.p>

              <div ref={stackRef} className="absolute inset-0 flex flex-col items-center justify-center opacity-0">
                {/* Grid backdrop */}
                <div
                  aria-hidden="true"
                  className="bg-grid-dark pointer-events-none absolute inset-0"
                  style={{
                    maskImage: "radial-gradient(ellipse at center, black 30%, transparent 72%)",
                    WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 72%)",
                  }}
                />

                {/* Counter */}
                <p data-ex-morph-counter className="relative mb-6 font-mono text-[0.6rem] font-bold uppercase tracking-[0.45em] text-gold/70">
                  01 / 04
                </p>

                {/* Morph word frame */}
                <div data-ex-morph-frame className="ex-bracket relative px-12 py-6" style={{ "--bracket-color": MORPHS[0].tone } as React.CSSProperties}>
                  {/* Scan line */}
                  <div
                    data-ex-scan
                    aria-hidden="true"
                    className="ex-scan pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden opacity-0"
                  >
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                  </div>

                  <h3
                    data-ex-morph-word
                    className="relative font-display text-[clamp(3rem,12vw,9.5rem)] font-extrabold leading-none tracking-[-0.03em]"
                  />
                </div>

                {/* Subtitle */}
                <p data-ex-morph-sub className="relative mt-5 font-serif text-[1rem] italic text-ivory/60 opacity-0">
                  {MORPHS[0].sub}
                </p>
              </div>

              <p data-ex-close className="absolute bottom-10 left-1/2 w-max -translate-x-1/2 font-serif text-[1.02rem] italic text-ivory/60 opacity-0">
                From inside you — out into the world.
              </p>
            </>
          ) : (
            <>
              <p className="mt-10 max-w-3xl font-display text-[clamp(1rem,2.1vw,1.55rem)] font-semibold leading-[1.7] tracking-tight text-ivory/85">
                {LINES.map((line, li) => (
                  <span key={li} className="inline">
                    {line.key ? (
                      <>
                        {line.text}{" "}
                        <span className="inline-block italic" style={{ color: line.key.tone }}>
                          {line.key.word}
                        </span>
                        {"tail" in line ? line.tail : null}{" "}
                      </>
                    ) : (
                      <>{line.text} </>
                    )}
                  </span>
                ))}
              </p>
              <div className="mt-12 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
                {MORPHS.map((m, i) => (
                  <motion.div
                    key={m.word}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-8% 0px" }}
                    transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                    className="ex-bracket relative rounded-2xl border border-ivory/10 bg-white/[0.03] p-7 text-left"
                    style={{ "--bracket-color": m.tone } as React.CSSProperties}
                  >
                    <p className="font-mono text-[0.55rem] font-bold uppercase tracking-[0.3em] text-ivory/30">
                      {String(i + 1).padStart(2, "0")} / 04
                    </p>
                    <p className="mt-2 font-display text-[2rem] font-extrabold tracking-tight" style={{ color: m.tone }}>
                      {m.word}
                    </p>
                    <p className="mt-1 font-serif text-[0.85rem] italic text-ivory/50">{m.sub}</p>
                  </motion.div>
                ))}
              </div>
              <p className="mt-10 font-serif text-[1.02rem] italic text-ivory/60">
                From inside you — out into the world.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
