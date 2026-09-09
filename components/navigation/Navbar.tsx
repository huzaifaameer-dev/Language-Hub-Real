"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CalendarPlus,
  Info,
  MessageCircle,
  Star,
  ArrowRight,
  ChevronDown,
  GraduationCap,
  BookOpen,
  ClipboardList,
  Languages,
  Menu,
  Sparkles,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { AuthNavButtons } from "@/components/navigation/AuthNavButtons";
import { scrollToId } from "@/lib/lenis";
import { cn } from "@/lib/utils";
import { useBodyScrollLock } from "@/lib/hooks";
import { FocusTrap, useEscapeKey } from "@/components/ui/FocusTrap";
import { BookDemoButton } from "@/components/contact/BookDemoButton";
import { DemoBooking } from "@/components/contact/DemoBooking";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { useLang } from "@/components/LanguageProvider";
import { FALLBACK_COURSES, courseSlug } from "@/lib/course-data";

interface CourseItem {
  slug: string;
  name: string;
  tagline: string;
  icon: typeof GraduationCap;
}

/** Programme dropdown built from the live course catalogue. */
function buildCourses(dict: Record<string, string>): CourseItem[] {
  return FALLBACK_COURSES.map((c) => {
    const cfg: Record<string, { tagline: string; icon: typeof GraduationCap }> = {
      "Spoken English": {
        tagline: dict["nav.course.spoken"] ?? "Build real confidence",
        icon: Languages,
      },
      "IELTS Preparation": {
        tagline: dict["nav.course.ielts"] ?? "Reach Band 6.5+",
        icon: GraduationCap,
      },
      "PTE Preparation": {
        tagline: dict["nav.course.pte"] ?? "Computer-first, AI-scored",
        icon: ClipboardList,
      },
      "Duolingo English Test": {
        tagline: dict["nav.course.det"] ?? "Score 110+ fast",
        icon: BookOpen,
      },
    };
    const def = cfg[c.name] ?? { tagline: "Explore", icon: GraduationCap };
    return { slug: courseSlug(c.name), name: c.name, tagline: def.tagline, icon: def.icon };
  });
}

const PAGES = [
  { id: "about", key: "nav.about", icon: Info },
  { id: "reviews", key: "nav.reviews", icon: Star },
  { id: "faq", key: "nav.faq", icon: MessageCircle },
] as const;

