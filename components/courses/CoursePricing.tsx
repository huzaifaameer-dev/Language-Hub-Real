"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { CONTACT, COURSE_CARDS, COURSE_FEATURES, whatsappLink } from "@/lib/content";
import { courseSlug } from "@/lib/course-data";
import { registrationKeyForCatalogName } from "@/lib/registration-config";
import { ApplyButton } from "@/components/courses/ApplyButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useLang } from "@/components/LanguageProvider";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

export function CoursePricing() {
  const hasWhatsapp = Boolean(CONTACT.whatsapp);
  const { dict, lang } = useLang();
  const isUr = lang === "ur";

  return (
    <section
      id="pricing"
      data-section
      className="relative overflow-hidden bg-white px-6 py-24 sm:px-12"
      aria-label="Courses and fees"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          eyebrow={dict["pricing.eyebrow"]}
          title={
            isUr ? (
              <>{dict["pricing.title1"]} <span className="brand-text">{dict["pricing.title2"]}</span></>
            ) : (
              <>
                Programmes & <span className="brand-text">fees</span>
              </>
            )
          }
          subtitle={dict["pricing.subtitle"]}
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {COURSE_CARDS.map((card, i) => {
            return (
            <motion.article
              key={card.info.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: (i % 2) * 0.1, ease: EASE }}
              className="relative flex flex-col overflow-hidden rounded-3xl border border-ink/10 bg-white/80 p-6 backdrop-blur transition-shadow duration-300 hover:shadow-[0_24px_60px_-28px_rgb(34_30_43/0.35)] sm:p-8"
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-1"
                style={{ backgroundColor: card.accent }}
              />
              <div className="flex flex-col gap-5">
                <div>
                  <h3 className="font-display text-[1.35rem] font-extrabold tracking-[-0.01em] text-ink">
                    {card.info.name}
                  </h3>
                  <p className="mt-1 font-serif text-[0.95rem] italic text-ink-3">
                    {card.info.tagline}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="rounded-2xl border border-ink/10 bg-[#f7f8fc] px-4 py-2">
                    <p className="font-display text-[1.4rem] font-extrabold leading-none text-ink">
                      {card.feeLabel}
                    </p>
                    <p className="mt-1 font-display text-[0.58rem] font-bold uppercase tracking-[0.2em] text-ink-3">
                      {dict["pricing.perMonth"]}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-brand/20 bg-brand/[0.04] px-3.5 py-2 text-center">
                    <p className="font-display text-[0.95rem] font-extrabold leading-none text-brand-deep">
                      {card.info.duration}
                    </p>
                    <p className="mt-1 font-display text-[0.55rem] font-bold uppercase tracking-[0.18em] text-ink-3">
                      {dict["pricing.duration"]}
                    </p>
                  </div>
                </div>
                <p className="text-[0.95rem] leading-relaxed text-ink-2">
                  {card.info.description}
                </p>
              </div>

              <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-ink/10 py-5 text-[0.8rem]">
                <div className="flex items-baseline gap-2">
                  <dt className="font-display text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-3">{dict["pricing.schedule"]}</dt>
                  <dd className="font-semibold text-ink">{card.info.schedule}</dd>
                </div>
                {card.info.batches.map((b) => (
                  <div key={b.name} className="flex items-baseline gap-2">
                    <dt className="font-display text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-3">{b.name}</dt>
                    <dd className="font-semibold text-ink">{b.time}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-6 flex flex-col gap-2.5">
                {(COURSE_FEATURES[card.info.name] ?? []).slice(0, 3).map((f) => (
                  <div key={f} className="flex items-start gap-2 text-[0.84rem] text-ink-2">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full text-[0.6rem] text-ivory"
                      style={{ backgroundColor: card.accent }}
                    >
                      ✓
                    </span>
                    {f}
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-ink/10 pt-6">
                <ApplyButton
                  courseKey={registrationKeyForCatalogName(card.info.name)}
                  className="group inline-flex h-[2.9rem] flex-1 items-center justify-center gap-2 rounded-full bg-ink px-6 font-display text-[0.68rem] font-bold uppercase tracking-[0.2em] text-ivory transition-colors duration-300 hover:bg-brand-deep"
                >
                  {dict["pricing.applyOnline"]}
                  <span className="inline-block transition-transform duration-500 group-hover:translate-x-1">→</span>
                </ApplyButton>
                {hasWhatsapp && (
                  <a
                    href={whatsappLink(`Assalam o alaikum! Main ${card.info.name} ke baare mein jaanna chahta/aaraha hoon. Kya aap details bata sakte hain?`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-[2.9rem] items-center rounded-full border border-ink/15 px-5 font-display text-[0.68rem] font-bold uppercase tracking-[0.2em] text-ink transition-all duration-300 hover:border-ink hover:bg-ink hover:text-ivory"
                  >
                    {dict["pricing.ask"]}
                  </a>
                )}
                <Link
                  href={`/courses/${courseSlug(card.info.name)}`}
                  className="inline-flex items-center font-mono text-[0.68rem] text-ink-3 transition-colors hover:text-brand-deep"
                >
                  {dict["pricing.fullDetails"]} →
                </Link>
              </div>
            </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}