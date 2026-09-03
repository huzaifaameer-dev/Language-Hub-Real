"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DICTS, type Dict, type Lang } from "@/lib/i18n";

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  dict: Dict;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  dict: DICTS.en,
});

const STORAGE_KEY = "lh:lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "en";
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
      return stored === "en" || stored === "ur" ? stored : "en";
    } catch {
      return "en";
    }
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {}
    // Flip the document direction for RTL languages.
    document.documentElement.dir = l === "ur" ? "rtl" : "ltr";
  };

  // Apply dir on mount based on initial lang (avoids hydration flicker).
  useEffect(() => {
    document.documentElement.dir = lang === "ur" ? "rtl" : "ltr";
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, dict: DICTS[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang(): LanguageContextValue {
  return useContext(LanguageContext);
}

/** Dynamically-set the body dir even before hydration. */
export function translate(dict: Dict, key: string): string {
  return dict[key] ?? DICTS.en[key] ?? key;
}
