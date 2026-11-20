"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Compass,
  GraduationCap,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { FALLBACK_COURSES, courseSlug } from "@/lib/course-data";
import { useBodyScrollLock } from "@/lib/hooks";
import { cn } from "@/lib/utils";

interface Entry {
  group: "Programmes" | "Study" | "Academy";
  title: string;
  note: string;
  href: string;
  icon: typeof BookOpen;
}

const ENTRIES: Entry[] = [
  ...FALLBACK_COURSES.map((c) => ({
    group: "Programmes" as const,
    title: c.name,
    note: c.tagline,
    href: `/courses/${courseSlug(c.name)}`,
    icon: GraduationCap,
  })),
  { group: "Study", title: "Free placement test", note: "Ten minutes · instant level", href: "/placement-test", icon: Sparkles },
  { group: "Study", title: "Success stories", note: "Results from real learners", href: "/success-stories", icon: Compass },
  { group: "Academy", title: "Course catalogue", note: "Fees, batches and schedules", href: "/courses", icon: BookOpen },
  { group: "Academy", title: "Meet the team", note: "Teachers behind every batch", href: "/team", icon: Compass },
  { group: "Academy", title: "The Journal", note: "Notes from the classroom", href: "/blog", icon: BookOpen },
];

function useHotkey(open: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        open();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
}

export function SiteSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useHotkey(() => setOpen(true));
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 80);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ENTRIES;
    return ENTRIES.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.note.toLowerCase().includes(q) ||
        e.group.toLowerCase().includes(q)
    );
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<Entry["group"], Entry[]>();
    for (const r of results) {
      const list = map.get(r.group) ?? [];
      list.push(r);
      map.set(r.group, list);
    }
    return [...map.entries()];
  }, [results]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search courses and pages"
        className="search-ref group hidden md:inline-flex"
      >
        <Search className="h-4 w-4 text-[#6f8b84] transition-colors group-hover:text-[#0f6b5c]" strokeWidth={2.1} />
        <span className="font-sans text-[0.78rem] font-medium">Search</span>
        <span className="ml-4 rounded-md border border-[#dfeae6] bg-white px-1.5 py-0.5 font-sans text-[0.56rem] font-bold uppercase tracking-[0.08em] text-[#8aa39d]">
          ⌘K
        </span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[160] flex items-start justify-center bg-[#062e28]/35 px-4 pt-[12vh] backdrop-blur-sm"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Site search"
          >
            <motion.div
              initial={{ opacity: 0, y: -14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.985 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl overflow-hidden rounded-3xl border border-[#e3ede9] bg-white shadow-[0_50px_120px_-40px_rgba(6,46,40,0.55)]"
            >
              <div className="flex items-center gap-3 border-b border-[#eef5f2] px-5 py-4">
                <Search className="h-5 w-5 text-[#0f6b5c]" strokeWidth={2.1} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search programmes, pages, results…"
                  className="h-8 flex-1 bg-transparent font-sans text-[0.95rem] text-ink outline-none placeholder:text-ink-3/80"
                  aria-label="Search"
                />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close search"
                  className="grid h-8 w-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-[#f2faf7] hover:text-[#0f6b5c]"
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-2">
                {grouped.length === 0 ? (
                  <p className="px-4 py-10 text-center font-sans text-sm text-ink-3">
                    No matches for &ldquo;{query}&rdquo;. Try &ldquo;IELTS&rdquo; or &ldquo;placement&rdquo;.
                  </p>
                ) : (
                  grouped.map(([group, items]) => (
                    <div key={group} className="mb-2">
                      <p className="px-3 pb-1 pt-2 font-sans text-[0.56rem] font-bold uppercase tracking-[0.22em] text-[#93aaa4]">
                        {group}
                      </p>
                      {items.map((e) => (
                        <Link
                          key={`${e.group}-${e.title}`}
                          href={e.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors",
                            "hover:bg-[#f3fbf8]"
                          )}
                        >
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eaf7f3] text-[#0f6b5c] transition-colors group-hover:bg-[#0f6b5c] group-hover:text-white">
                            <e.icon className="h-4.5 w-4.5" strokeWidth={1.9} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-display text-[0.9rem] font-semibold text-ink">
                              {e.title}
                            </span>
                            <span className="block truncate font-sans text-[0.72rem] text-ink-3">
                              {e.note}
                            </span>
                          </span>
                          <ArrowUpRight className="h-4 w-4 shrink-0 text-[#b7cbc5] opacity-0 transition-opacity group-hover:opacity-100" />
                        </Link>
                      ))}
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center justify-between border-t border-[#eef5f2] bg-[#fbfefd] px-5 py-2.5">
                <span className="font-sans text-[0.62rem] text-ink-3">Esc to close</span>
                <span className="flex items-center gap-1.5 font-sans text-[0.62rem] text-ink-3">
                  <kbd className="rounded border border-[#dfeae6] bg-white px-1.5 py-0.5 font-sans text-[0.55rem] font-bold">⌘</kbd>
                  <kbd className="rounded border border-[#dfeae6] bg-white px-1.5 py-0.5 font-sans text-[0.55rem] font-bold">K</kbd>
                  to search anywhere
                </span>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
