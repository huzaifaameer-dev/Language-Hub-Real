"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Menu, Sparkles, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { AuthNavButtons } from "@/components/navigation/AuthNavButtons";
import { scrollToId } from "@/lib/lenis";
import { cn } from "@/lib/utils";
import { useBodyScrollLock } from "@/lib/hooks";
import { FocusTrap, useEscapeKey } from "@/components/ui/FocusTrap";
import { BookDemoButton } from "@/components/contact/BookDemoButton";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { Magnetic } from "@/components/ui/Magnetic";
import { useLang } from "@/components/LanguageProvider";

/** In-page section anchors, labelled via the i18n dictionary. */
const SECTIONS = [
  { id: "home", key: "nav.home" },
  { id: "journey", key: "nav.journey" },
  { id: "about", key: "nav.about" },
  { id: "courses", key: "nav.courses" },
  { id: "pricing", key: "nav.pricing" },
  { id: "reviews", key: "nav.reviews" },
  { id: "faq", key: "nav.faq" },
] as const;

/** Standalone routes, labelled via the i18n dictionary. */
const ROUTES = [
  { href: "/team", key: "nav.team" },
  { href: "/placement-test", key: "nav.placement" },
  { href: "/blog", key: "nav.blog" },
] as const;

export function Navbar() {
  const { dict, lang } = useLang();
  const isUr = lang === "ur";
  const [active, setActive] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const pathname = usePathname();
  const router = useRouter();
  const onSite = pathname === "/";

  useBodyScrollLock(menuOpen);
  useEscapeKey(() => setMenuOpen(false), menuOpen);

  // Track scroll for the floating-glass transition.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Track the in-view section with an IntersectionObserver for the active pill.
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>("[data-section]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const go = (id: string) => {
    setMenuOpen(false);
    if (!onSite) {
      try {
        sessionStorage.setItem("lh:scroll-to", id);
      } catch {}
      router.push("/");
      return;
    }
    scrollToId(id);
  };

  return (
    <>
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-x-0 top-0 z-[100]"
      >
        {/* Scroll progress hairline */}
        <ScrollProgress className="relative z-10 h-[3px] w-full" />

        <nav
          aria-label="Primary"
          className="mx-auto flex max-w-7xl items-center justify-between px-4 transition-all duration-500 sm:px-6"
          style={{ height: scrolled ? "4rem" : "4.75rem" }}
        >
          {/* Logo */}
          <button
            type="button"
            onClick={() => go("home")}
            aria-label="Language Hub — back to top"
            className="group flex shrink-0 items-center gap-2.5"
          >
            <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white shadow-[0_6px_18px_-6px_rgb(15_23_42/0.25)] ring-1 ring-black/[0.05] transition-transform duration-300 group-hover:scale-105">
              <Logo size="xs" eager />
            </span>
            <span className="hidden font-display text-[0.82rem] font-extrabold tracking-[0.12em] text-ink sm:block">
              LANGUAGE<span className="gold-text"> HUB</span>
            </span>
          </button>

          {/* Desktop nav */}
          <div
            className={cn(
              "hidden items-center gap-0.5 rounded-2xl px-1.5 py-1 transition-all duration-500 lg:flex",
              scrolled
                ? "border border-white/60 bg-white/75 shadow-[0_10px_34px_-16px_rgb(15_23_42/0.35)] backdrop-blur-xl"
                : "border border-transparent bg-transparent"
            )}
            dir={isUr ? "rtl" : "ltr"}
          >
            {SECTIONS.map((s) => (
              <NavItemButton
                key={s.id}
                label={dict[s.key] ?? s.key}
                active={active === s.id}
                onClick={() => go(s.id)}
                reducedMotion={!!reduceMotion}
              />
            ))}
            {ROUTES.map((r) => (
              <NavItemButton
                key={r.href}
                label={dict[r.key] ?? r.key}
                active={onSite ? false : pathname?.startsWith(r.href) ?? false}
                onClick={() => router.push(r.href)}
                href={r.href}
                reducedMotion={!!reduceMotion}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="hidden md:block">
              <Magnetic strength={0.22} glare>
                <BookDemoButton className="h-10 px-5 text-[0.78rem]" />
              </Magnetic>
            </div>
            <LanguageToggle />
            <div className="hidden sm:block">
              <AuthNavButtons />
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className="group flex h-11 w-11 items-center justify-center rounded-xl border border-ink/10 bg-white/70 text-ink shadow-sm backdrop-blur transition-all duration-300 hover:border-brand/50 hover:text-brand-deep lg:hidden"
            >
              <Menu className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" strokeWidth={1.8} />
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
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[105] flex flex-col bg-ivory/95 backdrop-blur-2xl lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <FocusTrap active={menuOpen} className="flex h-full flex-col overflow-y-auto">
              {/* Sheet header */}
              <div className="flex items-center justify-between px-6 py-4">
                <span className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-black/[0.05]">
                    <Logo size="xs" eager />
                  </span>
                  <span className="font-display text-[0.82rem] font-extrabold tracking-[0.12em]">
                    LANGUAGE<span className="gold-text"> HUB</span>
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-ink/10 text-ink transition-all hover:bg-ink hover:text-ivory"
                >
                  <X className="h-5 w-5" strokeWidth={1.8} />
                </button>
              </div>

              <div className="mx-6 h-px bg-ink/[0.06]" />

              {/* Staggered links */}
              <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-6">
                <p className="mb-2 font-display text-[0.6rem] font-bold uppercase tracking-[0.3em] text-gold-deep">
                  <Sparkles className="mr-1 inline h-3 w-3" /> Explore
                </p>
                {SECTIONS.map((s, i) => {
                  const label = dict[s.key] ?? s.key;
                  return (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 + i * 0.05, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <button
                        type="button"
                        onClick={() => go(s.id)}
                        className={cn(
                          "group flex w-full items-center justify-between py-3.5 font-display text-[1.35rem] font-bold tracking-tight transition-all",
                          active === s.id
                            ? "text-brand-deep"
                            : "text-ink hover:translate-x-1 hover:text-brand-deep"
                        )}
                      >
                        {label}
                        <ArrowRight className="h-5 w-5 -translate-x-1 text-ink/25 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" strokeWidth={2} />
                      </button>
                    </motion.div>
                  );
                })}
                <motion.div
                  className="mt-1 border-t border-ink/[0.06] pt-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  {ROUTES.map((r, i) => (
                    <Link
                      key={r.href}
                      href={r.href}
                      onClick={() => setMenuOpen(false)}
                      className="group flex items-center gap-2 py-3 font-display text-base font-bold text-ink-2 transition-all hover:translate-x-1 hover:text-brand-deep"
                    >
                      <span className="font-mono text-[0.7rem] text-gold-deep">
                        0{i + SECTIONS.length + 1}
                      </span>
                      {dict[r.key] ?? r.key}
                    </Link>
                  ))}
                </motion.div>
              </div>

              {/* Sheet footer */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.45 }}
                className="mx-6 mb-6 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0_18px_40px_-24px_rgb(15_23_42/0.3)] ring-1 ring-black/[0.05]"
              >
                <BookDemoButton className="h-12 w-full" />
                <div className="flex items-center justify-between gap-3">
                  <AuthNavButtons />
                  <LanguageToggle />
                </div>
              </motion.div>
            </FocusTrap>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** A single nav pill with a spring-gliding active indicator behind it. */
function NavItemButton({
  label,
  active,
  onClick,
  href,
  reducedMotion,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  href?: string;
  reducedMotion: boolean;
}) {
  const inner = (
    <>
      {active && !reducedMotion && (
        <motion.span
          layoutId="nav-active-pill"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className="absolute inset-0 rounded-xl bg-gradient-to-b from-brand/[0.12] to-brand/[0.06] ring-1 ring-brand/20"
        />
      )}
      <span className="relative z-10">{label}</span>
    </>
  );

  const classes = cn(
    "relative inline-flex items-center px-3.5 py-2 font-display text-[0.76rem] font-bold tracking-[0.04em] transition-colors duration-300",
    active ? "text-brand-deep" : "text-ink-2 hover:text-ink"
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={classes}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={classes}>
      {inner}
    </button>
  );
}
