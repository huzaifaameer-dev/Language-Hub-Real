"use client";

import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

function isOpenNow(): boolean {
  const h = new Date().getHours();
  return h >= 9 && h < 18;
}

export function Hours() {
  const hourRef = useRef<SVGGElement>(null);
  const minuteRef = useRef<SVGGElement>(null);
  const secondRef = useRef<SVGGElement>(null);
  const sectRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectRef,
    offset: ["start end", "end start"],
  });
  const contentOpacity = useTransform(
    scrollYProgress,
    [0, 0.1, 0.8, 1],
    [0, 1, 1, 0]
  );
  const contentY = useTransform(
    scrollYProgress,
    [0, 0.1, 0.8, 1],
    [40, 0, 0, -48]
  );

  useEffect(() => {
    let raf = 0;

    const tick = () => {
      const now = new Date();
      const ms = now.getMilliseconds();
      const hours = (now.getHours() % 12) + now.getMinutes() / 60;
      const minutes = now.getMinutes() + now.getSeconds() / 60;
      const seconds = now.getSeconds() + ms / 1000;

      hourRef.current?.setAttribute("transform", `rotate(${hours * 30} 50 50)`);
      minuteRef.current?.setAttribute("transform", `rotate(${minutes * 6} 50 50)`);
      secondRef.current?.setAttribute("transform", `rotate(${seconds * 6} 50 50)`);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const open = isOpenNow();
  const ticks = Array.from({ length: 12 }, (_, i) => (360 / 12) * i - 90);

  return (
    <section
      id="hours"
      ref={sectRef}
      className="relative overflow-hidden bg-ivory py-24"
      aria-label="Opening hours"
    >
      <div className="pointer-events-none absolute inset-0 grain" />
      <motion.div
        style={{ opacity: contentOpacity, y: contentY }}
        className="mx-auto flex max-w-4xl flex-col items-center px-6 text-center"
      >
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="mb-8 flex items-center gap-4 font-display text-[0.66rem] font-bold uppercase tracking-[0.42em] text-gold-deep"
        >
          <span aria-hidden="true" className="h-px w-10 bg-gold/60" />
          Opening Hours
          <span aria-hidden="true" className="h-px w-10 bg-gold/60" />
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="flex flex-col items-center gap-8 sm:flex-row sm:gap-14"
        >
          <div className="relative flex h-36 w-36 items-center justify-center rounded-full border border-line bg-white/70 shadow-[0_20px_50px_-24px_rgb(34_30_43/0.3)] backdrop-blur-sm">
            {open && (
              <span className="absolute inset-0 rounded-full border border-brand-fern/40 animate-pulse-ring" aria-hidden="true" />
            )}
            <svg viewBox="0 0 100 100" className="h-32 w-32" aria-hidden="true">
              <circle cx="50" cy="50" r="47" fill="none" stroke="#e7e0d3" strokeWidth="1.5" />
              {ticks.map((rot, i) => (
                <line
                  key={i}
                  x1="50"
                  y1="6"
                  x2="50"
                  y2={i % 3 === 0 ? "11" : "9"}
                  stroke={i % 3 === 0 ? "#a3823f" : "#cfc6b2"}
                  strokeWidth={i % 3 === 0 ? "2" : "1.2"}
                  transform={`rotate(${rot} 50 50)`}
                />
              ))}
              <g ref={hourRef}>
                <line x1="50" y1="50" x2="50" y2="30" stroke="#221e2b" strokeWidth="3.4" strokeLinecap="round" />
              </g>
              <g ref={minuteRef}>
                <line x1="50" y1="50" x2="50" y2="19" stroke="#221e2b" strokeWidth="2.4" strokeLinecap="round" />
              </g>
              <g ref={secondRef}>
                <line x1="50" y1="56" x2="50" y2="14" stroke="#d63a8c" strokeWidth="1" strokeLinecap="round" />
              </g>
              <circle cx="50" cy="50" r="2.6" fill="#6e5ae0" />
            </svg>
          </div>

          <div className="relative flex flex-col items-center sm:items-start sm:text-left">
            <p className="font-display text-[clamp(1.6rem,3.6vw,2.5rem)] font-extrabold tracking-tight text-ink">
              9:00 AM <span className="gold-text mx-1">—</span> 6:00 PM
            </p>
            <p className="mt-2 font-display text-[0.7rem] font-bold uppercase tracking-[0.3em] text-ink-3">
              Monday to Saturday
            </p>
            <span
              className={`mt-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-display text-[0.62rem] font-bold uppercase tracking-[0.24em] ${
                open ? "bg-brand-fern/10 text-brand-fern" : "bg-brand-magenta/10 text-brand-magenta"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${open ? "bg-brand-fern animate-pulse-ring" : "bg-brand-magenta"}`}
                aria-hidden="true"
              />
              {open ? "Open now" : "Currently closed"}
            </span>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.3 }}
          className="mt-10 max-w-md font-serif text-[0.98rem] italic leading-relaxed text-ink-3"
        >
          The clock above is real — and so is the door. Our sessions run in this
          window, every working day.
        </motion.p>
      </motion.div>
    </section>
  );
}