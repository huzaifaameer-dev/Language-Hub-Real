"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
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

const SECTIONS = [
  { id: "home", label: "Home" },
  { id: "journey", label: "Journey" },
  { id: "about", label: "About" },
  { id: "courses", label: "Courses" },
  { id: "pricing", label: "Pricing" },
  { id: "reviews", label: "Reviews" },
  { id: "faq", label: "FAQ" },
];

const LINKS = [
  { href: "/team", label: "Team" },
  { href: "/placement-test", label: "Placement Test" },
  { href: "/blog", label: "Blog" },
];

export function Navbar() {
  const [active, setActive] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const onSite = pathname === "/";

  useBodyScrollLock(menuOpen);
  useEscapeKey(() => setMenuOpen(false), menuOpen);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "fixed inset-x-0 top-0 z-[100] transition-all duration-500",
          scrolled ? "bg-white/80 backdrop-blur-xl shadow-[0_6px_24px_-16px_rgb(15_23_42/0.25)]" : "bg-transparent"
        )}
      >
        <nav
          aria-label="Primary"
          className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between px-5 sm:px-8"
        >
          <button
            type="button"
            onClick={() => go("home")}
            aria-label="Language Hub — back to top"
            className="flex items-center gap-2.5"
          >
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white shadow-[0_4px_14px_-6px_rgb(15_23_42/0.2)] ring-1 ring-black/[0.04]">
              <Logo size="xs" eager />
            </span>
            <span className="hidden font-display text-[0.8rem] font-extrabold tracking-[0.12em] text-ink sm:block">
              LANGUAGE<span className="gold-text"> HUB</span>
            </span>
          </button>

          <ul className="hidden items-center gap-0.5 lg:flex">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => go(s.id)}
                  className={cn(
                    "rounded-full px-3.5 py-2 font-display text-[0.78rem] font-semibold tracking-wide transition-colors duration-300",
                    active === s.id ? "bg-ink/[0.05] text-ink" : "text-ink-3 hover:text-ink"
                  )}
                >
                  {s.label}
                </button>
              </li>
            ))}
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={cn(
                    "rounded-full px-3.5 py-2 font-display text-[0.78rem] font-semibold tracking-wide transition-colors duration-300",
                    pathname?.startsWith(l.href) ? "bg-ink/[0.05] text-ink" : "text-ink-3 hover:text-ink"
                  )}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:block">
              <BookDemoButton className="h-10 px-5 text-[0.8rem]" />
            </div>
            <LanguageToggle />
            <AuthNavButtons />
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink/10 bg-white/70 text-ink transition-colors hover:bg-ink hover:text-ivory lg:hidden"
            >
              <Menu className="h-5 w-5" strokeWidth={1.8} />
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
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[105] flex flex-col bg-white lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <FocusTrap active={menuOpen} className="flex h-full flex-col">
              <div className="flex items-center justify-between px-6 py-4">
                <span className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-black/[0.05]">
                    <Logo size="xs" eager />
                  </span>
                  <span className="font-display text-[0.8rem] font-extrabold tracking-[0.12em]">
                    LANGUAGE<span className="gold-text"> HUB</span>
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink/10 text-ink hover:bg-ink hover:text-ivory"
                >
                  <X className="h-5 w-5" strokeWidth={1.8} />
                </button>
              </div>

              <div className="h-px w-full bg-ink/[0.06]" />

              <ul className="flex flex-1 flex-col justify-center gap-1 px-6">
                {SECTIONS.map((s, i) => (
                  <motion.li
                    key={s.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <button
                      type="button"
                      onClick={() => go(s.id)}
                      className={cn(
                        "flex w-full items-center justify-between border-b border-ink/[0.05] py-4 font-display text-lg font-bold text-ink transition-colors",
                        active === s.id ? "text-brand-deep" : "hover:text-ink/70"
                      )}
                    >
                      {s.label}
                      <span className="text-ink/30">→</span>
                    </button>
                  </motion.li>
                ))}
                {LINKS.map((l, i) => (
                  <motion.li
                    key={l.href}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + (SECTIONS.length + i) * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link
                      href={l.href}
                      onClick={() => setMenuOpen(false)}
                      className="flex w-full items-center justify-between border-b border-ink/[0.05] py-4 font-display text-lg font-bold text-ink transition-colors hover:text-ink/70"
                    >
                      {l.label}
                      <span className="text-ink/30">→</span>
                    </Link>
                  </motion.li>
                ))}
              </ul>

              <div className="border-t border-ink/[0.06] px-6 py-6">
                <div className="flex items-center justify-between">
                  <AuthNavButtons />
                </div>
              </div>
            </FocusTrap>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
