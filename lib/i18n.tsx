"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ur";

export const DICT: Record<string, { en: string; ur: string }> = {
  navHome: { en: "Home", ur: "گھر" },
  navJourney: { en: "Journey", ur: "سفر" },
  navAbout: { en: "About", ur: "ہمارے بارے میں" },
  navCourses: { en: "Courses", ur: "کورسز" },
  navResources: { en: "Resources", ur: "وسائل" },
  navVoice: { en: "Voice", ur: "آواز" },
  navHub: { en: "Hub", ur: "مرکز" },
  tagline: { en: "Hub of Language Excellence", ur: "زبان کی عمدگی کا مرکز" },
  heroCtaJourney: { en: "Explore the Journey", ur: "سفر شروع کریں" },
  heroCtaCourses: { en: "See the Courses", ur: "کورسز دیکھیں" },
  heroScrollCue: { en: "Scroll", ur: "سکرول" },
  heroSideCue: { en: "Scroll to transform", ur: "یہاں سے بدلاؤ شروع ہوتا ہے" },
  statementTitleA: { en: "LANGUAGE IS", ur: "زبان" },
  statementTitleB: { en: "more than words.", ur: "محض الفاظ نہیں ہے۔" },
  statementBody: {
    en: "Every word you learn becomes something you can say — and every sentence you say becomes part of who you are.",
    ur: "ہر لفظ جو آپ سیکھتے ہیں کچھ کہنے کے قابل بن جاتا ہے — اور ہر جملہ جو آپ بولتے ہیں آپ کی شناخت کا حصہ بن جاتا ہے۔",
  },
  coursesEyebrow: { en: "Course Destinations", ur: "کورس کی منزلیں" },
  coursesTitleA: { en: "FOUR WAYS", ur: "چار راستے" },
  coursesTitleB: { en: "TO MOVE FORWARD.", ur: "آگے بڑھنے کے۔" },
  coursesIntro: {
    en: "Every course is a destination. Scroll — the gallery moves with you — and let each one introduce itself.",
    ur: "ہر کورس ایک منزل ہے۔ اسکرول کریں — گیلری آپ کے ساتھ چلتی ہے — اور ہر ایک اپنا تعارف کروائے۔",
  },
  coursesCta: { en: "See the Reading Room", ur: "مطالعہ خانہ دیکھیں" },
};

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const Ctx = createContext<LangCtx | null>(null);

const STORAGE_KEY = "lh-lang";

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved !== "en" && saved !== "ur") return;
    const id = window.setTimeout(() => setLangState(saved), 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === "ur" ? "rtl" : "ltr";
    window.localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const t = (key: string) => DICT[key]?.[lang] ?? key;
  const setLang = (l: Lang) => setLangState(l);

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLang must be used inside <LangProvider>");
  return ctx;
}

export function LangSwitch() {
  const { lang, setLang } = useLang();
  return (
    <div
      role="group"
      aria-label="Language"
      className="flex items-center gap-0.5 rounded-full border border-ink/12 bg-white/60 p-0.5 font-display text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-2"
    >
      {(["en", "ur"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={
            lang === l
              ? "rounded-full bg-ink px-2.5 py-1 text-ivory transition-colors"
              : "rounded-full px-2.5 py-1 transition-colors hover:text-ink"
          }
        >
          {l === "en" ? "EN" : "اردو"}
        </button>
      ))}
    </div>
  );
}