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
  Languages,
  Menu,
  NotebookPen,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Logo, Wordmark } from "@/components/ui/Logo";
import { AuthNavButtons } from "@/components/navigation/AuthNavButtons";
import { SiteSearch } from "@/components/navigation/SiteSearch";
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

/** Section links — the same five-beat rhythm as the reference navbar. */
const SITE_LINKS = [
  { id: "reviews", key: "nav.reviews", label: "Reviews", icon: Star, note: "Real results from learners" },
  { id: "why", key: "nav.about", label: "About", icon: Sparkles, note: "Why learning here is different" },
] as const;

const NAV_IDS = new Set<string>(["home", ...SITE_LINKS.map((l) => l.id)]);

const READ_LINE = 0.42;
const ease = [0.16, 1, 0.3, 1] as const;

/**
 * The reference navbar: a clean white rail, a compact wordmark on the left,
 * five calm links in the middle, and a search pill plus dark identity square
 * on the right. The active section is marked with a short teal stroke that
 * glides between links.
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
  const isCourses = pathname?.startsWith("/courses") ?? false;
  const isBlog = pathname?.startsWith("/blog") ?? false;
  const courses = buildCourses(dict);
  const scrollLockRef = useRef<string | null>(null);
  const scrollLockTimerRef = useRef<number | undefined>(undefined);

  useBodyScrollLock(menuOpen);
  useEscapeKey(() => {
    setMenuOpen(false);
    setCoursesOpen(false);
  }, menuOpen || coursesOpen);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
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
        if (current === lock) scrollLockRef.current = null;
        else return;
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
    if (NAV_IDS.has(id)) {
      window.clearTimeout(scrollLockTimerRef.current);
      scrollLockRef.current = id === "home" ? null : id;
      setActive(id);
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
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease }}
        className="fixed inset-x-0 top-0 z-[100]"
      >
        <ScrollProgress className="h-[2px] w-full" />

        <div
          className={cn(
            "border-b transition-all duration-400",
            scrolled
              ? "border-[#e3ede9] bg-white/95 shadow-[0_14px_36px_-30px_rgba(6,46,40,0.45)] backdrop-blur-xl"
              : "border-transparent bg-white/75 backdrop-blur-md"
          )}
        >
          <nav
            aria-label="Primary"
            dir="ltr"
            className={cn(
              "mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 transition-all duration-400 sm:px-8",
              scrolled ? "h-[4.25rem]" : "h-[4.9rem]"
            )}
          >
            {/* Logo */}
            <button
              type="button"
              onClick={() => go("home")}
              aria-label="Language Hub — back to top"
              className="group relative z-[60] flex shrink-0 items-center gap-2.5"
            >
              <span className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-[0.9rem] bg-white ring-1 ring-[#e3ede9] transition-transform duration-500 group-hover:-rotate-3 group-hover:scale-105">
                <Logo mode="chip" size="xs" priority className="h-10 w-10" />
              </span>
              <span className="hidden sm:block">
                <Wordmark compact />
              </span>
            </button>

            {/* Centre nav */}
            <div className="hidden items-center gap-0.5 lg:flex">
              {/* Home carries the small "New" chip from the reference */}
              <button
                type="button"
                onClick={() => go("home")}
                aria-current={active === "home" ? "true" : undefined}
                className={cn(
                  "group relative inline-flex h-10 items-center rounded-full px-4 font-display text-[0.82rem] font-semibold tracking-[-0.01em] transition-colors duration-300",
                  active === "home" ? "text-ink" : "text-ink-2 hover:text-ink"
                )}
              >
                <span className="nav-new">New</span>
                Home
                <NavStroke show={active === "home"} />
              </button>

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
                    "group relative inline-flex h-10 items-center gap-1.5 rounded-full px-4 font-display text-[0.82rem] font-semibold tracking-[-0.01em] transition-colors duration-300",
                    isCourses || coursesOpen ? "text-ink" : "text-ink-2 hover:text-ink"
                  )}
                >
                  Courses
                  <ChevronDown
                    className={cn("h-3.5 w-3.5 text-ink-3 transition-transform duration-300", coursesOpen && "rotate-180")}
                    strokeWidth={2.2}
                  />
                  <NavStroke show={isCourses} />
                </button>

                <AnimatePresence>
                  {coursesOpen ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.985 }}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      className="absolute left-1/2 top-[calc(100%+0.85rem)] z-50 w-[40rem] -translate-x-1/2"
                    >
                      <span
                        aria-hidden
                        className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 rounded-[3px] border-l border-t border-[#e3ede9] bg-white"
                      />
                      <div className="overflow-hidden rounded-3xl border border-[#e3ede9] bg-white shadow-[0_44px_90px_-42px_rgba(6,46,40,0.42)]">
                        <span aria-hidden className="block h-1 w-full bg-[linear-gradient(90deg,#0f6b5c,#14a08c,#f5b93c,#fb6a47)]" />
                        <div className="grid grid-cols-2 gap-1 p-2.5">
                          {courses.map((c, i) => (
                            <Link
                              key={c.slug}
                              href={`/courses/${c.slug}`}
                              onClick={() => setCoursesOpen(false)}
                              className="group relative flex items-start gap-3 rounded-2xl px-3.5 py-3 transition-all duration-300 hover:bg-[#f3fbf8]"
                            >
                              <span
                                className={cn(
                                  "grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white shadow-[0_10px_20px_-12px_rgba(10,78,67,0.7)] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105",
                                  i === 1 && "bg-[#fb6a47]",
                                  i === 2 && "bg-[#f5b93c]",
                                  i === 3 && "bg-[#14a08c]",
                                  i === 0 && "bg-[#0f6b5c]"
                                )}
                              >
                                <c.icon className="h-5 w-5" strokeWidth={1.9} />
                              </span>
                              <div className="flex min-w-0 flex-1 flex-col">
                                <span className="font-display text-[0.93rem] font-semibold text-ink">
                                  {c.name}
                                </span>
                                <span className="mt-0.5 line-clamp-1 font-sans text-[0.72rem] leading-relaxed text-ink-3">
                                  {c.tagline}
                                </span>
                              </div>
                              <ArrowUpRight className="h-4 w-4 shrink-0 text-[#9ab5ae] opacity-0 transition-opacity group-hover:opacity-100" />
                            </Link>
                          ))}
                        </div>
                        <div className="border-t border-[#eef5f2] px-4 py-3">
                          <Link
                            href="/courses"
                            onClick={() => setCoursesOpen(false)}
                            className="group inline-flex items-center gap-2 font-display text-[0.78rem] font-semibold text-[#0f6b5c] transition-colors hover:text-[#0a4e43]"
                          >
                            Compare all programmes
                            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={2.2} />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              {SITE_LINKS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => go(l.id)}
                  aria-current={active === l.id ? "true" : undefined}
                  className={cn(
                    "group relative inline-flex h-10 items-center rounded-full px-4 font-display text-[0.82rem] font-semibold tracking-[-0.01em] transition-colors duration-300",
                    active === l.id ? "text-ink" : "text-ink-2 hover:text-ink"
                  )}
                >
                  {dict[l.key] ?? l.label}
                  <NavStroke show={active === l.id} />
                </button>
              ))}

              {/* The Journal: a quiet, always-underlined link with its own icon. */}
              <Link
                href="/blog"
                onClick={() => {
                  setCoursesOpen(false);
                  setMenuOpen(false);
                }}
                className={cn(
                  "group relative inline-flex h-10 items-center gap-1.5 rounded-full px-4 font-display text-[0.82rem] font-semibold tracking-[-0.01em] transition-colors duration-300",
                  isBlog ? "text-[#0d5c4d]" : "text-ink-2 hover:text-[#0d5c4d]"
                )}
              >
                <NotebookPen
                  className="h-3.5 w-3.5 text-[#14a08c] transition-transform duration-300 group-hover:-rotate-6"
                  strokeWidth={2.2}
                />
                Blog
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-4 bottom-1 h-[2px] origin-left rounded-full bg-[linear-gradient(90deg,#0f6b5c,#14a08c_58%,#f26a4a)] transition-transform duration-300 ease-out",
                    isBlog ? "scale-x-100" : "scale-x-[0.45] group-hover:scale-x-100"
                  )}
                />
              </Link>
            </div>

            {/* Right cluster */}
            <div className="relative z-[60] flex items-center gap-2.5">
              <SiteSearch />
              <AuthNavButtons />
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
                aria-expanded={menuOpen}
                className="grid h-11 w-11 place-items-center rounded-2xl border border-[#dfeae6] bg-[#f5f9f8] text-ink transition-colors hover:border-[#9fd8cb] hover:bg-white lg:hidden"
              >
                <Menu className="h-5 w-5" strokeWidth={1.9} />
              </button>
            </div>
          </nav>
        </div>
      </motion.header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[105] flex flex-col bg-white lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <FocusTrap active={menuOpen} className="flex h-full flex-col overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#eef5f2] px-5 py-4">
                <span className="flex items-center gap-2.5">
                  <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-[#e3ede9]">
                    <Logo mode="chip" size="xs" className="h-9 w-9" />
                  </span>
                  <Wordmark compact />
                </span>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  className="grid h-11 w-11 place-items-center rounded-xl border border-[#e3ede9] text-ink transition-colors hover:bg-[#f5f9f8]"
                >
                  <X className="h-5 w-5" strokeWidth={1.9} />
                </button>
              </div>

              <div className="flex flex-1 flex-col gap-1 px-5 py-6">
                <p className="mb-2 flex items-center gap-2 font-sans text-[0.6rem] font-bold uppercase tracking-[0.28em] text-[#fb6a47]">
                  <GraduationCap className="h-3.5 w-3.5" /> Programmes
                </p>
                {courses.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/courses/${c.slug}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-[#f3fbf8]"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eaf7f3] text-[#0f6b5c]">
                      <c.icon className="h-5 w-5" strokeWidth={1.9} />
                    </span>
                    <span className="flex flex-col">
                      <span className="font-display text-[0.98rem] font-bold text-ink">{c.name}</span>
                      <span className="font-sans text-[0.68rem] text-ink-3">{c.tagline}</span>
                    </span>
                  </Link>
                ))}
                <Link
                  href="/courses"
                  onClick={() => setMenuOpen(false)}
                  className="mt-1 flex w-full items-center justify-between rounded-2xl border border-[#cdebE3] bg-[#f3fbf8] px-4 py-3 font-display text-[0.9rem] font-bold text-[#0f6b5c]"
                >
                  View all courses <ArrowRight className="h-5 w-5" strokeWidth={2.2} />
                </Link>

                <div className="mt-5 border-t border-[#eef5f2] pt-5">
                  <p className="mb-2 flex items-center gap-2 font-sans text-[0.6rem] font-bold uppercase tracking-[0.28em] text-[#14a08c]">
                    <Sparkles className="h-3.5 w-3.5" /> Explore
                  </p>
                  {SITE_LINKS.map((l, i) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => go(l.id)}
                      className={cn(
                        "flex w-full items-center justify-between border-b border-[#f1f7f5] py-3 font-display text-lg font-bold tracking-tight transition-colors",
                        active === l.id ? "text-[#0f6b5c]" : "text-ink hover:text-[#0f6b5c]"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <span className="w-6 font-sans text-[0.6rem] font-bold text-ink-3">0{i + 1}</span>
                        <l.icon className="h-5 w-5 text-[#9ab5ae]" strokeWidth={1.9} />
                        {dict[l.key] ?? l.label}
                      </span>
                      <ArrowRight className="h-5 w-5 text-[#b7cbc5]" strokeWidth={2} />
                    </button>
                  ))}
                  <Link
                    href="/blog"
                    onClick={() => setMenuOpen(false)}
                    className="group mt-3 flex items-center gap-3 rounded-2xl border border-[#dfeee8] bg-[#f9fdfc] px-3.5 py-3 transition-colors hover:border-[#9fd8cb] hover:bg-white"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eaf7f3] text-[#0f6b5c]">
                      <NotebookPen className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="relative w-fit font-display text-[0.96rem] font-bold tracking-tight text-ink">
                        Blog
                        <span
                          aria-hidden
                          className="absolute -bottom-0.5 left-0 h-[2px] w-full rounded-full bg-[linear-gradient(90deg,#0f6b5c,#14a08c_58%,#f26a4a)]"
                        />
                      </span>
                      <span className="mt-0.5 font-sans text-[0.66rem] text-ink-3">
                        The Language Hub journal
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-[#9ab5ae] transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
                  </Link>
                </div>
              </div>

              <div className="mx-5 mb-6 flex flex-col gap-3 rounded-2xl border border-[#e3ede9] bg-[#f9fdfc] p-4">
                <BookDemoButton className="h-12 w-full" />
                <AuthNavButtons fullWidth />
              </div>
            </FocusTrap>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

/** A short teal stroke beneath the active link, animated between items. */
function NavStroke({ show }: { show: boolean }) {
  return show ? (
    <motion.span
      layoutId="nav-stroke"
      transition={{ type: "spring", stiffness: 460, damping: 34 }}
      className="absolute inset-x-4 bottom-1 h-[2.5px] rounded-full bg-[#0f6b5c]"
    />
  ) : (
    <span
      aria-hidden
      className="absolute inset-x-4 bottom-1 h-[2.5px] origin-left scale-x-0 rounded-full bg-[#0f6b5c]/45 transition-transform duration-300 ease-out group-hover:scale-x-100"
    />
  );
}
