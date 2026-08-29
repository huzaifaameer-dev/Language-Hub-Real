"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Logo } from "@/components/ui/Logo";
import { Reveal } from "@/components/ui/Reveal";

export function JaveriaSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const contentOpacity = useTransform(
    scrollYProgress,
    [0, 0.12, 0.82, 1],
    [0, 1, 1, 0]
  );
  const contentY = useTransform(
    scrollYProgress,
    [0, 0.12, 0.82, 1],
    [48, 0, 0, -56]
  );

  return (
    <motion.section
      id="javeria"
      data-section
      ref={ref}
      initial={{ backgroundColor: "#14111d" }}
      whileInView={{ backgroundColor: "#f4efe6" }}
      viewport={{ once: true, margin: "-6% 0px" }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="relative overflow-hidden bg-parchment py-28 sm:py-36"
      aria-label="Ms. Javeria Malik"
    >
      <div className="pointer-events-none absolute inset-0 grain" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[46vh] w-[90vw] -translate-x-1/2 rounded-b-[100%] bg-[radial-gradient(ellipse_at_top,rgb(194_160_92/0.14),transparent_70%)]" />

      <motion.div
        style={{ opacity: contentOpacity, y: contentY }}
        className="relative mx-auto flex max-w-3xl flex-col items-center px-6 text-center"
      >
        <Reveal y={24}>
          <p className="mb-8 flex items-center gap-4 font-display text-[0.66rem] font-bold uppercase tracking-[0.42em] text-gold-deep">
            <span aria-hidden="true" className="h-px w-10 bg-gold/60" />
            The Person Behind the Hub
            <span aria-hidden="true" className="h-px w-10 bg-gold/60" />
          </p>
        </Reveal>

        <Reveal delay={0.1} y={40} blur>
          <h2 className="font-display text-[clamp(1.9rem,4.6vw,3.4rem)] font-extrabold leading-tight tracking-[-0.02em] text-ink">
            MS. <span className="gold-text">JAVERIA MALIK</span>
          </h2>
          <p className="mt-2 font-display text-[0.7rem] font-bold uppercase tracking-[0.34em] text-ink-3">
            Founder — Language Hub
          </p>
        </Reveal>

        <Reveal delay={0.2} y={28}>
          <span aria-hidden="true" className="mt-10 block h-px w-24 gold-underline" />
        </Reveal>

        <Reveal delay={0.28} y={36}>
          <blockquote className="mt-10">
            <p className="font-serif text-[clamp(1.3rem,3vw,2.1rem)] italic leading-[1.6] text-ink">
              “Teaching is not only about giving knowledge. It is about helping
              someone discover what they are capable of becoming.”
            </p>
          </blockquote>
        </Reveal>

        <Reveal delay={0.36} y={24}>
          <p className="mt-10 max-w-xl text-[1rem] leading-relaxed text-ink-2">
            That is the belief behind every session at Language Hub — lessons
            that treat English as a living skill, and learners as people with
            something real to say.
          </p>
        </Reveal>

        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.9, delay: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="mt-12"
        >
          <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_16px_44px_-16px_rgb(34_30_43/0.4)]">
            <Logo size="sm" eager />
          </span>
        </motion.div>
      </motion.div>
    </motion.section>
  );
}