export function Navbar() {
  const { dict, lang } = useLang();
  const isUr = lang === "ur";
  const [active, setActive] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [programmesOpen, setProgrammesOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const pathname = usePathname();
  const router = useRouter();
  const onSite = pathname === "/";
  const courses = buildCourses(dict);

  useBodyScrollLock(menuOpen);
  useEscapeKey(() => {
    setMenuOpen(false);
    setProgrammesOpen(false);
  }, menuOpen || programmesOpen);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
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

  // Close menus when the user navigates back/forward (external event).
  useEffect(() => {
    const close = () => {
      setProgrammesOpen(false);
      setMenuOpen(false);
    };
    window.addEventListener("popstate", close);
    return () => window.removeEventListener("popstate", close);
  }, []);

  const go = (id: string) => {
    setMenuOpen(false);
    setProgrammesOpen(false);
    if (!onSite) {
      try {
        sessionStorage.setItem("lh:scroll-to", id);
      } catch {}
      router.push("/");
      return;
    }
    scrollToId(id);
  };

  const activeCourse = pathname?.startsWith("/courses") ?? false;

  return (
    <>
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-x-0 top-0 z-[100]"
      >
        <ScrollProgress className="relative z-10 h-[3px] w-full" />

        <nav
          aria-label="Primary"
          className={cn(
            "mx-auto flex max-w-7xl items-center justify-between px-4 transition-all duration-500 sm:px-6 lg:px-8",
            scrolled ? "h-16" : "h-[4.6rem]"
          )}
          dir={isUr ? "rtl" : "ltr"}
        >
          {/* Wordmark */}
          <button
            type="button"
            onClick={() => go("home")}
            aria-label="Language Hub — back to top"
            className="group relative z-[60] flex shrink-0 items-center gap-2.5"
          >
            <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white shadow-[0_6px_18px_-6px_rgb(15_23_42/0.28)] ring-1 ring-black/[0.05] transition-transform duration-300 group-hover:scale-105">
              <Logo size="xs" eager />
            </span>
            <span className="flex flex-col items-start leading-none">
              <span className="font-display text-[0.95rem] font-extrabold tracking-[0.08em] text-ink">
                LANGUAGE<span className="gold-text"> HUB</span>
              </span>
            </span>
          </button>

          {/* Center nav — grouped + dropdown */}
          <div
            className={cn(
              "hidden items-center gap-0.5 rounded-full px-1.5 py-1 lg:flex",
              "relative border transition-all duration-500",
              scrolled
                ? "border-slate-200/80 bg-white/85 shadow-[0_18px_44px_-24px_rgb(79_70_229/0.3)] backdrop-blur-xl"
                : "border-transparent bg-white/0"
            )}
          >
            {/* Programmes dropdown trigger */}
            <div
              className="relative"
              onMouseEnter={() => !reduceMotion && setProgrammesOpen(true)}
              onMouseLeave={() => setProgrammesOpen(false)}
            >
              <button
                type="button"
                onClick={() => setProgrammesOpen((o) => !o)}
                aria-expanded={programmesOpen}
                aria-haspopup="true"
                className={cn(
                  "relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 font-display text-[0.78rem] font-bold tracking-[0.03em] transition-colors duration-300",
                  activeCourse ? "text-brand-deep" : "text-ink hover:text-ink"
                )}
              >
                {activeCourse && !reduceMotion && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-gradient-to-b from-brand/[0.14] to-brand/[0.06] ring-1 ring-brand/20"
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {dict["nav.courses"] ?? "Programmes"}
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform duration-300",
                      programmesOpen && "rotate-180"
                    )}
                    strokeWidth={2.4}
                  />
                </span>
              </button>

              <AnimatePresence>
                {programmesOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute left-1/2 top-[calc(100%+0.75rem)] w-[26rem] -translate-x-1/2"
                    role="menu"
                    aria-label={dict["nav.courses"] ?? "Programmes"}
                  >
                    <div className="overflow-hidden rounded-3xl border border-ink/[0.06] bg-white/95 p-2 shadow-[0_30px_80px_-28px_rgb(15_23_42/0.45)] backdrop-blur-xl">
                      <div className="flex items-center justify-between px-4 pb-2 pt-3">
                        <span className="font-display text-[0.62rem] font-bold uppercase tracking-[0.28em] text-gold-deep">
                          {dict["nav.courses"] ?? "Programmes"}
                        </span>
                        <span className="text-[0.62rem] font-semibold text-ink-3">
                          {dict["nav.programmes.hint"] ?? "4 proven paths"}
                        </span>
                      </div>
                      {courses.map((c) => (
                        <Link
                          key={c.slug}
                          href={`/courses/${c.slug}`}
                          onClick={() => setProgrammesOpen(false)}
                          role="menuitem"
                          className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors duration-200 hover:bg-brand/[0.05]"
                        >
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/[0.08] text-brand-deep transition-transform duration-300 group-hover:scale-105">
                            <c.icon className="h-5 w-5" strokeWidth={1.9} />
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="font-display text-[0.85rem] font-bold text-ink">
                              {c.name}
                            </span>
                            <span className="text-[0.7rem] font-medium text-ink-3">{c.tagline}</span>
                          </span>
                          <ArrowRight
                            className="h-4 w-4 -translate-x-1 text-brand opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                            strokeWidth={2}
                          />
                        </Link>
                      ))}
                      <div className="mt-1 flex items-center justify-between gap-2 border-t border-ink/[0.05] px-3 pb-2 pt-3">
                        <Link
                          href="/courses"
                          onClick={() => setProgrammesOpen(false)}
                          className="inline-flex items-center gap-1.5 font-display text-[0.72rem] font-bold text-brand-deep transition-colors hover:text-brand"
                        >
                          {dict["courses.viewAll"] ?? "View all courses"}
                          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => go("pricing")}
                          className="inline-flex items-center gap-1.5 font-display text-[0.72rem] font-bold text-brand-deep transition-colors hover:text-brand"
                        >
                          {dict["nav.pricing"] ?? "View pricing"}
                          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Page links */}
            {PAGES.map((p) => (
              <NavLink
                key={p.id}
                label={dict[p.key] ?? p.key}
                icon={p.icon}
                active={active === p.id}
                onClick={() => go(p.id)}
                reducedMotion={!!reduceMotion}
              />
            ))}

            {/* Blog — full page, always visible */}
            <Link
              href="/blog"
              aria-current={pathname?.startsWith("/blog") ? "page" : undefined}
              className={cn(
                "hidden items-center gap-1.5 rounded-full px-3.5 py-2 font-display text-[0.82rem] font-bold transition-all duration-300 lg:inline-flex",
                pathname?.startsWith("/blog")
                  ? "bg-brand/[0.09] text-brand-deep"
                  : "text-ink-2 hover:bg-brand/[0.06] hover:text-brand-deep"
              )}
            >
              <BookOpen className="h-4 w-4" strokeWidth={2} />
              {dict["nav.blog"] ?? "Blog"}
            </Link>
          </div>

          {/* Right actions */}
          <div className="relative z-[60] flex items-center gap-2 sm:gap-2.5">
            <Link
              href="/placement-test"
              className={cn(
                "hidden h-10 items-center gap-1.5 rounded-full px-4 font-display text-[0.78rem] font-bold transition-all duration-300 md:inline-flex",
                pathname === "/placement-test"
                  ? "bg-gradient-to-r from-brand-deep to-brand-magenta text-white shadow-[0_10px_24px_-10px_rgb(124_58_237/0.7)]"
                  : "bg-gradient-to-r from-brand-deep to-brand-magenta text-white shadow-[0_10px_24px_-10px_rgb(124_58_237/0.7)] hover:-translate-y-0.5 hover:brightness-110"
              )}
            >
              <Sparkles className="h-4 w-4" strokeWidth={2.2} />
              <span className="hidden xl:inline">{dict["nav.placement"] ?? "Placement Test"}</span>
              <span className="xl:hidden">{dict["nav.placement.short"] ?? "Free Test"}</span>
            </Link>
            <BookDemoLink />
            <LanguageToggle />
            <div className="hidden md:block">
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

        {/* Bottom hairline on scroll */}
        <div
          className={cn(
            "h-px w-full bg-gradient-to-r from-transparent via-ink/10 to-transparent transition-opacity duration-500",
            scrolled ? "opacity-100" : "opacity-0"
          )}
        />
      </motion.header>

      {/* Mobile drawer */}
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
              <div className="flex items-center justify-between px-6 py-4">
                <span className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-black/[0.05]">
                    <Logo size="xs" eager />
                  </span>
                  <span className="font-display text-[0.82rem] font-extrabold tracking-[0.08em]">
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

              <div className="flex flex-1 flex-col gap-1 px-6 py-5">
                <p className="mb-2 flex items-center gap-1.5 font-display text-[0.6rem] font-bold uppercase tracking-[0.3em] text-gold-deep">
                  <Sparkles className="h-3 w-3" /> {dict["nav.courses"] ?? "Programmes"}
                </p>
                {courses.map((c, i) => (
                  <motion.div
                    key={c.slug}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link
                      href={`/courses/${c.slug}`}
                      onClick={() => setMenuOpen(false)}
                      className="group flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-brand/[0.05]"
                    >
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/[0.08] text-brand-deep">
                        <c.icon className="h-5 w-5" strokeWidth={1.9} />
                      </span>
                      <span className="flex flex-col">
                        <span className="font-display text-base font-bold text-ink">{c.name}</span>
                        <span className="text-[0.7rem] font-medium text-ink-3">{c.tagline}</span>
                      </span>
                    </Link>
                  </motion.div>
                ))}

                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + courses.length * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href="/courses"
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center justify-between rounded-2xl border border-brand/20 bg-brand/[0.05] px-4 py-3 font-display text-base font-bold text-brand-deep transition-colors hover:bg-brand/[0.1]"
                  >
                    {dict["courses.viewAll"] ?? "View all courses"}
                    <ArrowRight className="h-5 w-5" strokeWidth={2.2} />
                  </Link>
                </motion.div>

                <div className="mt-3 border-t border-ink/[0.06] pt-4">
                  {PAGES.map((p, i) => (
                    <motion.button
                      key={p.id}
                      type="button"
                      onClick={() => go(p.id)}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className={cn(
                        "flex w-full items-center justify-between py-3 font-display text-lg font-bold tracking-tight transition-colors",
                        active === p.id ? "text-brand-deep" : "text-ink hover:text-brand-deep"
                      )}
                    >
                      {dict[p.key] ?? p.key}
                      <ArrowRight className="h-5 w-5 text-ink/25" strokeWidth={2} />
                    </motion.button>
                  ))}

                  {/* Blog — visible in the mobile menu */}
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + PAGES.length * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link
                      href="/blog"
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "flex w-full items-center justify-between py-3 font-display text-lg font-bold tracking-tight transition-colors",
                        pathname?.startsWith("/blog") ? "text-brand-deep" : "text-ink hover:text-brand-deep"
                      )}
                    >
                      <span className="flex items-center gap-2.5">
                        <BookOpen className="h-5 w-5 text-ink/40" strokeWidth={1.8} />
                        {dict["nav.blog"] ?? "Blog"}
                      </span>
                      <ArrowRight className="h-5 w-5 text-ink/25" strokeWidth={2} />
                    </Link>
                  </motion.div>
                </div>

                <div className="mt-3 border-t border-ink/[0.06] pt-4">
                  <Link
                    href="/placement-test"
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-brand-deep to-brand-magenta px-4 py-3.5 font-display text-base font-extrabold text-white transition-transform active:scale-[0.99]",
                      pathname === "/placement-test" && "ring-2 ring-brand/30 ring-offset-2 ring-offset-ivory"
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <Sparkles className="h-5 w-5" strokeWidth={2} />
                      {dict["nav.placement"] ?? "Placement Test"}
                    </span>
                    <ArrowRight className="h-5 w-5" strokeWidth={2.2} />
                  </Link>
                  <p className="mt-2 px-1 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-ink-3">
                    Free · 10 min · instant AI results
                  </p>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.45 }}
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

