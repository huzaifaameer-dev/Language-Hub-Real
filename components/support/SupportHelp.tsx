"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, HelpCircle, LifeBuoy, Mail, MessageCircle, MessageSquareHeart, X } from "lucide-react";

import { useBodyScrollLock } from "@/lib/hooks";
import { FocusTrap, useEscapeKey } from "@/components/ui/FocusTrap";
import { CONTACT, whatsappLink } from "@/lib/content";

const FAQS: { q: string; a: string }[] = [
  { q: "How much do the courses cost?", a: "Each course shows its monthly fee clearly on the courses page — no hidden charges. Message us on WhatsApp for the latest fee table and instalment plans." },
  { q: "How can I pay my course fee?", a: "You can pay online by card (Stripe) or through EasyPaisa / JazzCash. After enrolling you receive payment instructions instantly, and our team confirms your seat once the payment is received." },
  { q: "Which courses do you offer?", a: "Spoken English, IELTS Preparation, PTE Preparation and the Duolingo English Test — all taught live in small batches, Monday to Saturday." },
  { q: "Can I take the free Placement Test first?", a: "Yes. The free placement test (about 10 minutes) shows your current level and recommends the best starting course — no commitment." },
  { q: "Who teaches the classes?", a: "Our founder and a specialist team of IELTS, PTE, DET and conversation trainers lead every session. Each class is conversation-first and student-focused." },
  { q: "How do I create an account or sign up?", a: "Click 'Sign up' in the navbar, enter your email and set a password. You'll get a verification email, then you can access your dashboard and courses." },
  { q: "How do I book a free demo class?", a: "Use the 'Book a demo' button anywhere on the site, pick your preferred date and time, and our team will confirm your slot." },
];

const EMPTY_SUBSCRIBE = (): (() => void) => () => {};
function useIsClient(): boolean {
  return useSyncExternalStore(EMPTY_SUBSCRIBE, () => true, () => false);
}

/** Minimal, professional Help & Support widget. */
export function SupportHelp() {
  const [open, setOpen] = useState(false);
  const mounted = useIsClient();
  const reduce = useReducedMotion();

  useBodyScrollLock(open);
  useEscapeKey(() => setOpen(false), open);

  if (!mounted) return null;

  const email = CONTACT.email || "huzaifa.ameer.2009@gmail.com";
  const wa = whatsappLink("Assalam o alaikum! I have a question about Language Hub. Could you help me?");

  return createPortal(
    <>
      {/* Floating actions — Feedback + Help (stacked) */}
      <div className="fixed bottom-6 right-6 z-[90] flex flex-col items-end gap-3">
        <Link
          href="/feedback"
          prefetch
          aria-label="Send feedback"
          className="group/df relative grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_16px_40px_-12px_rgb(245_158_11/0.85)] transition-all duration-300 hover:scale-110 active:scale-95"
        >
          <MessageSquareHeart className="h-6 w-6 transition-transform duration-300 group-hover/df:-rotate-6" strokeWidth={2} />
          <span className="pointer-events-none absolute right-full top-1/2 mr-3 hidden -translate-y-1/2 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3.5 py-1.5 font-display text-[0.72rem] font-bold text-slate-700 opacity-0 shadow-lg transition-all duration-300 group-hover/df:opacity-100 sm:block">
            Send feedback
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open Support & Help"
          className="group/help relative grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-[#2563EB] to-[#6D4AFF] text-white shadow-[0_16px_40px_-12px_rgb(37_99_235/0.9)] transition-all duration-300 hover:scale-110 active:scale-95"
        >
          <LifeBuoy className="h-6 w-6 transition-transform duration-300 group-hover/help:rotate-12" strokeWidth={2} />
          <span className="pointer-events-none absolute right-full top-1/2 mr-3 hidden -translate-y-1/2 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3.5 py-1.5 font-display text-[0.72rem] font-bold text-slate-700 opacity-0 shadow-lg transition-all duration-300 group-hover/help:opacity-100 sm:block">
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
              className="fixed inset-0 z-[115] cursor-default bg-[#0B1B3A]/45 backdrop-blur-sm"
            />
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-x-4 bottom-4 z-[120] mx-auto flex max-h-[82dvh] w-[min(30rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_40px_90px_-40px_rgb(11_27_58/0.5)] sm:inset-x-auto sm:bottom-24 sm:right-6 sm:mx-0"
              role="dialog"
              aria-modal="true"
              aria-label="Support & Help"
            >
              <FocusTrap active={open} className="flex min-h-0 flex-1 flex-col">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b border-[#EEF2F8] px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#6D4AFF] text-white">
                      <LifeBuoy className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <div>
                      <p className="font-display text-[1.02rem] font-extrabold leading-tight text-[#0B1B3A]">Help &amp; Support</p>
                      <p className="text-[0.72rem] text-[#64748B]">Answers to common questions</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#E2E8F0] text-[#64748B] transition-colors hover:bg-[#F4F7FF] hover:text-[#0B1B3A]"
                  >
                    <X className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>

                {/* FAQ accordion */}
                <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
                  {FAQS.map((f) => (
                    <details key={f.q} className="group rounded-xl px-1">
                      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl px-3 py-3 font-display text-[0.86rem] font-bold text-[#0B1B3A] transition-colors hover:bg-[#F4F7FF] [&::-webkit-details-marker]:hidden">
                        <HelpCircle className="h-4 w-4 shrink-0 text-[#2563EB]" strokeWidth={2} />
                        <span className="flex-1">{f.q}</span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-[#94A3B8] transition-transform duration-300 group-open:rotate-180" strokeWidth={2.2} />
                      </summary>
                      <p className="px-3 pb-3 pl-10 text-[0.82rem] leading-relaxed text-[#64748B]">{f.a}</p>
                    </details>
                  ))}
                </div>

                {/* Footer contact */}
                <div className="border-t border-[#EEF2F8] bg-[#FAFCFF] px-5 py-4">
                  <p className="font-display text-[0.78rem] font-bold text-[#0B1B3A]">Still need help?</p>
                  <p className="mt-0.5 text-[0.72rem] text-[#64748B]">Our team usually replies within minutes.</p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    {wa ? (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 font-display text-[0.78rem] font-bold text-white transition-colors hover:bg-emerald-600"
                      >
                        <MessageCircle className="h-4 w-4" /> WhatsApp
                      </a>
                    ) : null}
                    <a
                      href={`mailto:${email}?subject=${encodeURIComponent("Question about Language Hub")}`}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 font-display text-[0.78rem] font-bold text-[#1647C7] transition-colors hover:bg-[#EFF5FF]"
                    >
                      <Mail className="h-4 w-4" /> Email us
                    </a>
                  </div>
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