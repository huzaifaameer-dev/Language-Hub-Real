"use client";

import { useLang } from "@/components/LanguageProvider";

/** Compact English / اردو toggle for the navbar. */
export function LanguageToggle() {
  const { lang, setLang } = useLang();

  return (
    <button
      type="button"
      onClick={() => setLang(lang === "en" ? "ur" : "en")}
      aria-label={lang === "en" ? "Switch to Urdu" : "Switch to English"}
      className="inline-flex h-10 shrink-0 items-center gap-1 rounded-full border border-ink/12 bg-white/70 px-2.5 font-display text-[0.72rem] font-bold text-ink-2 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/45 hover:text-brand-deep sm:px-3"
    >
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink/5 text-[0.6rem]">A</span>
      <span className="hidden sm:inline">English</span>
      <span aria-hidden className="text-ink-3">/</span>
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink/5 text-[0.6rem]">ا</span>
      <span className="hidden sm:inline">اردو</span>
    </button>
  );
}
