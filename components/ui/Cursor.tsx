"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useIsTouch } from "@/lib/hooks";

type CursorMode = "default" | "link" | "explore" | "view";

const MODE_STYLES: Record<CursorMode, { scale: number; label?: string }> = {
  default: { scale: 1 },
  link: { scale: 1.7 },
  explore: { scale: 3.1, label: "EXPLORE" },
  view: { scale: 2.7, label: "VIEW" },
};

export function Cursor() {
  const isTouch = useIsTouch();
  const [mode, setMode] = useState<CursorMode>("default");
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 260, damping: 28, mass: 0.5 });
  const ringY = useSpring(y, { stiffness: 260, damping: 28, mass: 0.5 });

  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (isTouch) return;

    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const labelled = target?.closest?.("[data-cursor]") as HTMLElement | null;
      if (labelled?.dataset.cursor === "explore") {
        setMode("explore");
        return;
      }
      if (labelled?.dataset.cursor === "view") {
        setMode("view");
        return;
      }
      const interactive = target?.closest?.(
        "a, button, [role='button'], [data-clickable]"
      );
      setMode(interactive ? "link" : "default");
    };

    const onLeave = () => setVisible(false);
    const onDown = () => setMode((m) => (m === "default" ? "link" : m));

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("mousedown", onDown);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("mousedown", onDown);
    };
  }, [isTouch, x, y]);

  useEffect(() => {
    const el = labelRef.current;
    if (!el) return;
    el.textContent = MODE_STYLES[mode].label ?? "";
  }, [mode]);

  if (!mounted || isTouch) return null;

  const style = MODE_STYLES[mode];
  const isLabel = Boolean(style.label);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-[130] hidden md:block ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{ transition: "opacity 0.4s ease" }}
    >
      <motion.div
        style={{ x, y }}
        className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2"
      >
        <div
          className={`h-2 w-2 rounded-full transition-colors duration-300 ${
            mode === "explore" ? "bg-gold" : "bg-brand"
          }`}
        />
      </motion.div>

      <motion.div
        style={{ x: ringX, y: ringY }}
        className="absolute left-0 top-0"
      >
        <motion.div
          animate={{ scale: style.scale }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className={`flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border ${
            mode === "explore"
              ? "border-gold/70 bg-gold/[0.07]"
              : mode === "view"
                ? "border-brand/60 bg-brand/[0.07]"
                : mode === "link"
                  ? "border-ink/40"
                  : "border-ink/15"
          }`}
          style={{
            width: 44,
            height: 44,
            boxShadow:
              mode === "explore"
                ? "0 0 0 1px rgb(194 160 92 / 0.25)"
                : "0 0 0 0 transparent",
          }}
        >
          <span
            ref={labelRef}
            className={`font-display text-[0.6rem] font-bold tracking-[0.22em] ${
              mode === "explore" ? "text-gold-deep" : "text-brand-deep"
            }`}
            style={{ opacity: isLabel ? 1 : 0 }}
          />
        </motion.div>
      </motion.div>

    </div>
  );
}
