"use client";

import { motion } from "framer-motion";
import { BadgeCheck, MessageCircle, Sparkles } from "lucide-react";
import { CONTACT, whatsappLink } from "@/lib/content";
import { BookDemoButton } from "@/components/contact/BookDemoButton";

const ease = [0.16, 1, 0.3, 1] as const;

/** Compact final CTA strip — premium, calm, blue. */
export function ClosingStrip() {
  const waHref =
    CONTACT.whatsappHref ||
    whatsappLink("Assalam o alaikum! I'd like to book a free demo at Language Hub.");

  return (
    <section
      id="cta"
      data-section
      className="relative overflow-hidden bg-[linear-gradient(180deg,#F4F7FF_0%,#EDF3FF_100%)] px-6 py-14 sm:px-12 sm:py-16"
      aria-label="Start your journey"
    >
      <div className="relative mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.7, ease }}
          className="relative overflow-hidden rounded-[2rem] border border-[#C7D6FF]/80 bg-white p-8 text-center shadow-[0_40px_90px_-50px_rgb(37_99_235/0.55)] sm:p-12"
        >
          {/* top hairline */}
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#1D4ED8] via-[#38BDF8] to-[#1D4ED8]"
          />
          {/* soft glows + texture */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div
              className="absolute -left-20 -top-20 h-64 w-64 rounded-[50%]"
              style={{ background: "radial-gradient(50% 50% at 50% 50%, rgb(37 99 235 / 0.14), transparent 70%)" }}
            />
            <div
              className="absolute -bottom-24 -right-16 h-64 w-64 rounded-[50%]"
              style={{ background: "radial-gradient(50% 50% at 50% 50%, rgb(14 165 233 / 0.12), transparent 70%)" }}
            />
            <div
              className="absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage: "radial-gradient(rgb(37 99 235 / 0.22) 1px, transparent 1px)",
                backgroundSize: "26px 26px",
                maskImage: "radial-gradient(ellipse at 50% 0%, black 0%, transparent 72%)",
                WebkitMaskImage: "radial-gradient(ellipse at 50% 0%, black 0%, transparent 72%)",
              }}
            />
          </div>

          {/* content */}
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#2563EB]/20 bg-[#F2F6FF] px-4 py-1.5 font-mono text-[0.58rem] font-bold uppercase tracking-[0.26em] text-[#1647C7]">
              <Sparkles className="h-3.5 w-3.5 text-[#2563EB]" strokeWidth={2.2} />
              Your next step
            </span>

            <h2 className="mx-auto mt-5 max-w-2xl font-display text-[clamp(1.7rem,4vw,2.6rem)] font-extrabold leading-tight tracking-[-0.02em] text-ink">
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

            <p className="mx-auto mt-4 max-w-xl text-[0.95rem] leading-relaxed text-ink-2">
              One live session is enough to know if we are the right fit — no
              commitment and no hidden steps, just a real conversation.
            </p>

            {/* divider */}
            <div className="mx-auto mt-8 flex max-w-xs items-center gap-3">
              <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-transparent via-[#2563EB]/40 to-[#2563EB]/40" />
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#2563EB]/50" />
              <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-[#2563EB]/40 via-[#2563EB]/40 to-transparent" />
            </div>

            {/* CTA row */}
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
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

            <p className="mt-7 flex items-center justify-center gap-2 font-mono text-[0.6rem] font-bold uppercase tracking-[0.2em] text-[#64748B]">
              <BadgeCheck className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2.2} />
              Free demo · No commitment · Small batches
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}