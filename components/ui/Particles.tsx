"use client";

import { useEffect, useRef } from "react";
import { useDocumentVisible, usePrefersReducedMotion } from "@/lib/hooks";

interface ParticlesProps {
  count?: number;
  color?: string;
  speed?: number;
  className?: string;
}

/**
 * Lightweight drifting dust particles on canvas.
 * Pauses when the tab is hidden, scales down on small screens, and renders
 * nothing at all when reduced motion is preferred.
 */
export function Particles({
  count = 48,
  color = "194, 160, 92",
  speed = 0.16,
  className,
}: ParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visible = useDocumentVisible();
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let raf = 0;
    let running = true;

    const cap = window.innerWidth < 640 ? 0.5 : 1;
    const total = Math.round(Math.min(count, count * cap));
    const particles = Array.from({ length: total }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.6 + Math.random() * 1.6,
      drift: (Math.random() - 0.5) * 0.12,
      rise: speed * (0.5 + Math.random()),
      phase: Math.random() * Math.PI * 2,
      twinkle: 0.4 + Math.random() * 0.6,
    }));

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const tick = (t: number) => {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.y -= p.rise / 400;
        p.x += p.drift / 600;
        if (p.y < -0.02) p.y = 1.02;
        if (p.x < -0.02) p.x = 1.02;
        if (p.x > 1.02) p.x = -0.02;

        const alpha = p.twinkle * (0.25 + 0.35 * Math.abs(Math.sin(t / 900 + p.phase)));
        ctx.beginPath();
        ctx.arc(p.x * width, p.y * height, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${alpha})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [count, color, speed, reduceMotion, visible]);

  if (reduceMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className ?? ""}`}
    />
  );
}
