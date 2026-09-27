"use client";

import { motion } from "framer-motion";
import { MessageCircle, Sparkles } from "lucide-react";
import { CONTACT, whatsappLink } from "@/lib/content";
import { BookDemoButton } from "@/components/contact/BookDemoButton";

const ease = [0.16, 1, 0.3, 1] as const;

/** Compact final CTA strip — replaces the heavy Start-Today card. */
export function ClosingStrip() {
  const waHref =
    CONTACT.whatsappHref ||
    whatsappLink("Assalam o alaikum! I'd like to book a free demo at Language Hub.");

  return (
    <section
      id="cta"
      data-section
      className="relative overflow-hidden border-t border-[#DCE9FF] bg-[linear-gradient(180deg,#F4F7FF_0%,#EDF3FF_100%)] px-6 py-16 sm:px-12"
      aria-label="Start your journey"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-48 w-[40rem] -translate-x-1/2"
        style={{ background: "radial-gradient(50% 100% at 50% 0%, rgb(37 99 235 / 0.10), transparent 70%)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.6, ease }}
        className="relative mx-auto flex max-w-3xl flex-col items-center gap-5 text-center"
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-[#2563EB]/25 bg-white px-4 py-1.5 font-mono text-[0.58rem] font-bold uppercase tracking-[0.26em] text-[#1647C7] shadow-[0_8px_22px_-14px_rgb(37_99_235/0.6)]">
          <Sparkles className="h-3.5 w-3.5 text-[#2563EB]" strokeWidth={2.2} />
          Your next step
        </span>

        <h2 className="font-display text-[clamp(1.6rem,3.6vw,2.4rem)] font-extrabold leading-tight tracking-[-0.02em] text-ink">
          Free demo. No pressure.{" "}
          <span
            style={{
              backgroundImage: "linear-gradient(100deg,#1D4ED8,#2563EB,#38BDF8)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Choose your batch today.
          </span>
        </h2>

        <p className="max-w-xl text-[0.95rem] leading-relaxed text-ink-2">
          One live session is enough to know if we are the right fit — no
          commitment, no hidden steps, just a real conversation.
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <BookDemoButton />
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center gap-2 rounded-full border border-emerald-300/70 bg-emerald-50 px-6 font-display text-[0.8rem] font-bold uppercase tracking-[0.1em] text-emerald-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-100 hover:shadow-[0_16px_34px_-18px_rgb(16_185_129/0.7)]"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={2.2} />
            WhatsApp
          </a>
        </div>
      </motion.div>
    </section>
  );
}