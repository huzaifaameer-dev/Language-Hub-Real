"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FAQS, whatsappLink } from "@/lib/content";
import { useLang } from "@/components/LanguageProvider";

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  const { dict, lang } = useLang();
  const isUr = lang === "ur";

  // Translate the FAQ questions/answers when available.
  const faqKeys: Record<string, { q: string; a: string }> = {
    "Do sessions run online or on-campus?": {
      q: "کیا کلاسیں آن لائن ہیں یا کیمپس میں؟",
      a: "لینگویج ہب ایک آن لائن ادارہ ہے — کلاسیں اصل گفتگو کے ساتھ لائیو ویڈیو پر چلتی ہیں، لہٰذا آپ کہیں سے بھی شامل ہو سکتے ہیں۔",
    },
    "Is there a demo class before joining?": {
      q: "شروع سے پہلے کوئی ڈیمو کلاس ہے؟",
      a: "جی ہاں۔ آپ اپنے استاد سے ملنے، سیشن کا طریقہ دیکھنے اور داخلے سے پہلے فیصلہ کرنے کے لیے مفت ڈیمو کال بک کر سکتے ہیں۔",
    },
    "Which courses and batches are available?": {
      q: "کون سے کورسز اور بیچ دستیاب ہیں؟",
      a: "اسپوکن انگلش، آئی ایل ٹی ایس، پی ٹی ای اور ڈولنگو انگلش ٹیسٹ۔ ہر کورس اپنے اوقات اور بیچ (صبح / شام / ویک اینڈ) بتاتا ہے۔",
    },
    "How do fees and payment work?": {
      q: "فیس اور ادائیگی کیسے کام کرتی ہے؟",
      a: "ہر کورس قیمت والے حصے میں اپنی ماہانہ فیس دکھاتا ہے۔ آن لائن درخواست کے بعد داخلہ تصدیق ہوتا ہے اور ہماری ٹیم ذاتی طور پر رابطہ کرتی ہے۔",
    },
    "How fast is the application reviewed?": {
      q: "درخواست کتنی جلدی دیکھی جاتی ہے؟",
      a: "درخواستیں 12 گھنٹوں کے اندر دیکھی جاتی ہیں اور لاگ ان کے بعد آپ اپنے ڈیش بورڈ میں صورتحال دیکھ سکتے ہیں۔",
    },
    "Are books and material included?": {
      q: "کیا کتابیں اور مواد شامل ہیں؟",
      a: "جی ہاں — داخل شدہ طلبہ کو ڈیش بورڈ میں ان کے مضامین کی کتابیں ملتی ہیں۔",
    },
  };
  const visibleFaqs = isUr
    ? FAQS.map((f) => ({ q: faqKeys[f.q]?.q ?? f.q, a: faqKeys[f.q]?.a ?? f.a }))
    : FAQS;

  return (
    <section
      id="faq"
      data-section
      className="relative overflow-hidden bg-white px-6 py-24 sm:px-12"
      aria-label="Frequently asked questions"
    >
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-start">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="mb-6 flex items-center justify-center gap-4 font-display text-[0.66rem] font-bold uppercase tracking-[0.42em] text-gold-deep lg:justify-start">
              <span aria-hidden="true" className="h-px w-10 bg-gold/60" />
              {dict["faq.eyebrow"]}
            </p>
            <h2 className="font-display text-[clamp(2rem,5vw,3.8rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink" dir={isUr ? "rtl" : "ltr"}>
              {isUr ? (
                dict["faq.title2"]
              ) : (
                <>
                  Everything you
                  <br />
                  want to <span className="brand-text">ask first</span>
                </>
              )}
            </h2>
            <p className="mt-6 max-w-md text-[1rem] leading-relaxed text-ink-2">
              {dict["faq.subtitle"]}
            </p>
            {whatsappLink("").length > 0 && (
              <a
                href={whatsappLink("Assalam o alaikum! Mujhe demo class book karni hai. Guide kar dein.")}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-8 inline-flex h-[3.1rem] items-center gap-3 rounded-full bg-brand px-8 font-display text-[0.86rem] font-bold text-ivory transition-all duration-300 hover:bg-brand-deep"
              >
                {dict["faq.askWhatsApp"]}
                <span className="inline-block transition-transform duration-500 group-hover:translate-x-1.5">→</span>
              </a>
            )}
          </motion.div>
        </div>

        <div className="flex flex-col gap-3">
          {visibleFaqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={f.q}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
                className="overflow-hidden rounded-2xl border border-ink/10 bg-white/80"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
                  id={`faq-button-${i}`}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-start"
                >
                  <span className="font-display text-[0.95rem] font-bold leading-snug text-ink" dir={isUr ? "rtl" : "ltr"}>
                    {f.q}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border border-ink/15 font-display text-lg text-ink-3 transition-all duration-300 ${
                      isOpen ? "rotate-45 border-ink bg-ink text-ivory" : ""
                    }`}
                  >
                    +
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-panel-${i}`}
                      role="region"
                      aria-labelledby={`faq-button-${i}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <p className="px-6 pb-6 text-[0.94rem] leading-relaxed text-ink-2">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}