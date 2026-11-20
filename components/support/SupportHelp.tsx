"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotionSafe } from "@/lib/hooks";
import { ChevronDown, LifeBuoy, Mail, MessageCircle, MessageSquareHeart, X } from "lucide-react";

import { useBodyScrollLock } from "@/lib/hooks";
import { FocusTrap, useEscapeKey } from "@/components/ui/FocusTrap";
import { CONTACT, whatsappLink } from "@/lib/content";

/** The handful of questions people actually ask — short, plain answers. */
const FAQS: { q: string; a: string }[] = [
  {
    q: "How much do the courses cost?",
    a: "Every course shows its monthly fee on the courses page — no hidden charges. Message us and we'll send the current fee table and instalment options.",
  },
  {
    q: "How can I pay my fee?",
    a: "Pay online by card, or by EasyPaisa / JazzCash. You get payment instructions right after enrolling and we confirm your seat once it arrives.",
  },
  {
    q: "Which courses do you offer?",
    a: "Spoken English, IELTS, PTE and the Duolingo English Test — all live, in small batches, Monday to Saturday.",
  },
  {
    q: "Can I try before I pay?",
    a: "Yes. Take the free 10-minute placement test to see your level, or book a free demo class and meet the trainer — no commitment.",
  },
  {
    q: "How do I book a free demo?",
    a: "Tap 'Book a demo' anywhere on the site, choose a date and time, and we'll confirm your slot.",
  },
];

const EMPTY_SUBSCRIBE = (): (() => void) => () => {};
function useIsClient(): boolean {
  return useSyncExternalStore(EMPTY_SUBSCRIBE, () => true, () => false);
}

/**
 * Help & Support — a compact floating widget in the reference palette:
 * a teal help button, a coral feedback button, and a clean white panel.
 */
