"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  ClipboardList,
  GraduationCap,
  Info,
  Languages,
  Layers,
  LayoutGrid,
  Menu,
  MessageCircle,
  Newspaper,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { AuthNavButtons } from "@/components/navigation/AuthNavButtons";
import { cn } from "@/lib/utils";
import { useBodyScrollLock } from "@/lib/hooks";
import { FocusTrap, useEscapeKey } from "@/components/ui/FocusTrap";
import { BookDemoButton } from "@/components/contact/BookDemoButton";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { useLang } from "@/components/LanguageProvider";
import { FALLBACK_COURSES, courseSlug } from "@/lib/course-data";

interface CourseItem {
  slug: string;
  name: string;
  tagline: string;
  icon: typeof GraduationCap;
}

function buildCourses(dict: Record<string, string>): CourseItem[] {
  return FALLBACK_COURSES.map((c) => {
    const cfg: Record<string, { tagline: string; icon: typeof GraduationCap }> = {
      "Spoken English": { tagline: dict["nav.course.spoken"] ?? "Build real confidence", icon: Languages },
      "IELTS Preparation": { tagline: dict["nav.course.ielts"] ?? "Reach Band 6.5+", icon: GraduationCap },
      "PTE Preparation": { tagline: dict["nav.course.pte"] ?? "Computer-first, AI-scored", icon: ClipboardList },
      "Duolingo English Test": { tagline: dict["nav.course.det"] ?? "Score 110+ fast", icon: BookOpen },
    };
    const def = cfg[c.name] ?? { tagline: "Explore", icon: GraduationCap };
    return { slug: courseSlug(c.name), name: c.name, tagline: def.tagline, icon: def.icon };
  });
}

/** Programme dropdown — website sections. */
const SITE_LINKS = [
  { id: "about", key: "nav.about", label: "About", icon: Info, note: "Who we are & what we stand for" },
  { id: "why", key: "nav.why-choose", label: "Why choose us", icon: Star, note: "The Language Hub difference" },
  { id: "journey", key: "nav.journey", label: "Journey", icon: Layers, note: "Your path to fluency" },
  { id: "reviews", key: "nav.reviews", label: "Reviews", icon: Star, note: "Real results from learners" },
  { id: "faq", key: "nav.faq", label: "FAQ", icon: MessageCircle, note: "Answers to common questions" },
] as const;

const ease = [0.16, 1, 0.3, 1] as const;

