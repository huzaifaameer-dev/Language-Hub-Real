"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Award, BadgeCheck, Quote, Star, X } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useLang } from "@/components/LanguageProvider";

interface ReviewItem {
  id: string;
  name: string;
  role: string;
  quote: string;
  outcome: string;
  course: string;
  featured?: boolean;
  image?: string | null;
}

const ease = [0.16, 1, 0.3, 1] as const;

/** Animated star row. */
function Stars({ count = 5 }: { count?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${count} star rating`}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, scale: 0.6 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.06, duration: 0.35, ease }}
        >
          <Star className="h-4 w-4 fill-gold text-gold" strokeWidth={0} />
        </motion.span>
      ))}
    </div>
  );
}

export function Reviews() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [active, setActive] = useState<ReviewItem | null>(null);
  const { dict, lang } = useLang();
  const isUr = lang === "ur";
  const reduce = useReducedMotion();

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

  const featured = reviews.find((r) => r.featured);
  const rest = reviews.filter((r) => r !== featured);

  const openModal = useCallback((r: ReviewItem) => setActive(r), []);
  const closeModal = useCallback(() => setActive(null), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeModal]);

  return (
    <section
      id="reviews"
      data-section
      className="relative overflow-hidden bg-[#F4F7FF] px-6 py-24 sm:px-12"
      aria-label="Student reviews"
    >
      {/* Ambient glow orbs — blue/violet */}
      <motion.div
        aria-hidden
        animate={{ scale: [1, 1.12, 1], opacity: [0.08, 0.14, 0.08] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -left-40 top-10 h-80 w-80 rounded-full bg-[#2563EB]/15 blur-3xl"
      />
      <motion.div
        aria-hidden
        animate={{ scale: [1, 1.1, 1], opacity: [0.06, 0.12, 0.06] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="pointer-events-none absolute -right-40 bottom-10 h-80 w-80 rounded-full bg-[#6D4AFF]/15 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl">
        {/* Trust summary strip */}
        <div className="mb-10 flex flex-wrap items-center justify-center gap-6 rounded-2xl border border-[#DCE9FF] bg-white px-6 py-5 shadow-[0_8px_30px_-14px_rgb(37_99_235/0.15)]">
          <div className="flex flex-col items-center gap-1.5">
            <span className="font-display text-[2rem] font-black leading-none text-[#0B1B3A]">5.0</span>
            <Stars />
          </div>
          <span className="hidden h-10 w-px bg-[#E0E9FF] sm:block" />
          <div className="flex flex-col items-center gap-0.5">
            <span className="flex items-center gap-1.5 font-display text-[0.82rem] font-bold text-[#0B1B3A]">
              <BadgeCheck className="h-4 w-4 text-emerald-500" /> Verified Student Reviews
            </span>
            <span className="text-[0.72rem] text-[#64748B]">{reviews.length > 0 ? `${reviews.length}+ testimonials` : "Real feedback from real learners"}</span>
          </div>
        </div>

        <SectionHeader
          eyebrow={dict["reviews.eyebrow"]}
          title={
            isUr ? (
              <>{dict["reviews.title1"]} <span className="brand-text">{dict["reviews.title2"]}</span></>
            ) : (
              <>
                Proven results, <span className="brand-text">verified.</span>
              </>
            )
          }
          subtitle={dict["reviews.subtitle"]}
        />

        {/* ─── Featured — Top Band Scorer premium card ─── */}
        {featured ? (
          <motion.article
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease }}
            className="relative mt-14 overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#0B1B3A] via-[#1647C7] to-[#6D4AFF] p-7 text-white shadow-[0_44px_90px_-40px_rgb(22_71_199/0.7)] sm:p-10"
          >
            {/* faint grid texture */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                backgroundImage: "radial-gradient(rgb(255 255 255 / 0.18) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />
            <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

            <div className="relative grid gap-8 lg:grid-cols-[auto_1fr] lg:items-center">
              {/* Avatar */}
              <div className="relative mx-auto lg:mx-0">
                <span aria-hidden className="absolute -inset-2 rounded-full bg-white/15 blur-xl" />
                <span className="relative grid h-24 w-24 place-items-center overflow-hidden rounded-full border-4 border-white/30 bg-gradient-to-br from-white/20 to-white/5 shadow-xl sm:h-28 sm:w-28">
                  {featured.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={featured.image} alt={`${featured.name} — Language Hub top band scorer`} className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-display text-4xl font-black">{(featured.name || "T").charAt(0).toUpperCase()}</span>
                  )}
                </span>
                <span aria-hidden className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full border-2 border-[#0B1B3A] bg-gold text-[#0B1B3A]">
                  <Award className="h-4.5 w-4.5" strokeWidth={2} />
                </span>
              </div>

              {/* Content */}
              <div className="text-center lg:text-start">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1 font-display text-[0.6rem] font-black uppercase tracking-[0.18em] text-gold-light ring-1 ring-gold/30">
                  <Award className="h-3.5 w-3.5" /> Top Band Scorer · Featured
                </span>
                <div className="mt-3 flex flex-col items-center gap-2 lg:flex-row lg:items-center lg:gap-4">
                  <h3 className="font-display text-2xl font-black tracking-tight sm:text-3xl">{featured.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-white/15 px-3 py-1 font-display text-[0.68rem] font-bold uppercase tracking-[0.14em] text-white">
                      {featured.course}
                    </span>
                    <Stars count={5} />
                  </div>
                </div>
                <blockquote className="mx-auto mt-4 max-w-2xl text-[1.05rem] leading-relaxed text-white/90 lg:mx-0">
                  &ldquo;{featured.quote}&rdquo;
                </blockquote>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                  {featured.outcome ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 font-display text-[0.72rem] font-bold tracking-wide text-white backdrop-blur">
                      <BadgeCheck className="h-3.5 w-3.5 text-emerald-300" /> {featured.outcome}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => openModal(featured)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 font-display text-[0.74rem] font-bold text-[#1647C7] transition-all hover:shadow-lg"
                  >
                    Read full story <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} />
                  </button>
                </div>
              </div>
            </div>
          </motion.article>
        ) : null}

        {/* ─── Regular review grid (ordered) ─── */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...rest].sort((a, b) => String(a.outcome).localeCompare(String(b.outcome))).slice(0, featured ? 7 : 8).map((t, i) => (
            <motion.article
              key={t.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.55, delay: (i % 4) * 0.08, ease }}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-[#DCE9FF] bg-white shadow-[0_8px_30px_-14px_rgb(37_99_235/0.18)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[#2563EB]/35 hover:shadow-[0_28px_60px_-28px_rgb(37_99_235/0.4)]"
            >
              {/* Premium gradient top band */}
              <div aria-hidden className="h-1.5 w-full bg-gradient-to-r from-[#2563EB] via-[#6D4AFF] to-[#60A5FA]" />

              <div className="flex flex-1 flex-col p-6">
                {/* Header: avatar + stars */}
                <div className="mb-4 flex items-start justify-between gap-3">
                  <span className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#2563EB]/20 to-[#6D4AFF]/25 font-display text-xl font-black text-[#1647C7] ring-2 ring-[#DCE9FF] shadow-md transition-shadow duration-300 group-hover:shadow-lg">
                    {t.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.image} alt={`${t.name} avatar`} className="h-full w-full object-cover" />
                    ) : (
                      t.name.charAt(0)
                    )}
                    <span aria-hidden className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-emerald-500 text-white">
                      <BadgeCheck className="h-3 w-3" />
                    </span>
                  </span>
                  <Stars count={5} />
                </div>

                {/* Name + course */}
                <p className="font-display text-[1.05rem] font-black leading-tight text-[#0B1B3A]">
                  {t.name}
                </p>
                <p className="mt-1 font-display text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[#1647C7]">
                  {t.course}
                </p>

                {/* Clamped quote with subtle left accent */}
                <blockquote className="relative mt-4 flex-1 overflow-y-auto pr-1 text-[0.9rem] leading-relaxed text-[#3B4A6B]" style={{ maxHeight: "9rem" }}>
                  <span aria-hidden className="absolute left-0 top-0 h-full w-[2px] rounded-full bg-[#2563EB]/20" />
                  <span className="pl-3 italic">&ldquo;{t.quote}&rdquo;</span>
                </blockquote>

                {/* Footer: outcome + view */}
                <div className="mt-5 flex items-center justify-between gap-2 border-t border-[#EDF1FA] pt-4">
                  {t.outcome ? (
                    <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-display text-[0.56rem] font-bold uppercase tracking-[0.12em] text-emerald-700">
                      {t.outcome}
                    </span>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    onClick={() => openModal(t)}
                    className="inline-flex items-center gap-1.5 font-display text-[0.68rem] font-bold text-[#1647C7] transition-colors hover:text-[#2563EB]"
                  >
                    Read more <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/success-stories"
            className="group inline-flex h-12 items-center gap-2.5 rounded-full border border-[#2563EB]/30 bg-white px-8 font-display text-[0.88rem] font-bold text-[#1647C7] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#2563EB] hover:text-white hover:shadow-[0_18px_44px_-16px_rgb(37_99_235/0.5)]"
          >
            {dict["reviews.allStories"]} <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* Full-review modal */}
      <AnimatePresence>
        {active ? (
          <motion.div
            className="fixed inset-0 z-[400] flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label={`Full review by ${active.name}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              aria-label="Close review"
              onClick={closeModal}
              className="absolute inset-0 cursor-default bg-[#0B1B3A]/55 backdrop-blur-sm"
            />
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 16 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.28, ease }}
              className="relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[1.75rem] bg-white shadow-[0_60px_140px_-40px_rgb(11_27_58/0.7)]"
            >
              <div aria-hidden className="sticky top-0 z-10 h-1.5 w-full shrink-0 bg-gradient-to-r from-[#2563EB] via-[#6D4AFF] to-[#60A5FA]" />
              <div className="p-7">
                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="Close review"
                  className="sticky right-0 top-0 z-10 ml-auto grid h-9 w-9 place-items-center rounded-full border border-ink/10 bg-white text-ink-2 transition-colors hover:bg-ink/5 hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-4">
                  <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#2563EB]/20 to-[#6D4AFF]/25 font-display text-xl font-black text-[#1647C7] ring-2 ring-[#DCE9FF] shadow-lg">
                    {active.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={active.image} alt={`${active.name} avatar`} className="h-full w-full object-cover" />
                    ) : (
                      active.name.charAt(0)
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 font-display text-[1.15rem] font-black text-[#0B1B3A]">
                      {active.name}
                      <BadgeCheck className="h-4 w-4 text-emerald-500" />
                    </p>
                    <p className="font-display text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#1647C7]">
                      {active.course}
                    </p>
                    <div className="mt-1">
                      <Stars count={5} />
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-[#F4F7FF] p-5">
                  <Quote className="h-6 w-6 text-[#2563EB]/30" aria-hidden />
                  <p className="mt-2 font-serif text-[1.05rem] italic leading-relaxed text-[#3B4A6B]">
                    &ldquo;{active.quote}&rdquo;
                  </p>
                </div>

                {active.outcome ? (
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-display text-[0.62rem] font-bold uppercase tracking-[0.14em] text-emerald-700">
                      <BadgeCheck className="h-3.5 w-3.5" /> {active.outcome}
                    </span>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}