"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, BadgeCheck, MessageCircle, Sparkles } from "lucide-react";
import { CONTACT, whatsappLink } from "@/lib/content";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Final CTA on a deep-teal panel: a calm invitation with one teal pill, one
 * WhatsApp action and the reference's mint / coral accents.
 */
export function ClosingStrip() {
  const waHref =
    CONTACT.whatsappHref ||
    whatsappLink("Assalam o alaikum! I'd like to know more about Language Hub.");

  return (
    <section
      id="cta"
      data-section
      className="bg-deep-teal relative overflow-hidden px-6 py-16 sm:px-12 sm:py-20"
      aria-label="Start your journey"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-[#14a08c]/30 blur-[110px]" />
        <div className="absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-[#fb6a47]/22 blur-[110px]" />
      </div>

      <div className="relative mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.7, ease }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-1.5 font-display text-[0.58rem] font-bold uppercase tracking-[0.26em] text-[#7ef0c9]">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} />
            Your next step
          </span>

          <h2 className="mx-auto mt-5 max-w-2xl font-display text-[clamp(1.9rem,4.4vw,3rem)] font-extrabold leading-[1.05] tracking-[-0.035em] text-white">
            Find your level.
            <br />
            <span className="text-[#7ef0c9]">Start today.</span>
          </h2>

          <p className="mx-auto mt-4 max-w-xl font-sans text-[0.97rem] leading-[1.8] text-white/65">
            Take the free 10-minute placement test to see exactly where you stand
            — then choose the batch that fits. No commitment, no hidden steps.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/placement-test"
              className="group relative inline-flex h-13 items-center gap-2.5 overflow-hidden rounded-full bg-white px-8 py-4 font-display text-[0.9rem] font-bold tracking-tight text-[#073b33] shadow-[0_20px_40px_-18px_rgba(0,0,0,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#e9fbf6]"
            >
              <span className="relative">Check your level — free</span>
              <ArrowRight
                className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                strokeWidth={2.4}
              />
            </Link>

            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-[#7ef0c9]/35 bg-[#7ef0c9]/10 px-6 py-4 font-display text-[0.82rem] font-bold uppercase tracking-[0.1em] text-[#b8f3e6] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#7ef0c9]/60 hover:bg-[#7ef0c9]/16"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={2.2} />
              WhatsApp
            </a>
          </div>

          <p className="mt-8 flex items-center justify-center gap-2 font-sans text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white/45">
            <BadgeCheck className="h-3.5 w-3.5 text-[#7ef0c9]" strokeWidth={2.2} />
            Free level test · No commitment · Small batches
          </p>
        </motion.div>
      </div>
    </section>
  );
}