/** A single animated nav link with a shared gliding active pill. */
function NavLink({
  label,
  icon: Icon,
  active,
  onClick,
  reducedMotion,
}: {
  label: string;
  icon: typeof Info;
  active: boolean;
  onClick: () => void;
  reducedMotion: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 font-display text-[0.78rem] font-bold tracking-[0.03em] transition-colors duration-300",
        active ? "text-brand-deep" : "text-ink-2 hover:text-ink"
      )}
    >
      {active && !reducedMotion && (
        <motion.span
          layoutId="nav-pill"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className="absolute inset-0 rounded-full bg-gradient-to-b from-brand/[0.14] to-brand/[0.06] ring-1 ring-brand/20"
        />
      )}
      <Icon className={cn("h-3.5 w-3.5", active && "text-brand-deep")} strokeWidth={2} />
      <span className="relative z-10">{label}</span>
    </button>
  );
}

/** Compact circular "book a demo" button (icon-only, opens the booking modal). */
function BookDemoLink() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Book a free demo class"
        title="Book a free demo"
        className="hidden h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-white/70 text-ink-2 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/45 hover:text-brand-deep lg:inline-flex"
      >
        <CalendarPlus className="h-4.5 w-4.5" strokeWidth={1.9} />
      </button>
      <DemoBooking open={open} onClose={() => setOpen(false)} />
    </>
  );
}
