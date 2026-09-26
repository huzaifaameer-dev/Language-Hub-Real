"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { BrandIntro } from "@/components/intro/BrandIntro";
import { useBodyScrollLock } from "@/lib/hooks";

/**
 * Client island that owns the one-time brand intro:
 *  - plays BrandIntro once (skippable, reduced-motion aware, localStorage gated)
 *  - locks body scroll + inerts the content until the intro finishes
 *  - scrolls to a stored section after landing from another page (footer/nav)
 *
 * Children are passed through props, so the whole marketing page inside stays
 * server-rendered (only this island and the section-level Reveals hydrate).
 */
export function IntroGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [introDone, setIntroDone] = useState(false);

  useBodyScrollLock(!introDone);

  const handleComplete = useCallback(() => {
    try {
      window.localStorage.setItem("lh:intro-seen", "1");
    } catch {}
    setIntroDone(true);
  }, []);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      let seen = false;
      try {
        seen = window.localStorage.getItem("lh:intro-seen") === "1";
      } catch {}
      // Skip the intro on low-end devices — it should never delay the content.
      const lowEnd =
        typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency < 4;
      if (seen || lowEnd) setIntroDone(true);
      setReady(true);
    });
    return () => window.cancelAnimationFrame(raf);
  }, []);

  // After landing from the blog (or elsewhere), scroll to the requested section.
  useEffect(() => {
    if (!ready) return;
    let target: string | null = null;
    try {
      target = sessionStorage.getItem("lh:scroll-to");
      sessionStorage.removeItem("lh:scroll-to");
    } catch {}
    if (!target) return;
    const t = window.setTimeout(() => {
      import("@/lib/lenis").then(({ scrollToId }) => scrollToId(target!));
    }, 400);
    return () => window.clearTimeout(t);
  }, [ready]);

  return (
    <>
      {ready && !introDone && <BrandIntro onComplete={handleComplete} />}
      <div inert={ready && !introDone}>{children}</div>
    </>
  );
}