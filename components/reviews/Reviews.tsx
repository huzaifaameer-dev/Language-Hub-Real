"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TESTIMONIALS } from "@/lib/content";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useLang } from "@/components/LanguageProvider";

interface ReviewItem {
  id: string;
  name: string;
  role: string;
  quote: string;
  outcome: string;
  course: string;
}

export function Reviews() {
  const [reviews, setReviews] = useState<ReviewItem[]>(
    TESTIMONIALS.map((t, i) => ({ id: String(i), ...t }))
  );
  const { dict, lang } = useLang();
  const isUr = lang === "ur";

  useEffect(() => {
    let on = true;
    fetch("/api/testimonials", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (on && Array.isArray(data?.testimonials) && data.testimonials.length > 0) {
          setReviews(data.testimonials as ReviewItem[]);
        }
      })
      .catch(() => {});
    return () => {
      on = false;
    };
  }, []);

  return (
    <section
      id="reviews"
      data-section
      className="relative overflow-hidden bg-[#f7f8fc] px-6 py-24 sm:px-12"
      aria-label="Student reviews"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeader          eyebrow={dict["reviews.eyebrow"]}
          title={
            isUr ? (
              <>{dict["reviews.title1"]} <span className="brand-text">{dict["reviews.title2"]}</span></>
            ) : (
              <>
                Proven results, <span className="brand-text">validated.</span>
              </>
            )
          }
          subtitle={dict["reviews.subtitle"]}
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {reviews.slice(0, 8).map((t, i) => (
            <motion.figure
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="group flex flex-col rounded-2xl border border-ink/[0.08] bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-ink/15 hover:shadow-[0_24px_50px_-30px_rgb(15_23_42/0.3)]"
            >
              <div className="mb-5 flex items-center gap-1 text-gold" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, s) => (
                  <span key={s} className="text-[0.72rem]">
                    ★
                  </span>
                ))}
              </div>
              <blockquote className="flex-1 text-[0.96rem] leading-relaxed text-ink-2">
                “{t.quote}”
              </blockquote>
              <div className="mt-4 flex items-center gap-2">
                {t.outcome ? (
                  <span className="inline-flex rounded-full border border-brand/20 bg-brand/[0.05] px-3 py-1 font-display text-[0.6rem] font-bold uppercase tracking-[0.14em] text-brand-deep">
                    {t.outcome}
                  </span>
                ) : null}
              </div>
              <figcaption className="mt-7 flex items-center gap-3.5 border-t border-ink/[0.06] pt-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand/20 to-brand-magenta/20 font-display text-sm font-extrabold text-brand-deep">
                  {t.name.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-[0.85rem] font-bold text-ink">{t.name}</p>
                  <p className="truncate font-display text-[0.6rem] font-bold uppercase tracking-[0.16em] text-ink-3">
                    {t.course}
                  </p>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>

        {/* Link to all success stories */}
        <div className="mt-12 text-center">
          <Link
            href="/success-stories"
            className="inline-flex h-12 items-center gap-2 rounded-full border border-brand/25 bg-white px-8 font-display text-[0.85rem] font-bold text-brand-deep transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-deep hover:text-white"
          >
            {dict["reviews.allStories"]} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
