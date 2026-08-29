"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

const CONCEPTS = [
  { title: "Practical Learning", tone: "#6e5ae0", note: "Real speaking from session one — language you can actually use today." },
  { title: "Confidence", tone: "#c2a05c", note: "Fluency is a habit. Confidence is the pattern of using it." },
  { title: "Communication", tone: "#2bb3d8", note: "Clear, natural and effective — English built for real conversations." },
  { title: "Creative Expression", tone: "#d63a8c", note: "Stories, ideas and imagination — find the tone that is unmistakably you." },
  { title: "Interactive Learning", tone: "#2e9e6b", note: "Engaging, responsive and alive — learning that keeps you moving." },
  { title: "Global Competence", tone: "#7b4fd0", note: "Study, work and life around the world — language is the key to it all." },
];

const POSITIONS = [
  { left: "16%", top: "16%" },
  { left: "84%", top: "16%" },
  { left: "8%", top: "50%" },
  { left: "92%", top: "50%" },
  { left: "16%", top: "84%" },
  { left: "84%", top: "84%" },
];

export function WhyHub() {
  const [active, setActive] = useState(0);
  const concept = CONCEPTS[active];

  return (
    <section
      id="why"
      data-section
      className="relative overflow-hidden bg-ivory py-28 sm:py-36"
      aria-label="Why Language Hub"
    >
      <div className="pointer-events-none absolute inset-0 grain" />
      <div className="aurora-blob left-[-14%] top-[-12%] h-[46vh] w-[46vh] bg-gold/15" />
      <div className="aurora-blob bottom-[-16%] right-[-12%] h-[48vh] w-[48vh] bg-brand/12" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mb-20 flex flex-col items-center gap-5 text-center">
          <p className="flex items-center gap-4 font-display text-[0.66rem] font-bold uppercase tracking-[0.42em] text-gold-deep">
            <span aria-hidden="true" className="h-px w-10 bg-gold/60" />
            The Hub Way
            <span aria-hidden="true" className="h-px w-10 bg-gold/60" />
          </p>
          <h2 className="font-display text-[clamp(2.2rem,5.6vw,4.4rem)] font-extrabold leading-[1.04] tracking-[-0.03em] text-ink">
            WHY <span className="brand-text">LANGUAGE HUB?</span>
          </h2>
          <p className="max-w-xl text-[1.02rem] leading-relaxed text-ink-2">
            Six ideas stand behind everything we do. Choose one — the centre of
            the hub responds.
          </p>
        </div>

        <div className="relative mx-auto hidden h-[560px] w-full max-w-5xl lg:block">
          <div
            className="absolute left-1/2 top-1/2 h-[72%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-line"
            aria-hidden="true"
          />
          <div
            className="absolute left-1/2 top-1/2 h-[96%] w-[98%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-line/60"
            aria-hidden="true"
          />

          {CONCEPTS.map((c, i) => {
            const pos = POSITIONS[i];
            const isActive = active === i;
            return (
              <motion.button
                key={c.title}
                type="button"
                onClick={() => setActive(i)}
                aria-pressed={isActive}
                initial={{ opacity: 0, scale: 0.6 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.7, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                animate={{ scale: isActive ? 1.1 : 1 }}
                whileHover={{ scale: isActive ? 1.12 : 1.07 }}
                className={cn(
                  "absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-white/80 px-5 py-4 shadow-[0_14px_40px_-18px_rgb(34_30_43/0.3)] backdrop-blur-md transition-[opacity,border-color,box-shadow] duration-500 animate-float",
                  isActive ? "border-transparent" : "border-line hover:border-ink/25",
                  !isActive && "opacity-55 hover:opacity-90"
                )}
                style={{ left: pos.left, top: pos.top, animationDelay: `${i * 0.7}s`, boxShadow: isActive ? `0 24px 60px -20px ${c.tone}66` : undefined }}
              >
                <span className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.tone }} aria-hidden="true" />
                  <span className="font-display text-[0.95rem] font-bold tracking-tight text-ink">{c.title}</span>
                </span>
              </motion.button>
            );
          })}

          <div className="absolute left-1/2 top-1/2 z-0 w-[300px] -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="flex flex-col items-center rounded-[2rem] border border-line bg-white/70 p-8 backdrop-blur-xl">
              <span className="mb-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_10px_30px_-12px_rgb(34_30_43/0.35)]">
                <Logo size="xs" eager />
              </span>
              <div className="relative flex min-h-[130px] w-full items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={concept.title}
                    initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -14, filter: "blur(6px)" }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                    className="flex flex-col items-center gap-3"
                  >
                    <h3 className="font-display text-[1.35rem] font-extrabold tracking-tight" style={{ color: concept.tone }}>
                      {concept.title}
                    </h3>
                    <span aria-hidden="true" className="h-px w-12 gold-underline" />
                    <p className="text-[0.92rem] leading-relaxed text-ink-2">{concept.note}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:hidden">
          <div className="grid grid-cols-2 gap-3">
            {CONCEPTS.map((c, i) => (
              <motion.button
                key={c.title}
                type="button"
                onClick={() => setActive(i)}
                aria-pressed={active === i}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-8% 0px" }}
                transition={{ duration: 0.6, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                className={cn(
                  "flex items-center gap-2.5 rounded-2xl border px-4 py-4 text-left transition-all duration-300",
                  active === i ? "border-transparent bg-white shadow-[0_16px_44px_-18px_rgb(34_30_43/0.35)]" : "border-line bg-white/50"
                )}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: c.tone }} aria-hidden="true" />
                <span className="font-display text-[0.85rem] font-bold tracking-tight text-ink">{c.title}</span>
              </motion.button>
            ))}
          </div>

          <div className="mt-6 rounded-3xl border border-line bg-white/70 p-7 text-center backdrop-blur-md">
            <h3 className="font-display text-[1.3rem] font-extrabold tracking-tight" style={{ color: concept.tone }}>
              {concept.title}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-[0.95rem] leading-relaxed text-ink-2">{concept.note}</p>
          </div>
        </div>
      </div>
    </section>
  );
}