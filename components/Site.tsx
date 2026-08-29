"use client";

import { useCallback, useEffect, useState } from "react";
import { KineticIntro } from "@/components/intro/KineticIntro";
import { Navbar } from "@/components/navigation/Navbar";
import { Hero } from "@/components/hero/Hero";
import { Transformation } from "@/components/transformation/Transformation";
import { Journey } from "@/components/journey/Journey";
import { About } from "@/components/about/About";
import { Courses } from "@/components/courses/Courses";
import { Bookshelf } from "@/components/resources/Bookshelf";
import { Expression } from "@/components/expression/Expression";
import { Voice } from "@/components/voice/Voice";
import { WhyHub } from "@/components/philosophy/WhyHub";
import { JaveriaSection } from "@/components/javeria/JaveriaSection";
import { Hours } from "@/components/hours/Hours";
import { FinalScene } from "@/components/final/FinalScene";
import { Footer } from "@/components/footer/Footer";
import { Cursor } from "@/components/ui/Cursor";
import { useBodyScrollLock } from "@/lib/hooks";
import { destroyLenis, initLenis } from "@/lib/lenis";
import { initScrollSystem } from "@/lib/scroll";

export function Site() {
  const [ready, setReady] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  useBodyScrollLock(!introDone);

  const handleComplete = useCallback(() => {
    try {
      window.localStorage.setItem("lh:intro-seen", "1");
    } catch {}
    setIntroDone(true);
    window.dispatchEvent(new Event("lh:intro-done"));
  }, []);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      let seen = false;
      try {
        seen = window.localStorage.getItem("lh:intro-seen") === "1";
      } catch {}
      if (seen) setIntroDone(true);
      setReady(true);
    });
    return () => window.cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (introDone) {
      initScrollSystem();
      initLenis();
    } else {
      destroyLenis();
    }
  }, [introDone]);

  return (
    <>
      <a
        href="#main"
        className="sr-only z-[130] rounded-full bg-ink px-5 py-2 text-sm text-ivory focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      {ready && !introDone && <KineticIntro onComplete={handleComplete} />}

      <Cursor />
      <Navbar />

      <main id="main" inert={!introDone}>
        <Hero />
        <Transformation />
        <Journey />
        <About />
        <Courses />
        <Bookshelf />
        <Expression />
        <Voice />
        <WhyHub />
        <JaveriaSection />
        <Hours />
        <FinalScene />
        <Footer />
      </main>
    </>
  );
}