export function Navbar() {
  const { dict } = useLang();
  const [active, setActive] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [siteOpen, setSiteOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const pathname = usePathname();
  const router = useRouter();
  const onSite = pathname === "/";
  const isNews = pathname?.startsWith("/news") ?? false;
  const isCourses = pathname?.startsWith("/courses") ?? false;
  const courses = buildCourses(dict);

  useBodyScrollLock(menuOpen);
  useEscapeKey(() => {
    setMenuOpen(false);
    setCoursesOpen(false);
    setSiteOpen(false);
  }, menuOpen || coursesOpen || siteOpen);

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

  useEffect(() => {
    const close = () => {
      setCoursesOpen(false);
      setSiteOpen(false);
      setMenuOpen(false);
    };
    window.addEventListener("popstate", close);
    return () => window.removeEventListener("popstate", close);
  }, []);

  const go = async (id: string) => {
    setMenuOpen(false);
    setCoursesOpen(false);
    setSiteOpen(false);
    if (!onSite) {
      try {
        sessionStorage.setItem("lh:scroll-to", id);
      } catch {}
      router.push("/");
      return;
    }
    const { scrollToId } = await import("@/lib/lenis");
    scrollToId(id);
  };

  const under = (visible: boolean) =>
    visible && !reduceMotion && (
      <motion.span
        layoutId="nav-underline"
        transition={{ type: "spring", stiffness: 420, damping: 34 }}
        className="absolute inset-x-3 -bottom-[0.55rem] h-[2.5px] rounded-full bg-gradient-to-r from-[#2563EB] to-[#6D4AFF]"
      />
    );

  return (
    <>
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease }}
        className="fixed inset-x-0 top-0 z-[100]"
      >
        <ScrollProgress className="h-[3px] w-full" />

        <div className="mx-auto max-w-[1440px] px-3 pt-3.5 sm:px-6 lg:px-8">
          <nav
            aria-label="Primary"
            dir="ltr"
            className={cn(
              "relative flex items-center justify-between gap-3 rounded-[1.75rem] border backdrop-blur-xl ring-1 ring-inset ring-white/50 transition-all duration-500 sm:px-6",
              scrolled
                ? "h-16 border-[#C7D6EE] bg-[#DFE8F6]/92 shadow-[0_18px_48px_-26px_rgb(11_27_58/0.32)]"
                : "h-[4.3rem] border-[#D2DEED] bg-[#E8EEF8]/92 shadow-[0_14px_40px_-24px_rgb(11_27_58/0.26)]"
            )}
          >
            {/* Logo */}
            <button
              type="button"
              onClick={() => go("home")}
              aria-label="Language Hub — back to top"
              className="group relative z-[60] flex shrink-0 items-center gap-2.5"
            >
              <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#6D4AFF] shadow-[0_10px_24px_-10px_rgb(37_99_235/0.55)]">
                <Logo size="xs" eager className="h-6 w-6 rounded-lg object-contain" />
              </span>
              <span className="flex flex-col items-start leading-none">
                <span className="font-display text-[0.95rem] font-extrabold tracking-[0.02em] text-[#0B1B3A]">
                  LANGUAGE<span className="text-[#2563EB]"> HUB</span>
                </span>
                <span className="mt-1 hidden font-mono text-[0.48rem] font-bold uppercase tracking-[0.24em] text-ink-3 sm:block">
                  English Academy &amp; Learning Centre
                </span>
              </span>
            </button>

            {/* Center nav — COURSES / PROGRAMME / DAILY NEWS */}
            <div className="hidden items-center gap-0.5 lg:flex">
              {/* COURSES dropdown */}
              <div
                className="relative"
                onMouseEnter={() => !reduceMotion && setCoursesOpen(true)}
                onMouseLeave={() => setCoursesOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setCoursesOpen((o) => !o)}
                  aria-expanded={coursesOpen}
                  aria-haspopup="true"
                  className={cn(
                    "group relative py-2.5",
                    isCourses || coursesOpen ? "text-[#2563EB]" : "text-ink-2 hover:text-ink"
                  )}
                >
                  <span className="relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 font-display text-[0.8rem] font-extrabold uppercase tracking-[0.06em] transition-colors hover:bg-white/70">
                    <GraduationCap className={cn("h-4 w-4", isCourses || coursesOpen ? "text-[#2563EB]" : "text-[#94A3B8]")} strokeWidth={2.2} />
                    COURSES
                    <ChevronDown className={cn("h-3.5 w-3.5 text-[#94A3B8] transition-transform duration-300", coursesOpen && "rotate-180")} strokeWidth={2.6} />
                  </span>
                  {(coursesOpen || isCourses) && under(true)}
                </button>

                <AnimatePresence>
                  {coursesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.98 }}
                      transition={{ duration: 0.24, ease }}
                      className="absolute left-1/2 top-[calc(100%+0.6rem)] z-50 w-[36rem] -translate-x-1/2"
                    >
                      <span aria-hidden className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 rounded-[3px] border-l border-t border-[#E6EDFF] bg-white" />
                      <div className="grid grid-cols-[1.25fr_0.75fr] overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white/95 shadow-[0_30px_70px_-30px_rgb(11_27_58/0.25)] backdrop-blur-xl">
                        {/* Courses list */}
                        <div className="p-2">
                          <p className="px-3 pb-1 pt-2 font-mono text-[0.56rem] font-bold uppercase tracking-[0.3em] text-[#1647C7]">
                            {dict["nav.courses"] ?? "Courses"}
                          </p>
                          {courses.map((c) => (
                            <Link
                              key={c.slug}
                              href={`/courses/${c.slug}`}
                              onClick={() => setCoursesOpen(false)}
                              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[#2563EB]/[0.05]"
                            >
                              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#2563EB]/[0.08] text-[#1647C7] transition-transform group-hover:scale-105">
                                <c.icon className="h-5 w-5" strokeWidth={1.9} />
                              </span>
                              <span className="flex min-w-0 flex-1 flex-col">
                                <span className="font-display text-[0.85rem] font-bold text-ink">{c.name}</span>
                                <span className="text-[0.68rem] font-medium text-ink-3">{c.tagline}</span>
                              </span>
                              <ArrowUpRight className="h-4 w-4 -translate-x-1 translate-y-1 text-[#2563EB] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" strokeWidth={2} />
                            </Link>
                          ))}
                          <Link href="/courses" onClick={() => setCoursesOpen(false)} className="mt-1 inline-flex items-center gap-1.5 border-t border-[#E2E8F0] px-3 pb-1 pt-2.5 font-display text-[0.72rem] font-bold text-[#1647C7] hover:text-[#2563EB]">
                            {dict["courses.viewAll"] ?? "View all courses"} <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.6} />
                          </Link>
                        </div>

                        {/* Placement Test feature card */}
                        <div className="flex border-l border-[#E2E8F0] p-3">
                          <div className="flex w-full flex-col justify-between overflow-hidden rounded-xl bg-gradient-to-br from-[#2563EB] via-[#1647C7] to-[#6D4AFF] p-4 text-white shadow-[0_18px_40px_-20px_rgb(37_99_235/0.8)]">
                            <div>
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 font-mono text-[0.55rem] font-bold uppercase tracking-[0.18em] text-white backdrop-blur">
                                <Sparkles className="h-3 w-3" /> Free · AI
                              </span>
                              <p className="mt-3 font-display text-[0.9rem] font-black leading-snug">
                                {dict["nav.placement"] ?? "Placement Test"}
                              </p>
                              <p className="mt-1 text-[0.64rem] font-medium leading-relaxed text-white/70">
                                Assess your level in 10 minutes — instant AI results.
                              </p>
                            </div>
                            <Link
                              href="/placement-test"
                              onClick={() => setCoursesOpen(false)}
                              className="group mt-4 inline-flex w-full items-center justify-between rounded-lg bg-white px-3 py-2.5 font-display text-[0.7rem] font-black uppercase tracking-[0.12em] text-[#1647C7] transition-all duration-300 hover:shadow-lg"
                            >
                              Start now
                              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={2.4} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* PROGRAMME dropdown */}
              <div
                className="relative"
                onMouseEnter={() => !reduceMotion && setSiteOpen(true)}
                onMouseLeave={() => setSiteOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setSiteOpen((o) => !o)}
                  aria-expanded={siteOpen}
                  aria-haspopup="true"
                  className={cn(
                    "group relative py-2.5",
                    siteOpen ? "text-[#2563EB]" : "text-ink-2 hover:text-ink"
                  )}
                >
                  <span className="relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 font-display text-[0.8rem] font-extrabold uppercase tracking-[0.06em] transition-colors hover:bg-white/70">
                    <LayoutGrid className={cn("h-4 w-4", siteOpen ? "text-[#2563EB]" : "text-[#94A3B8]")} strokeWidth={2.2} />
                    OVERVIEW
                    <ChevronDown className={cn("h-3.5 w-3.5 text-[#94A3B8] transition-transform duration-300", siteOpen && "rotate-180")} strokeWidth={2.6} />
                  </span>
                  {siteOpen && under(true)}
                </button>

                <AnimatePresence>
                  {siteOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.98 }}
                      transition={{ duration: 0.24, ease }}
                      className="absolute left-1/2 top-[calc(100%+0.6rem)] z-50 w-[24rem] -translate-x-1/2"
                    >
                      <span aria-hidden className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 rounded-[3px] border-l border-t border-[#E6EDFF] bg-white" />
                      <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white/95 p-2 shadow-[0_30px_70px_-30px_rgb(11_27_58/0.25)] backdrop-blur-xl">
                        <p className="px-3 pb-1 pt-2 font-mono text-[0.56rem] font-bold uppercase tracking-[0.3em] text-[#1647C7]">
                          {dict["nav.programme"] ?? "Overview"}
                        </p>
                        {SITE_LINKS.map((l) => (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => go(l.id)}
                            className={cn(
                              "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[#2563EB]/[0.05]",
                              active === l.id && "bg-[#2563EB]/[0.04]"
                            )}
                          >
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#6D4AFF]/[0.08] text-[#6D4AFF] transition-transform group-hover:scale-105">
                              <l.icon className="h-5 w-5" strokeWidth={1.9} />
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col">
                              <span className="font-display text-[0.85rem] font-bold text-ink">{dict[l.key] ?? l.label}</span>
                              <span className="text-[0.68rem] font-medium text-ink-3">{l.note}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* NEWS — blue live CTA */}
              <Link
                href="/news"
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "relative inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-display text-[0.78rem] font-extrabold uppercase tracking-[0.06em] transition-all duration-300",
                  isNews
                    ? "bg-gradient-to-r from-[#2563EB] to-[#6D4AFF] text-white shadow-[0_10px_24px_-10px_rgb(37_99_235/0.7)]"
                    : "border border-[#BFD3FF] bg-white/70 text-[#1647C7] hover:bg-white hover:shadow-[0_10px_24px_-12px_rgb(37_99_235/0.45)]"
                )}
              >
                {/* pulsing live dot */}
                <span className="relative flex h-2.5 w-2.5">
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inline-flex h-full w-full rounded-full",
                      isNews ? "bg-white/70" : "bg-[#2563EB]/50"
                    )}
                    style={{ animation: "ping 1.6s cubic-bezier(0,0,0.2,1) infinite" }}
                  />
                  <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", isNews ? "bg-white" : "bg-[#2563EB]")} />
                </span>
                <Newspaper className={cn("h-4 w-4", isNews ? "text-white" : "text-[#2563EB]")} strokeWidth={2.2} />
                NEWS
              </Link>
            </div>

            {/* Right */}
            <div className="relative z-[60] flex items-center gap-2 sm:gap-2.5">
              <BookDemoButton className="hidden h-11 rounded-full px-5 text-[0.78rem] lg:inline-flex" />
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
                aria-expanded={menuOpen}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E6EDFF] bg-white/80 text-ink transition-colors hover:border-[#2563EB]/50 lg:hidden"
              >
                <Menu className="h-5 w-5" strokeWidth={1.9} />
              </button>
            </div>
          </nav>
        </div>
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
                  <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-[#2563EB] to-[#6D4AFF]">
                    <Logo size="xs" eager className="h-5 w-5 rounded-lg object-contain" />
                  </span>
                  <span className="font-display text-[0.85rem] font-extrabold text-ink">
                    LANGUAGE<span className="text-[#2563EB]"> HUB</span>
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
                <p className="mb-2 flex items-center gap-2 font-mono text-[0.6rem] font-bold uppercase tracking-[0.3em] text-[#1647C7]">
                  <GraduationCap className="h-3.5 w-3.5" /> {dict["nav.courses"] ?? "Courses"}
                </p>
                {courses.map((c) => (
                  <Link key={c.slug} href={`/courses/${c.slug}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-[#2563EB]/[0.05]">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#2563EB]/[0.08] text-[#1647C7]">
                      <c.icon className="h-5 w-5" strokeWidth={1.9} />
                    </span>
                    <span className="flex flex-col">
                      <span className="font-display text-base font-bold text-ink">{c.name}</span>
                      <span className="text-[0.68rem] font-medium text-ink-3">{c.tagline}</span>
                    </span>
                  </Link>
                ))}
                <Link href="/courses" onClick={() => setMenuOpen(false)} className="mt-1 flex w-full items-center justify-between rounded-xl border border-[#2563EB]/20 bg-[#2563EB]/[0.05] px-4 py-3 font-display text-[0.9rem] font-bold text-[#1647C7]">
                  {dict["courses.viewAll"] ?? "View all courses"} <ArrowRight className="h-5 w-5" strokeWidth={2.2} />
                </Link>

                <div className="mt-4 border-t border-ink/[0.06] pt-4">
                  <p className="mb-2 flex items-center gap-2 font-mono text-[0.6rem] font-bold uppercase tracking-[0.3em] text-[#6D4AFF]">
                    <LayoutGrid className="h-3.5 w-3.5" /> {dict["nav.programme"] ?? "Overview"}
                  </p>
                  {SITE_LINKS.map((l, i) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => go(l.id)}
                      className={cn(
                        "flex w-full items-center justify-between py-3 font-display text-lg font-bold tracking-tight transition-colors",
                        active === l.id ? "text-[#2563EB]" : "text-ink hover:text-[#2563EB]"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <span className="w-6 font-mono text-[0.6rem] font-bold text-ink-3">0{i + 1}</span>
                        <l.icon className="h-5 w-5 text-ink/30" strokeWidth={1.9} />
                        {dict[l.key] ?? l.label}
                      </span>
                      <ArrowRight className="h-5 w-5 text-ink/25" strokeWidth={2} />
                    </button>
                  ))}
                  <Link
                    href="/news"
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex w-full items-center justify-between py-3 font-display text-lg font-bold tracking-tight transition-colors",
                      isNews ? "text-[#2563EB]" : "text-ink hover:text-[#2563EB]"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-6 font-mono text-[0.6rem] font-bold text-ink-3">0{SITE_LINKS.length + 1}</span>
                      <Newspaper className="h-5 w-5 text-ink/30" strokeWidth={1.9} />
                      News
                    </span>
                    <ArrowRight className="h-5 w-5 text-ink/25" strokeWidth={2} />
                  </Link>
                </div>
              </div>

              <div className="mx-6 mb-6 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0_18px_40px_-24px_rgb(15_23_42/0.3)] ring-1 ring-ink/[0.05]">
                <BookDemoButton className="h-12 w-full" />
                <div className="flex flex-col gap-3">
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