"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
  Newspaper,
  Star,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AuthNavButtons } from "@/components/navigation/AuthNavButtons";
import { AccountChip } from "@/components/navigation/AccountChip";
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

/** Lightweight section links (rendered as plain items, no heavy dropdown). */
const SITE_LINKS = [
  { id: "why", key: "nav.about", label: "About", icon: Info, note: "What makes learning here different" },
  { id: "reviews", key: "nav.reviews", label: "Reviews", icon: Star, note: "Real results from learners" },
  { id: "enroll", key: "nav.enroll", label: "How it works", icon: Layers, note: "Three simple steps to begin" },
] as const;

/** Only these section ids drive the nav underline — other page sections are ignored. */
const NAV_IDS = new Set<string>(["home", ...SITE_LINKS.map((l) => l.id)]);

/** Reading line — how far down the viewport a section must reach to count as active. */
const READ_LINE = 0.42;

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Navbar links stay calm and typographic. Hover reveals a faint underline;
 * the active section is marked by a slim blue underline that springs between
 * links (framer-motion layoutId) — no pill, no lift.
 */
export function Navbar() {
  const { dict } = useLang();
  const [active, setActive] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const onSite = pathname === "/";
  const isNews = pathname?.startsWith("/news") ?? false;
  const isCourses = pathname?.startsWith("/courses") ?? false;
  const courses = buildCourses(dict);
  // While a click-scroll is in flight, keep the clicked link highlighted even
  // though intermediate sections pass the reading line on the way there.
  const scrollLockRef = useRef<string | null>(null);
  const scrollLockTimerRef = useRef<number | undefined>(undefined);

  useBodyScrollLock(menuOpen);
  useEscapeKey(() => {
    setMenuOpen(false);
    setCoursesOpen(false);
  }, menuOpen || coursesOpen);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // Deterministic scroll-spy: the active section is simply the last
    // nav-tracked section whose top has crossed the reading line. No observer
    // races — document order decides, so "How it works" (which sits above
    // Reviews on the page) can never steal the underline on the way down.
    const sections = ["home", ...SITE_LINKS.map((l) => l.id)]
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
      .sort((a, b) => a.offsetTop - b.offsetTop);

    const update = () => {
      const line = window.innerHeight * READ_LINE;
      let current = "home";
      for (const s of sections) {
        if (s.getBoundingClientRect().top <= line) current = s.id;
      }
      const lock = scrollLockRef.current;
      if (lock) {
        // Arrived at the clicked section — release the lock and apply.
        if (current === lock) scrollLockRef.current = null;
        else return; // still scrolling; keep the clicked link highlighted
      }
      setActive(current);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    const close = () => {
      setCoursesOpen(false);
      setMenuOpen(false);
    };
    window.addEventListener("popstate", close);
    return () => window.removeEventListener("popstate", close);
  }, []);

  const go = async (id: string) => {
    setMenuOpen(false);
    setCoursesOpen(false);
    // Highlight the clicked link instantly and hold it there until the smooth
    // scroll actually arrives (intermediate sections must not steal it).
    if (NAV_IDS.has(id)) {
      window.clearTimeout(scrollLockTimerRef.current);
      scrollLockRef.current = id === "home" ? null : id;
      setActive(id);
      // Safety release — if the scroll is interrupted the lock must not stick.
      if (id !== "home") {
        scrollLockTimerRef.current = window.setTimeout(() => {
          scrollLockRef.current = null;
        }, 1500);
      }
    }
    if (!onSite) {
      try {
        sessionStorage.setItem("lh:scroll-to", id);
      } catch {}
      router.push("/");
      return;
    }
    const { scrollToId } = await import("@/lib/scroll");
    scrollToId(id);
  };

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
              "relative flex items-center justify-between gap-3 rounded-full border backdrop-blur-xl ring-1 ring-inset ring-white/50 transition-all duration-500 px-3 sm:px-6",
              scrolled
                ? "h-16 border-slate-200/80 bg-white/90 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.45)]"
                : "h-[4.2rem] border-slate-200/70 bg-white/85 shadow-[0_16px_50px_-30px_rgba(15,23,42,0.4)]"
            )}
          >
            {/* Logo */}
            <button
              type="button"
              onClick={() => go("home")}
              aria-label="Language Hub — back to top"
              className="group relative z-[60] flex shrink-0 items-center gap-2.5 pr-2"
            >
              <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-white ring-1 ring-white/70">
                <Image
                  src="/download/Geometric LH Ribbon Emblem.png"
                  alt="Language Hub"
                  width={48}
                  height={48}
                  priority
                  className="h-10 w-10 object-contain"
                />
              </span>
              <span className="hidden sm:flex items-center leading-none pl-1">
                <span className="font-display text-[0.92rem] font-extrabold tracking-[-0.01em] text-[#0B1B3A] leading-tight">
                  LANGUAGE<span className="text-[#2563EB]"> HUB</span>
                </span>
              </span>
            </button>

            {/* Center nav — calm and typographic; the active section gets a
                quiet static underline, nothing slides or grows on hover */}
            <div className="hidden items-center gap-1 lg:flex">
              {SITE_LINKS.map((l) => {
                const activeLink = active === l.id;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => go(l.id)}
                    aria-current={activeLink ? "true" : undefined}
                    className={cn(
                      "group relative inline-flex items-center rounded-full px-4 py-2.5 font-display text-[0.8rem] font-medium uppercase tracking-[0.08em] transition-colors duration-200",
                      activeLink ? "text-[#0B1B3A]" : "text-[#5A6B8C] hover:text-[#0B1B3A]"
                    )}
                  >
                    {dict[l.key] ?? l.label}
                    {activeLink ? (
                      <motion.span
                        layoutId="nav-underline"
                        transition={{ type: "spring", stiffness: 480, damping: 38 }}
                        className="absolute inset-x-3.5 bottom-[3px] h-[2px] rounded-full bg-[#2563EB]"
                      />
                    ) : (
                      <span
                        aria-hidden
                        className="absolute inset-x-3.5 bottom-[3px] h-[2px] origin-left scale-x-0 rounded-full bg-[#2563EB]/40 transition-transform duration-200 ease-out group-hover:scale-x-100"
                      />
                    )}
                  </button>
                );
              })}

              {/* Courses dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setCoursesOpen(true)}
                onMouseLeave={() => setCoursesOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setCoursesOpen((o) => !o)}
                  aria-expanded={coursesOpen}
                  aria-haspopup="true"
                  className={cn(
                    "group relative inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 font-display text-[0.8rem] font-medium uppercase tracking-[0.08em] transition-colors duration-200",
                    isCourses || coursesOpen
                      ? "text-[#0B1B3A]"
                      : "text-[#5A6B8C] hover:text-[#0B1B3A]"
                  )}
                >
                  Courses
                  <ChevronDown
                    className={cn("h-3.5 w-3.5", coursesOpen && "rotate-180")}
                    strokeWidth={2.2}
                  />
                  {isCourses ? (
                    <span
                      aria-hidden
                      className="absolute inset-x-3.5 bottom-[3px] h-[2px] rounded-full bg-[#2563EB]"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="absolute inset-x-3.5 bottom-[3px] h-[2px] origin-left scale-x-0 rounded-full bg-[#2563EB]/40 transition-transform duration-200 ease-out group-hover:scale-x-100"
                    />
                  )}
                </button>

                <AnimatePresence>
                  {coursesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute left-1/2 top-[calc(100%+0.7rem)] z-50 w-[38rem] -translate-x-1/2"
                    >
                      <span
                        aria-hidden
                        className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 rounded-[3px] border-l border-t border-white bg-white shadow-[0_-1px_2px_rgba(15,23,42,0.04)]"
                      />
                      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur-xl">
                        <div className="grid grid-cols-2 gap-1 p-2">
                          {courses.map((c) => (
                            <Link
                              key={c.slug}
                              href={`/courses/${c.slug}`}
                              onClick={() => setCoursesOpen(false)}
                              className="group relative flex items-start gap-3 rounded-xl px-3.5 py-3 transition-colors duration-150 hover:bg-slate-50"
                            >
                              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 ring-1 ring-slate-200/70 transition-colors duration-150 group-hover:bg-[#2563EB]/10 group-hover:text-[#1647C7] group-hover:ring-[#2563EB]/15">
                                <c.icon className="h-5 w-5" strokeWidth={1.9} />
                              </span>
                              <div className="flex min-w-0 flex-1 flex-col">
                                <span className="font-display text-[0.95rem] font-semibold text-slate-900">
                                  {c.name}
                                </span>
                                <span className="mt-0.5 line-clamp-2 text-[0.72rem] leading-relaxed text-slate-500">
                                  {c.tagline}
                                </span>
                              </div>
                              <ArrowUpRight className="h-4 w-4 text-slate-400 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
                            </Link>
                          ))}
                        </div>
                        <div className="border-t border-slate-100 bg-white px-4 py-3">
                          <Link
                            href="/courses"
                            onClick={() => setCoursesOpen(false)}
                            className="group inline-flex items-center gap-2 font-display text-[0.78rem] font-medium text-[#1647C7] transition-colors hover:text-[#2563EB]"
                          >
                            View all courses
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right */}
            <div className="relative z-[60] flex items-center gap-2 sm:gap-2.5">
              <AccountChip />
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
                aria-expanded={menuOpen}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 transition-colors hover:border-slate-300 hover:bg-white lg:hidden"
              >
                <Menu className="h-5 w-5" strokeWidth={1.8} />
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
                  <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-slate-200/70">
                    <Image
                      src="/download/Geometric LH Ribbon Emblem.png"
                      alt="Language Hub"
                      width={40}
                      height={40}
                      className="h-8 w-8 object-contain"
                    />
                  </span>
                  <span className="font-display text-[0.9rem] font-extrabold text-ink">
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
                    <LayoutGrid className="h-3.5 w-3.5" /> {dict["nav.programme"] ?? "Explore"}
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
                      {dict["nav.blog"] ?? "Blog"}
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