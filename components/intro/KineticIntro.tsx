"use client";

import { useCallback, useEffect, useRef } from "react";
import { gsap } from "@/lib/scroll";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { Logo } from "@/components/ui/Logo";

interface KineticIntroProps {
  onComplete: () => void;
}

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function scrambleText(el: HTMLElement, text: string, duration: number, stagger = 0.045) {
  const perChar = duration / text.length + stagger;
  const totalMs = perChar * text.length * 1000;
  const start = performance.now();

  const ticker = (t: number) => {
    const elapsed = t - start;
    const settled = Math.min(text.length, Math.floor(elapsed / (perChar * 1000)));
    let out = "";
    for (let i = 0; i < text.length; i++) {
      out += i < settled || elapsed >= totalMs ? text[i] : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
    }
    el.textContent = out;
    if (elapsed >= totalMs) gsap.ticker.remove(ticker);
  };

  gsap.ticker.add(ticker);
  return () => gsap.ticker.remove(ticker);
}

export function KineticIntro({ onComplete }: KineticIntroProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const completed = useRef(false);

  const finish = useCallback(() => {
    if (completed.current) return;
    completed.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const wordA = root.querySelector<HTMLElement>('[data-intro="word-a"]');
    const wordB = root.querySelector<HTMLElement>('[data-intro="word-b"]');
    const wordC = root.querySelector<HTMLElement>('[data-intro="word-c"]');
    const tagA = root.querySelector<HTMLElement>('[data-intro="tag-a"]');
    const tagC = root.querySelector<HTMLElement>('[data-intro="tag-c"]');
    const logo = root.querySelector<HTMLElement>('[data-intro="logo"]');
    const dots = root.querySelectorAll<HTMLElement>('[data-intro="dot"]');

    const exit = () => {
      gsap.to(root, {
        yPercent: -100,
        duration: 0.9,
        ease: "power3.inOut",
        onComplete: finish,
      });
    };

    if (reduced) {
      const tl = gsap.timeline({ onComplete: finish });
      tl.fromTo(root, { opacity: 0 }, { opacity: 1, duration: 0.3 })
        .to(root, { opacity: 0, duration: 0.3, delay: 0.3 });
      return () => {
        tl.kill();
      };
    }

    const lettersA = wordA ? Array.from(wordA.children) : [];
    const lettersC = wordC ? Array.from(wordC.children) : [];

    const tl = gsap.timeline({ onComplete: exit });

    tl.fromTo(
      root,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: "power2.out" }
    )
      .fromTo(
        logo,
        { scale: 0.6, opacity: 0, rotate: -8 },
        { scale: 1, opacity: 1, rotate: 0, duration: 0.7, ease: "back.out(1.6)" },
        0.12
      )
      .fromTo(
        lettersA,
        { yPercent: 120, opacity: 0, rotateX: -60 },
        {
          yPercent: 0,
          opacity: 1,
          rotateX: 0,
          duration: 0.7,
          stagger: 0.04,
          ease: "expo.out",
        },
        0.22
      )
      .fromTo(
        tagA,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" },
        0.75
      )
      .to({}, { duration: 0.25 })
      .to(lettersA, {
        yPercent: -130,
        opacity: 0,
        rotateX: 60,
        duration: 0.45,
        stagger: 0.02,
        ease: "power2.in",
      })
      .add(() => {
        if (wordB) scrambleText(wordB, "EXPRESSION", 1.05);
      })
      .fromTo(
        wordB,
        { opacity: 0, scale: 1.25, filter: "blur(12px)" },
        { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1.05, ease: "power2.out" },
        "<"
      )
      .to({}, { duration: 0.22 })
      .to(wordB, {
        opacity: 0,
        scale: 0.9,
        filter: "blur(10px)",
        duration: 0.4,
        ease: "power2.in",
      })
      .fromTo(
        lettersC,
        { yPercent: 120, opacity: 0, rotateX: -60 },
        {
          yPercent: 0,
          opacity: 1,
          rotateX: 0,
          duration: 0.65,
          stagger: 0.025,
          ease: "expo.out",
          onStart: () => {
            gsap.to(tagA, { opacity: 0, y: -10, duration: 0.3 });
          },
        }
      )
      .fromTo(
        tagC,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" },
        "<0.35"
      )
      .fromTo(
        dots,
        { scale: 1, opacity: 0.25 },
        { scale: 1.35, opacity: 1, duration: 0.35, stagger: 0.1, ease: "back.out(2.5)" },
        "<0.25"
      )
      .to({}, { duration: 0.35 });

    // Hard cap: the site must become interactive even if something stalls.
    const safety = window.setTimeout(finish, 5000);

    const skip = () => {
      tl.progress(1);
    };
    const onKey = () => skip();
    const onPointer = () => skip();
    const onWheel = () => skip();

    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("wheel", onWheel, { passive: true });

    return () => {
      window.clearTimeout(safety);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("wheel", onWheel);
      tl.kill();
    };
  }, [reduced, finish]);

  const letterSpans = (word: string, goldTail: number) =>
    word.split("").map((ch, i) => (
      <span
        key={`${word}-${i}`}
        className={`inline-block will-change-transform ${
          i >= goldTail ? "gold-text" : ""
        }`}
      >
        {ch}
      </span>
    ));

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[120] flex flex-col items-center justify-center overflow-hidden bg-ink text-ivory"
      role="status"
      aria-label="Language Hub opening animation"
    >
      <h1 className="sr-only">Language Hub — Hub of Language Excellence</h1>

      <div className="aurora-blob left-[-15%] top-[-20%] h-[55vh] w-[55vh] bg-brand/25" />
      <div className="aurora-blob bottom-[-25%] right-[-10%] h-[60vh] w-[60vh] bg-brand-magenta/20" />
      <div className="pointer-events-none absolute inset-0 grain" />

      <div className="relative flex flex-col items-center px-6 text-center">
        <div data-intro="logo" className="mb-10 opacity-0">
          <Logo
            mode="chip"
            size="sm"
            priority
            className="h-[clamp(4.2rem,11vw,6.5rem)] w-[clamp(4.2rem,11vw,6.5rem)] rounded-[clamp(1rem,2.4vw,1.5rem)] p-2 shadow-[0_18px_50px_-16px_rgb(0_0_0/0.6)]"
          />
        </div>

        <div aria-hidden="true" className="font-display font-extrabold leading-none tracking-[-0.03em]">
          <span
            data-intro="word-a"
            className="flex justify-center text-[clamp(2.6rem,9vw,6.5rem)]"
            aria-label="LANGUAGE"
          >
            {letterSpans("LANGUAGE", 0)}
          </span>
          <span
            data-intro="word-b"
            className="flex justify-center text-[clamp(2.6rem,9vw,6.5rem)] opacity-0"
            aria-label="EXPRESSION"
          >
            {letterSpans("EXPRESSION", 3)}
          </span>
          <span
            data-intro="word-c"
            className="flex justify-center text-[clamp(2.6rem,9vw,6.5rem)]"
            aria-label="LANGUAGE HUB REAL"
          >
            <span className="flex">{letterSpans("LANGUAGE", 0)}</span>
            <span className="mx-[0.35em] flex opacity-60">{letterSpans("HUB", 0)}</span>
            <span className="flex">{letterSpans("REAL", 3)}</span>
          </span>
        </div>

        <p
          data-intro="tag-a"
          aria-hidden="true"
          className="mt-6 font-display text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-gold-light opacity-0 sm:tracking-[0.5em]"
        >
          Hub of Language Excellence
        </p>
        <p
          data-intro="tag-c"
          aria-hidden="true"
          className="mt-6 font-display text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-gold-light opacity-0 sm:tracking-[0.5em]"
        >
          Hub of Language Excellence
        </p>
      </div>

      <div className="absolute bottom-10 flex items-center gap-2.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            data-intro="dot"
            className="h-1.5 w-1.5 rounded-full bg-gold opacity-25"
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => {
          if (completed.current) return;
          completed.current = true;
          onComplete();
        }}
        className="absolute right-6 top-6 rounded-full border border-ivory/20 px-4 py-2 font-display text-[0.68rem] font-semibold uppercase tracking-[0.25em] text-ivory/70 transition-colors duration-300 hover:border-gold/60 hover:text-gold-light focus-visible:outline-gold"
      >
        Skip
      </button>
    </div>
  );
}
