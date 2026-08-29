"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { AuthNavButtons } from "@/components/navigation/AuthNavButtons";
import { scrollToId } from "@/lib/lenis";
import { cn } from "@/lib/utils";
import { useBodyScrollLock } from "@/lib/hooks";
import { LangSwitch, useLang } from "@/lib/i18n";

const SECTIONS = [
  { id: "home", label: "navHome" },
  { id: "journey", label: "navJourney" },
  { id: "about", label: "navAbout" },
  { id: "courses", label: "navCourses" },
  { id: "resources", label: "navResources" },
  { id: "voice", label: "navVoice" },
  { id: "hub", label: "navHub" },
];

const number = (i: number) => String(i + 1).padStart(2, "0");

export function Navbar() {
  const [active, setActive] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useLang();

  useBodyScrollLock(menuOpen);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>("[data-section]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const go = (id: string) => {
    setMenuOpen(false);
    scrollToId(id);
  };

  return (
    <>
      <motion.header
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-x-0 top-0 z-[100] px-4 pt-4 sm:px-6"
      >
        <nav
          aria-label="Primary"
          className={cn(
            "mx-auto flex max-w-6xl items-center justify-between rounded-full px-4 py-2.5 transition-all duration-500 sm:px-5",
            scrolled ? "glass shadow-[0_18px_50px_-24px_rgb(34_30_43/0.35)]" : "bg-transparent"
          )}
        >
          <button
            type="button"
            onClick={() => go("home")}
            className="flex items-center gap-3 rounded-full focus-visible:outline-brand"
            aria-label="Language Hub — back to top"
          >
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_6px_18px_-8px_rgb(34_30_43/0.4)]">
              <Logo size="xs" eager />
            </span>
            <span className="hidden font-display text-[0.78rem] font-extrabold tracking-[0.2em] text-ink sm:block">
              LANGUAGE<span className="gold-text"> HUB</span>
            </span>
          </button>

          <ul className="hidden items-center gap-1 lg:flex">
            {SECTIONS.map((section, i) => (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => go(section.id)}
                  aria-current={active === section.id ? "true" : undefined}
                  className={cn(
                    "group flex items-center gap-2 rounded-full px-3 py-2 font-display text-[0.7rem] font-bold uppercase tracking-[0.18em] transition-colors duration-300",
                    active === section.id ? "text-brand-deep" : "text-ink-3 hover:text-ink"
                  )}
                >
                  <span className="text-[0.58rem] tracking-[0.1em] text-gold-deep/80">
                    {number(i)}
                  </span>
                  <span className="relative">
                    {t(section.label)}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute -bottom-1 left-0 h-px bg-gradient-to-r from-brand to-brand-magenta transition-all duration-500",
                        active === section.id ? "w-full" : "w-0 group-hover:w-full"
                      )}
                    />
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2 sm:gap-3">
            <AuthNavButtons />
            <LangSwitch />
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 bg-ivory/70 text-ink backdrop-blur-md transition-colors duration-300 hover:border-brand/50 hover:text-brand focus-visible:outline-brand lg:hidden"
            >
              <Menu className="h-4.5 w-4.5" strokeWidth={1.8} />
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[105] flex flex-col bg-ink text-ivory lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="pointer-events-none absolute inset-0 grain" />
            <div className="aurora-blob left-[-20%] top-[-10%] h-[45vh] w-[45vh] bg-brand/25" />

            <div className="relative flex items-center justify-between px-5 pt-5">
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white">
                  <Logo size="xs" eager />
                </span>
                <span className="font-display text-[0.8rem] font-extrabold tracking-[0.2em]">
                  LANGUAGE<span className="gold-text"> HUB</span>
                </span>
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-ivory/20 text-ivory transition-colors duration-300 hover:border-gold/60 hover:text-gold-light"
              >
                <X className="h-5 w-5" strokeWidth={1.8} />
              </button>
            </div>

            <ul className="relative flex flex-1 flex-col justify-center gap-2 px-8">
              {SECTIONS.map((section, i) => (
                <li key={section.id}>
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + i * 0.06, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => go(section.id)}
                    className={cn(
                      "group flex items-baseline gap-4 py-2 text-left font-display font-extrabold uppercase tracking-tight transition-colors duration-300",
                      active === section.id ? "text-gold-light" : "text-ivory/85 hover:text-ivory"
                    )}
                  >
                    <span className="text-[0.65rem] font-bold tracking-[0.2em] text-gold/70">
                      {number(i)}
                    </span>
                    <span className="text-[clamp(2rem,8vw,3rem)] leading-none">
                      {t(section.label)}
                    </span>
                    {active === section.id && (
                      <span className="h-2 w-2 rounded-full bg-gold" />
                    )}
                  </motion.button>
                </li>
              ))}
            </ul>

            <p className="relative pb-10 text-center font-display text-[0.62rem] font-semibold uppercase tracking-[0.4em] text-ivory/50">
              {t("tagline")}
            </p>
            <div className="relative flex justify-center gap-3 px-8 pb-8">
              <AuthNavButtons variant="dark" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}