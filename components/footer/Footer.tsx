"use client";

import { motion } from "framer-motion";
import { Logo } from "@/components/ui/Logo";
import { scrollToId } from "@/lib/lenis";

const LINKS = [
  { id: "journey", label: "The Journey" },
  { id: "about", label: "Beyond English" },
  { id: "courses", label: "Courses" },
  { id: "resources", label: "Reading Room" },
  { id: "voice", label: "Find Your Voice" },
  { id: "hub", label: "The Hub" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-[#14111d] text-ivory" aria-label="Footer">
      <div className="pointer-events-none absolute inset-0 grain" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-16 sm:py-20 md:grid-cols-[1.4fr_1fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8% 0px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        >
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white shadow-[0_14px_40px_-12px_rgb(0_0_0/0.6)]">
              <Logo size="xs" eager />
            </span>
            <div>
              <p className="font-display text-[0.98rem] font-extrabold tracking-[0.14em]">
                LANGUAGE<span className="gold-text"> HUB</span>
              </p>
              <p className="mt-0.5 font-display text-[0.6rem] font-bold uppercase tracking-[0.34em] text-ivory/50">
                Hub of Language Excellence
              </p>
            </div>
          </div>
          <p className="mt-6 max-w-sm text-[0.94rem] leading-relaxed text-ivory/65">
            An innovative online institute helping learners master English
            communication and creative expression — through Spoken English,
            IELTS, PTE and Duolingo-focused learning.
          </p>
          <p className="mt-6 max-w-sm font-serif text-[0.92rem] italic leading-relaxed text-ivory/50">
            Language changes what you can express. What you express can change
            where you go.
          </p>
        </motion.div>

        <motion.nav
          aria-label="Footer navigation"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8% 0px" }}
          transition={{ duration: 0.8, delay: 0.12, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        >
          <p className="mb-5 font-display text-[0.62rem] font-bold uppercase tracking-[0.34em] text-gold-light">
            Explore
          </p>
          <ul className="space-y-3">
            {LINKS.map((link) => (
              <li key={link.id}>
                <button
                  type="button"
                  onClick={() => scrollToId(link.id)}
                  className="group inline-flex items-center gap-2 font-display text-[0.92rem] font-semibold text-ivory/75 transition-colors duration-300 hover:text-gold-light"
                >
                  <span className="h-px w-0 bg-gold transition-all duration-500 group-hover:w-4" aria-hidden="true" />
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </motion.nav>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8% 0px" }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        >
          <p className="mb-5 font-display text-[0.62rem] font-bold uppercase tracking-[0.34em] text-gold-light">
            Opening Hours
          </p>
          <p className="flex items-center gap-3 font-display text-[1.15rem] font-extrabold tracking-tight">
            <span className="relative flex h-3 w-3 items-center justify-center" aria-hidden="true">
              <span className="absolute h-3 w-3 rounded-full bg-brand-fern/40 animate-pulse-ring" />
              <span className="h-1.5 w-1.5 rounded-full bg-brand-fern" />
            </span>
            9:00 AM — 6:00 PM
          </p>
          <p className="mt-2 text-[0.9rem] text-ivory/55">Monday to Saturday</p>

          <div className="mt-8">
            <p className="mb-4 font-display text-[0.62rem] font-bold uppercase tracking-[0.34em] text-gold-light">
              Founded by
            </p>
            <p className="font-serif text-[1.05rem] italic text-ivory/85">Ms. Javeria Malik</p>
          </div>
        </motion.div>
      </div>

      <div className="relative border-t border-ivory/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-center sm:flex-row sm:text-left">
          <p className="text-[0.78rem] text-ivory/45">
            © {year} Language Hub. All rights reserved.
          </p>
          <p className="font-display text-[0.6rem] font-bold uppercase tracking-[0.3em] text-ivory/35">
            Hub of Language Excellence
          </p>
        </div>
      </div>
    </footer>
  );
}