export function SupportHelp() {
  const [open, setOpen] = useState(false);
  const mounted = useIsClient();
  const reduce = useReducedMotionSafe();

  useBodyScrollLock(open);
  useEscapeKey(() => setOpen(false), open);

  if (!mounted) return null;

  const email = CONTACT.email || "languagehub.team@gmail.com";
  const wa = whatsappLink("Assalam o alaikum! I have a question about Language Hub. Could you help me?");
  const mailto = `mailto:${email}?subject=${encodeURIComponent("Question about Language Hub")}`;

  return createPortal(
    <>
      {/* Floating actions */}
      <div className="fixed bottom-4 right-4 z-[90] flex flex-col items-end gap-2.5 sm:bottom-6 sm:right-6 sm:gap-3">
        <Link
          href="/feedback"
          prefetch
          aria-label="Send feedback"
          className="group/df relative grid h-12 w-12 place-items-center rounded-full bg-[linear-gradient(145deg,#ff8a5f,#fb6a47_55%,#e8542f)] text-white shadow-[0_16px_40px_-14px_rgba(232,84,47,0.85)] transition-all duration-300 hover:scale-110 active:scale-95 sm:h-14 sm:w-14"
        >
          <MessageSquareHeart className="h-5 w-5 transition-transform duration-300 group-hover/df:-rotate-6 sm:h-6 sm:w-6" strokeWidth={2} />
          <span className="pointer-events-none absolute right-full top-1/2 mr-3 hidden -translate-y-1/2 whitespace-nowrap rounded-full border border-[#e3ede9] bg-white px-3.5 py-1.5 font-display text-[0.72rem] font-bold text-ink opacity-0 shadow-lg transition-all duration-300 group-hover/df:opacity-100 sm:block">
            Send feedback
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open Support & Help"
          className="group/help relative grid h-12 w-12 place-items-center rounded-full bg-[linear-gradient(150deg,#0f6b5c,#0a4e43_58%,#073b33)] text-white shadow-[0_16px_40px_-14px_rgba(10,78,67,0.9)] transition-all duration-300 hover:scale-110 active:scale-95 sm:h-14 sm:w-14"
        >
          <LifeBuoy className="h-5 w-5 transition-transform duration-300 group-hover/help:rotate-12 sm:h-6 sm:w-6" strokeWidth={2} />
          <span className="pointer-events-none absolute right-full top-1/2 mr-3 hidden -translate-y-1/2 whitespace-nowrap rounded-full border border-[#e3ede9] bg-white px-3.5 py-1.5 font-display text-[0.72rem] font-bold text-ink opacity-0 shadow-lg transition-all duration-300 group-hover/help:opacity-100 sm:block">
            Help &amp; Support
          </span>
        </button>
      </div>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.button
              aria-label="Close support"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[115] cursor-default bg-[#062e28]/45 backdrop-blur-sm"
            />
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-x-4 bottom-4 z-[120] mx-auto flex max-h-[84dvh] w-[min(25rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-[#e3ede9] bg-white shadow-[0_40px_90px_-40px_rgba(6,46,40,0.5)] sm:inset-x-auto sm:bottom-24 sm:right-6 sm:mx-0"
              role="dialog"
              aria-modal="true"
              aria-label="Help & Support"
            >
              <FocusTrap active={open} className="flex min-h-0 flex-1 flex-col">
                {/* Header */}
                <div className="relative flex items-start justify-between gap-3 overflow-hidden border-b border-[#eef5f2] px-5 py-4">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-10 -top-14 h-32 w-32 rounded-full bg-[#14a08c]/12 blur-2xl"
                  />
                  <div className="relative flex items-center gap-3">
                    <span className="clay h-11 w-11 shrink-0 rounded-xl">
                      <LifeBuoy className="relative z-10 h-5 w-5 text-[#0f6b5c]" strokeWidth={2} />
                    </span>
                    <div>
                      <p className="font-display text-[1.05rem] font-extrabold leading-tight text-ink">
                        How can we help?
                      </p>
                      <p className="mt-0.5 font-sans text-[0.74rem] text-ink-3">
                        Quick answers, or reach us directly.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close"
                    className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#e3ede9] text-ink-3 transition-colors hover:bg-[#f3fbf8] hover:text-ink"
                  >
                    <X className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>

                {/* Body */}
                <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-4">
                  <div className="rounded-2xl border border-[#d7f0e9] bg-[linear-gradient(145deg,#f3fbf8,#ffffff)] p-4">
                    <p className="font-display text-[0.86rem] font-extrabold text-ink">
                      Talk to our team
                    </p>
                    <p className="mt-0.5 font-sans text-[0.74rem] leading-relaxed text-ink-3">
                      Pick whatever&apos;s easiest — we usually reply within minutes.
                    </p>
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <a
                        href={mailto}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0f6b5c] px-4 py-2.5 font-display text-[0.78rem] font-bold text-white shadow-[0_14px_28px_-16px_rgba(10,78,67,0.9)] transition-all hover:-translate-y-0.5 hover:bg-[#0a4e43] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b5c]"
                      >
                        <Mail className="h-4 w-4" strokeWidth={2} /> Email us
                      </a>
                      {wa ? (
                        <a
                          href={wa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#12b886] px-4 py-2.5 font-display text-[0.78rem] font-bold text-white shadow-[0_14px_28px_-16px_rgba(18,184,134,0.9)] transition-all hover:-translate-y-0.5 hover:bg-[#0ea472] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#12b886]"
                        >
                          <MessageCircle className="h-4 w-4" strokeWidth={2} /> WhatsApp
                        </a>
                      ) : null}
                    </div>
                    <p className="mt-2.5 text-center font-sans text-[0.68rem] text-ink-3">
                      or write to <span className="font-semibold text-[#0f6b5c]">{email}</span>
                    </p>
                  </div>

                  <p className="px-1 pb-1 pt-5 font-display text-[0.56rem] font-bold uppercase tracking-[0.24em] text-[#93aaa4]">
                    Popular questions
                  </p>
                  <div>
                    {FAQS.map((f) => (
                      <details key={f.q} className="group border-b border-[#f1f7f5] last:border-0">
                        <summary className="flex cursor-pointer list-none items-center gap-3 py-3 font-display text-[0.85rem] font-bold text-ink [&::-webkit-details-marker]:hidden">
                          <span className="flex-1">{f.q}</span>
                          <ChevronDown
                            className="h-4 w-4 shrink-0 text-[#93aaa4] transition-transform duration-300 group-open:rotate-180"
                            strokeWidth={2.2}
                          />
                        </summary>
                        <p className="pb-3.5 pr-2 font-sans text-[0.82rem] leading-relaxed text-ink-2">
                          {f.a}
                        </p>
                      </details>
                    ))}
                  </div>
                </div>

                {/* Footer nudge */}
                <div className="border-t border-[#eef5f2] bg-[#fbfefd] px-5 py-3 text-center">
                  <p className="font-sans text-[0.73rem] text-ink-3">
                    Still stuck?{" "}
                    <a
                      href={mailto}
                      className="font-display font-bold text-[#0f6b5c] underline decoration-[#0f6b5c]/30 underline-offset-2 hover:decoration-[#0f6b5c]"
                    >
                      Email us
                    </a>{" "}
                    — happy to help.
                  </p>
                </div>
              </FocusTrap>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}
