"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Star, X } from "lucide-react";
import { useLang } from "@/components/LanguageProvider";
import { FocusTrap, useEscapeKey } from "@/components/ui/FocusTrap";
import { useBodyScrollLock, useInView, useReducedMotionSafe } from "@/lib/hooks";
import { EASE_QUINT } from "@/lib/motion";

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

function Stars({ size = "h-4 w-4" }: { size?: string }) {
  return (
    <div className="flex items-center gap-0.5" aria-label="5 star rating">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`${size} fill-gold text-gold`} strokeWidth={0} />
      ))}
    </div>
  );
}

function Avatar({
  review,
  size,
  className = "",
}: {
  review: ReviewItem;
  size: number;
  className?: string;
}) {
  const initial = (review.name || "S").trim().charAt(0).toUpperCase();
  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#E8F0FE] to-[#D3E2FB] font-headline font-semibold text-[#1D6FB8] ring-1 ring-[#CFDEF9] ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {review.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={review.image}
          alt={`${review.name} — Language Hub student`}
          className="h-full w-full object-cover"
        />
      ) : (
        initial
      )}
    </span>
  );
}

const CHIPS =
  "font-headline text-[0.6rem] font-semibold uppercase tracking-[0.12em]";

export function Reviews() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const { dict, lang } = useLang();
  const isUr = lang === "ur";
  const reduce = useReducedMotionSafe();
  const [sectionRef, inView] = useInView();
  const [railPaused, setRailPaused] = useState(false);

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

  const n = reviews.length;

  const openReview = reviews.find((r) => r.id === openId) ?? null;
  useEscapeKey(() => setOpenId(null), openReview !== null);
  useBodyScrollLock(openReview !== null);

  if (n === 0) return null;

  const title = isUr ? (
    <>
      {dict["reviews.title1"]} {dict["reviews.title2"]}
    </>
  ) : (
    <>
      {dict["reviews.title1"]}{" "}
      <span
        style={{
          backgroundImage: "linear-gradient(120deg,#1E3A8A,#1D4ED8 55%,#2563EB)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {dict["reviews.title2"]}
      </span>
    </>
  );

  /* one editorial review card — typographic, with a graphite top rule and an
     oversized serif quote mark doing the "graphical" work */
  const card = (r: ReviewItem, i: number) => {
    const dup = i >= n;
    return (
      <article
        key={`${r.id}-${i}`}
        aria-hidden={dup || undefined}
        className="group/card relative flex min-h-[330px] w-[300px] shrink-0 flex-col overflow-hidden rounded-[1.6rem] border border-white/70 bg-white p-6 shadow-[0_28px_60px_-36px_rgb(23_63_140/0.5)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[#1D6FB8]/35 hover:shadow-[0_44px_84px_-36px_rgb(23_63_140/0.55)] sm:w-[360px] sm:p-7 lg:w-[440px] lg:p-8"
      >
        {/* graphical top rule */}
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,#1D6FB8,#60A5FA,transparent)]"
        />

        <div className="flex items-center justify-between gap-3">
          <span className="font-headline text-[0.56rem] font-semibold uppercase tracking-[0.22em] text-[#1D6FB8]">
            Student story
          </span>
          <Stars size="h-3.5 w-3.5" />
        </div>

        <span
          aria-hidden
          className="mt-4 select-none font-headline text-[2.8rem] font-bold leading-[0.6] text-[#1D6FB8]/25"
        >
          &ldquo;
        </span>

        <p className="mt-3 line-clamp-5 font-headline text-[0.95rem] leading-[1.75] text-[#3B4A6B] lg:text-[1rem]">
          {r.quote}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-[#EDF1FA] pt-5">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar review={r} size={44} />
            <div className="min-w-0">
              <p className="truncate font-headline text-[0.95rem] font-semibold leading-tight text-[#0B1B3A]">
                {r.name}
              </p>
              <p className="mt-0.5 truncate font-headline text-[0.56rem] font-semibold uppercase tracking-[0.16em] text-[#1D6FB8]">
                {r.course}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpenId(r.id)}
            tabIndex={dup ? -1 : 0}
            className="group/rf inline-flex shrink-0 items-center gap-1 font-headline text-[0.72rem] font-semibold text-[#1D6FB8] transition-colors hover:text-[#1647C7]"
          >
            {dict["reviews.readFull"]}
            <ArrowUpRight
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover/rf:-translate-y-0.5 group-hover/rf:translate-x-0.5"
              strokeWidth={2.2}
            />
          </button>
        </div>
      </article>
    );
  };

  return (
    <section
      id="reviews"
      ref={sectionRef}
      data-section
      className="relative overflow-hidden px-6 pt-14 pb-12 sm:px-10 sm:pb-14 lg:pb-16"
      style={{
        backgroundImage:
          "linear-gradient(165deg, #E4ECFF 0%, #C9D9FF 48%, #D8E3FF 100%)",
      }}
      aria-label="Student reviews"
    >
      {/* depth fields — soft blurred colour so the white cards read as real
          objects sitting on a surface instead of dissolving into it */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-28 -top-28 h-[24rem] w-[24rem] rounded-full bg-[#2E6CE6]/35 blur-[110px]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -left-24 -bottom-32 h-[28rem] w-[28rem] rounded-full bg-[#4338CA]/25 blur-[120px]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(74% 60% at 50% 48%, rgba(30,64,175,0) 52%, rgba(30,64,175,0.16) 100%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1320px]">
        {/* ── heading — editorial, Poppins, blue ── */}
        <div className="flex flex-col items-center text-center">
          <motion.span
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8% 0px -8% 0px" }}
            transition={{ duration: 0.6, ease: EASE_QUINT }}
            className="inline-flex items-center gap-3 font-headline text-[0.66rem] font-semibold uppercase tracking-[0.3em] text-[#17579C]"
          >
            <span aria-hidden className="h-px w-9 bg-[#17579C]/50" />
            {dict["reviews.eyebrow"]}
            <span aria-hidden className="h-px w-9 bg-[#17579C]/50" />
          </motion.span>

          <motion.h2
            initial={reduce ? false : { opacity: 0, y: 26, filter: "blur(6px)" }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-8% 0px -8% 0px" }}
            transition={{ duration: 0.8, delay: 0.08, ease: EASE_QUINT }}
            className="mt-5 font-headline text-[clamp(2rem,4.6vw,3.3rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-[#0B1B3A]"
          >
            {title}
          </motion.h2>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 18 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8% 0px -8% 0px" }}
            transition={{ duration: 0.7, delay: 0.16, ease: EASE_QUINT }}
            className="mt-5 max-w-[34rem] text-[1.02rem] leading-[1.7] text-[#46567C]"
          >
            {dict["reviews.subtitle"]}
          </motion.p>
        </div>
      </div>

      {/* ── review cards — a continuous three-across rail; it pauses the
          moment the pointer (or keyboard focus) is on it ── */}
      <div
        className="relative left-1/2 mt-14 w-screen -translate-x-1/2"
        onMouseEnter={() => setRailPaused(true)}
        onMouseLeave={() => setRailPaused(false)}
        onFocusCapture={() => setRailPaused(true)}
        onBlurCapture={() => setRailPaused(false)}
      >
        <div
          className="overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(to right, transparent 0%, #000 9%, #000 91%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, #000 9%, #000 91%, transparent 100%)",
          }}
        >
          <div
            className="flex w-max gap-5 px-5 py-4 animate-[marquee_80s_linear_infinite] will-change-transform motion-reduce:animate-none lg:gap-6"
            style={{ animationPlayState: !inView || railPaused ? "paused" : "running" }}
          >
            {[...reviews, ...reviews].map((r, i) => card(r, i))}
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-[1320px]">
        {/* ── student roll — every reviewer drifting past in a slow line ── */}
        {n > 1 ? (
          <div
            className="relative left-1/2 mt-16 w-screen -translate-x-1/2"
            aria-hidden
          >
            {/* success character — raised clear of the roll so the trophy sits
                fully visible above the names, behind the cards */}
            <div className="pointer-events-none absolute bottom-full left-0 z-[55] hidden w-[250px] sm:left-1 sm:w-[300px] md:block lg:left-0 lg:w-[360px]">
              <span
                aria-hidden
                className="absolute bottom-1 left-1/2 h-[56%] w-[82%] -translate-x-1/2 rounded-[50%] bg-white/70 blur-[58px]"
              />
              <Image
                src="/graduation-triumph.png"
                alt=""
                width={790}
                height={1024}
                sizes="(min-width: 1024px) 360px, 300px"
                draggable={false}
                className="relative block h-auto w-full select-none"
              />
            </div>
            <span className="mx-auto mb-9 block h-px w-[min(76rem,86vw)] bg-gradient-to-r from-transparent via-[#1D6FB8]/40 to-transparent" />
            <div className="relative">
              <div
                className="overflow-hidden"
                style={{
                  maskImage:
                    "linear-gradient(to right, transparent 0%, #000 12%, #000 88%, transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to right, transparent 0%, #000 12%, #000 88%, transparent 100%)",
                }}
              >
                <div
                  className="flex w-max animate-[marquee_42s_linear_infinite] will-change-transform motion-reduce:animate-none"
                  style={{
                    animationPlayState: inView ? "running" : "paused",
                    animationDirection: "reverse",
                  }}
                >
                  {[...reviews, ...reviews].map((r, i) => (
                    <div
                      key={`${r.id}-${i}`}
                      className="flex w-40 shrink-0 flex-col items-center gap-3 px-4"
                    >
                      <span className="grid h-[74px] w-[74px] place-items-center rounded-full bg-white shadow-[0_18px_36px_-18px_rgb(23_63_140/0.55)] ring-1 ring-white/70">
                        <Avatar review={r} size={64} />
                      </span>
                      <span className="w-full truncate text-center font-headline text-[0.78rem] font-semibold text-[#2B3A5C]">
                        {r.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {/* focus falloff — real backdrop blur that dissolves at the
                  same pace the faces fade out */}
              <span
                className="pointer-events-none absolute inset-y-0 left-0 w-28"
                style={{
                  backdropFilter: "blur(7px)",
                  WebkitBackdropFilter: "blur(7px)",
                  maskImage: "linear-gradient(to right, #000 0%, transparent 100%)",
                  WebkitMaskImage: "linear-gradient(to right, #000 0%, transparent 100%)",
                }}
              />
              <span
                className="pointer-events-none absolute inset-y-0 right-0 w-28"
                style={{
                  backdropFilter: "blur(7px)",
                  WebkitBackdropFilter: "blur(7px)",
                  maskImage: "linear-gradient(to left, #000 0%, transparent 100%)",
                  WebkitMaskImage: "linear-gradient(to left, #000 0%, transparent 100%)",
                }}
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* ── full-review dialog ── */}
      <AnimatePresence>
        {openReview ? (
          <motion.div
            className="fixed inset-0 z-[400] flex items-center justify-center p-4 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <button
              type="button"
              aria-label="Close review"
              onClick={() => setOpenId(null)}
              className="absolute inset-0 cursor-default bg-[#0B1B3A]/60 backdrop-blur-sm"
            />
            <FocusTrap
              active
              className="relative z-10 flex w-full max-w-2xl justify-center"
            >
              <motion.article
                role="dialog"
                aria-modal="true"
                aria-label={`Full review by ${openReview.name}`}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 12 }}
                transition={{ duration: 0.32, ease: EASE_QUINT }}
                className="relative max-h-[86vh] w-full overflow-y-auto rounded-[28px] border border-[#E6ECF9] bg-white shadow-[0_70px_150px_-45px_rgb(11_27_58/0.65)]"
              >
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1 rounded-t-[28px] bg-gradient-to-r from-[#1D6FB8] via-[#60A5FA] to-transparent"
                />
                <button
                  type="button"
                  onClick={() => setOpenId(null)}
                  aria-label="Close review"
                  className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full border border-[#E6ECF9] bg-white text-[#5B6B87] transition-colors hover:border-[#1D6FB8]/40 hover:text-[#1D6FB8]"
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>

                <div className="p-7 sm:p-9">
                  <span className="font-headline text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-[#1D6FB8]">
                    Student story · Language Hub
                  </span>

                  <div className="mt-5 flex items-center gap-4">
                    <Avatar review={openReview} size={72} />
                    <div className="min-w-0">
                      <h3
                        id="rv-title"
                        className="truncate font-headline text-[1.45rem] font-semibold tracking-[-0.015em] text-[#0B1B3A]"
                      >
                        {openReview.name}
                      </h3>
                      {openReview.role ? (
                        <p className="mt-0.5 truncate text-[0.86rem] text-[#7C8AA5]">
                          {openReview.role}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap items-center gap-2.5">
                        <Stars size="h-4 w-4" />
                        <span
                          className={`rounded-full border border-[#DCE7FB] bg-[#EEF4FF] px-2.5 py-0.5 text-[#1D6FB8] ${CHIPS}`}
                        >
                          {openReview.course}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-[#EDF1FA] bg-[#F8FAFF] p-6">
                    <span
                      aria-hidden
                      className="block font-headline text-[2.6rem] font-bold leading-[0.55] text-[#1D6FB8]/25"
                    >
                      &ldquo;
                    </span>
                    <p className="mt-4 font-headline text-[1.05rem] leading-[1.85] text-[#3B4A6B]">
                      {openReview.quote}
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <span className="flex flex-wrap items-center gap-2">
                      {openReview.outcome ? (
                        <span
                          className={`rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 ${CHIPS}`}
                        >
                          {openReview.outcome}
                        </span>
                      ) : null}
                    </span>
                    <span className="font-headline text-[0.66rem] font-medium uppercase tracking-[0.18em] text-[#93A3BF]">
                      Verified feedback
                    </span>
                  </div>
                </div>
              </motion.article>
            </FocusTrap>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
