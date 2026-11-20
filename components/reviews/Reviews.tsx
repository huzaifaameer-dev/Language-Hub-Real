"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Quote,
  Star,
} from "lucide-react";
import { useLang } from "@/components/LanguageProvider";
import { useInView, useReducedMotionSafe } from "@/lib/hooks";
import { EASE_EXPO } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface ReviewItem {
  id: string;
  slug: string;
  name: string;
  role: string;
  course: string;
  headline: string;
  body: string;
  rating: number;
  outcome: string;
  avatar: string | null;
  batch: string;
  verified: boolean;
  featured: boolean;
  helpful: number;
}

interface Stats {
  total: number;
  average: number;
  fiveStar: number;
  fourStar: number;
  lowStar: number;
  verified: number;
  recommendPercent: number;
}

const FALLBACK: ReviewItem[] = [
  { id: "1", slug: "hira-nawaz-ielts", name: "Hira Nawaz", role: "IELTS Academic candidate", course: "IELTS Preparation", headline: "From a 5.5 to a 7.0 in nine weeks", body: "My teacher rebuilt my answers one sentence at a time. The weekly mocks felt harder than the real exam, so on test day I was calm.", rating: 5, outcome: "Band 7.0 overall", avatar: null, batch: "Evening batch", verified: true, featured: true, helpful: 0 },
  { id: "2", slug: "abdullah-raza-spoken", name: "Abdullah Raza", role: "Software engineer", course: "Spoken English", headline: "Meetings stopped being scary", body: "The small group format meant there was nowhere to hide, which was exactly what I needed. My team lead now asks me to run client calls.", rating: 5, outcome: "Now leads client calls", avatar: null, batch: "Evening batch", verified: true, featured: true, helpful: 0 },
  { id: "3", slug: "maham-tariq-pte", name: "Maham Tariq", role: "Nursing graduate", course: "PTE Preparation", headline: "Scored 79 on the first attempt", body: "The repeated-task templates showed me exactly where I was losing marks. I got my 79 and my registration is moving forward.", rating: 5, outcome: "PTE 79 — first attempt", avatar: null, batch: "Weekend batch", verified: true, featured: true, helpful: 0 },
  { id: "4", slug: "bilal-ahmed-spoken", name: "Bilal Ahmed", role: "Call-centre agent", course: "Spoken English", headline: "A better job in three months", body: "The interview practice made a real difference. I can get through an interview without losing my train of thought.", rating: 5, outcome: "Moved to a new role", avatar: null, batch: "Evening batch", verified: true, featured: false, helpful: 0 },
  { id: "5", slug: "sana-waqar-ielts", name: "Sana Waqar", role: "Second-year student", course: "IELTS Preparation", headline: "Writing 6.0 to 7.0", body: "My teacher marked every paragraph and showed me the band descriptors line by line. After four weeks I knew what the examiner wanted.", rating: 5, outcome: "Writing 6.0 to 7.0", avatar: null, batch: "Evening batch", verified: true, featured: false, helpful: 0 },
  { id: "6", slug: "usman-shah-spoken", name: "Usman Shah", role: "Bank officer", course: "Spoken English", headline: "I stopped translating in my head", body: "The role-play sessions forced me to respond in real time. My manager noticed the change before I did.", rating: 5, outcome: "Promoted to customer relations", avatar: null, batch: "Weekend batch", verified: true, featured: false, helpful: 0 },
];

const FALLBACK_STATS: Stats = { total: 14, average: 5, fiveStar: 14, fourStar: 0, lowStar: 0, verified: 14, recommendPercent: 100 };

function Stars({ value, className = "h-3.5 w-3.5" }: { value: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            className,
            i < value ? "fill-[#f5b93c] text-[#f5b93c]" : "fill-[#e9f1ee] text-[#e9f1ee]"
          )}
          strokeWidth={0}
        />
      ))}
    </span>
  );
}

function Initials({ r, size = 38 }: { r: ReviewItem; size?: number }) {
  if (r.avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={r.avatar}
        alt=""
        className="shrink-0 rounded-full object-cover ring-2 ring-[#d7f0e9] shadow-[0_6px_16px_-8px_rgba(10,78,67,0.5)]"
        style={{ width: size, height: size }}
      />
    );
  }

  const initials = r.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-[linear-gradient(145deg,#14a08c,#0a4e43)] font-display font-bold text-white ring-2 ring-[#d7f0e9] shadow-[0_6px_16px_-8px_rgba(10,78,67,0.5)]"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

/**
 * One review on the moving wall — a "plaque": a white outer frame holding a
 * mint inner panel, with the student's identity on top, a serif pull quote in
 * the middle and the outcome + helpful action pinned to the bottom. Fixed width
 * keeps every marquee row visually even.
 */
function Card({ r, className }: { r: ReviewItem; className?: string }) {
  return (
    <article className={cn("group relative flex w-[21rem] shrink-0 flex-col overflow-hidden rounded-[1.6rem] bg-white p-7 shadow-[0_18px_40px_-30px_rgba(6,46,40,0.35)] ring-1 ring-[#eaf3f0] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:shadow-[0_34px_60px_-32px_rgba(6,46,40,0.4)] hover:ring-[#b7e4d9] sm:w-[23rem]", className)}>
      <span aria-hidden className="card-sheen" />

      <div className="relative flex flex-1 flex-col">
        <span
          aria-hidden
          className="absolute -inset-x-7 -top-7 h-[3px] bg-[linear-gradient(90deg,#0f6b5c,#14a08c,#f5b93c,#fb6a47)]"
        />


        {/* identity */}
        <div className="relative flex items-center gap-3.5">
          <Initials r={r} size={56} />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate font-display text-[1rem] font-bold leading-tight text-ink">
              {r.name}
              {r.verified ? (
                <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#14a08c]" strokeWidth={2.4} aria-label="Verified student" />
              ) : null}
            </p>
            <p className="mt-1 truncate font-sans text-[0.58rem] font-bold uppercase tracking-[0.12em] text-[#d9532f]">
              {r.course}
            </p>
          </div>
          <span className="ml-auto self-start pt-0.5">
            <Stars value={r.rating} className="h-3 w-3" />
          </span>
        </div>

        <span aria-hidden className="relative mt-4 block h-px w-full bg-[#dcefe9]" />

        <Quote
          aria-hidden
          className="pointer-events-none absolute right-4 top-16 h-9 w-9 text-[#0f6b5c]/10 transition-transform duration-500 group-hover:-rotate-6"
          strokeWidth={1.4}
        />

        <h3 className="relative mt-6 pr-6 font-serif text-[1.3rem] font-semibold italic leading-[1.55] tracking-[-0.01em] text-ink">
          &ldquo;{r.headline}&rdquo;
        </h3>
        <p className="relative mt-3 line-clamp-3 font-sans text-[0.9rem] leading-[1.8] text-ink-2">
          {r.body}
        </p>

        <div className="relative mt-auto flex items-end justify-between gap-3 border-t border-[#eef5f2] pt-4">
          {r.outcome ? (
            <span className="inline-flex max-w-[13rem] items-start gap-1.5 rounded-full bg-[#f3fbf8] px-2.5 py-1 font-sans text-[0.55rem] font-bold uppercase leading-[1.4] tracking-[0.1em] text-[#0a4e43] ring-1 ring-inset ring-[#d7f0e9] transition-colors duration-300 group-hover:bg-[#eaf7f3]">
              <ArrowUpRight className="mt-[1px] h-3 w-3 shrink-0 text-[#fb6a47]" strokeWidth={2.4} />
              <span>{r.outcome}</span>
            </span>
          ) : (
            <span />
          )}
          <span className="shrink-0 font-display text-[0.55rem] font-bold uppercase tracking-[0.12em] text-ink-3">
            {r.batch || "Verified student"}
          </span>
        </div>
      </div>
    </article>
  );
}

export function Reviews() {
  const { dict } = useLang();
  const reduce = useReducedMotionSafe();
  const [sectionRef, inView] = useInView<HTMLElement>();
  const [reviews, setReviews] = useState<ReviewItem[]>(FALLBACK);
  const [stats, setStats] = useState<Stats>(FALLBACK_STATS);

  useEffect(() => {
    let alive = true;
    fetch("/api/reviews", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive || !data) return;
        if (Array.isArray(data.reviews) && data.reviews.length > 0) setReviews(data.reviews as ReviewItem[]);
        if (data.stats?.total) setStats(data.stats as Stats);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  /* Mobile: one column that drifts continuously from bottom to top. */
  useEffect(() => {
    if (reduce) return;
    const durations = [60000, 76000, 92000, 52000];
    const directions: PlaybackDirection[] = ["normal", "reverse", "normal", "normal"];
    const targets = [row1Ref.current, row2Ref.current, row3Ref.current, mobileRef.current];
    anims.current = targets.map((el, i) =>
      el
        ? el.animate(
            i === 3
              ? [{ transform: "translateY(0)" }, { transform: "translateY(-50%)" }]
              : [{ transform: "translateX(0)" }, { transform: "translateX(-50%)" }],
            { duration: durations[i], iterations: Infinity, easing: "linear", direction: directions[i] }
          )
        : null
    );
    return () => {
      anims.current.forEach((a) => a?.cancel());
      anims.current = [];
    };
  }, [reduce, reviews]);

  useEffect(() => {
    anims.current.forEach((a) => {
      if (!a) return;
      if (inView) a.play();
      else a.pause();
    });
  }, [inView, reviews]);

  const setRate = (index: number, rate: number) => {
    const a = anims.current[index];
    if (!a) return;
    try {
      a.updatePlaybackRate(rate);
    } catch {
      /* playback-rate updates unsupported — keep native speed */
    }
  };

  const fadeStyle = {
    maskImage: "linear-gradient(to right, transparent 0%, #000 8%, #000 92%, transparent 100%)",
    WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 8%, #000 92%, transparent 100%)",
  };

  const verticalFadeStyle = {
    maskImage:
      "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.35) 4%, #000 16%, #000 84%, rgba(0,0,0,0.35) 96%, transparent 100%)",
    WebkitMaskImage:
      "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.35) 4%, #000 16%, #000 84%, rgba(0,0,0,0.35) 96%, transparent 100%)",
  };

  const row1 = reviews;
  const row2 = [...reviews].reverse();
  const row3 = [...reviews.slice(3), ...reviews.slice(0, 3)];

  const row1Ref = useRef<HTMLDivElement | null>(null);
  const row2Ref = useRef<HTMLDivElement | null>(null);
  const row3Ref = useRef<HTMLDivElement | null>(null);
  const mobileRef = useRef<HTMLDivElement | null>(null);
  const anims = useRef<Array<Animation | null>>([]);
  const rowBase = "flex w-max gap-5 py-2";

  return (
    <section
      id="reviews"
      ref={sectionRef}
      data-section
      aria-label="Student reviews"
      className="relative overflow-hidden bg-[#f3fbf8] px-5 pb-20 pt-16 sm:px-8 sm:pb-24 sm:pt-[4.5rem]"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.6]"
        style={{
          backgroundImage: "repeating-linear-gradient(135deg, rgba(15,107,92,0.032) 0 1px, transparent 1px 26px)",
        }}
      />
      <span aria-hidden className="pointer-events-none absolute -left-24 top-10 h-[26rem] w-[26rem] rounded-full bg-[#14a08c]/10 blur-[120px]" />
      <span aria-hidden className="pointer-events-none absolute -right-20 bottom-0 h-[22rem] w-[22rem] rounded-full bg-[#fb6a47]/10 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 18 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8% 0px" }}
          transition={{ duration: 0.65, ease: EASE_EXPO }}
          className="text-center"
        >
          <span className="eyebrow-ref eyebrow-ref-center">
            {dict["reviews.eyebrow"] ?? "Verified student stories"}
          </span>
          <h2 className="section-title-ref mt-4">
            Loved by <span className="text-[#0f6b5c]">learners.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-[35rem] font-sans text-[0.97rem] leading-[1.8] text-ink-2">
            Real students, real scores, real outcomes — collected after each batch
            and matched to enrolment records.
          </p>

          <div className="mt-7 inline-flex flex-wrap items-center justify-center gap-4 rounded-2xl border border-line bg-white px-5 py-3.5 shadow-[0_18px_40px_-32px_rgba(10,78,67,0.4)] sm:gap-5 sm:px-6">
            <div className="text-center">
              <p className="font-display text-[2rem] font-extrabold leading-none tracking-[-0.04em] text-ink">
                {stats.average.toFixed(1)}
              </p>
              <Stars value={Math.round(stats.average)} className="mt-1.5 h-3.5 w-3.5" />
            </div>
            <div className="h-10 w-px bg-line" />
            <div className="text-left font-sans text-[0.78rem] leading-tight text-ink-3">
              <p className="font-semibold text-ink">{stats.total} verified reviews</p>
              <p className="mt-0.5">{stats.recommendPercent}% would recommend</p>
            </div>
          </div>
        </motion.div>

        {/* ── mobile: one column drifting bottom → top, continuously ───── */}
        <div className="mt-9 lg:hidden">
          <div className="relative h-[32rem] overflow-hidden" style={verticalFadeStyle}>
            <div
              ref={mobileRef}
              className="flex flex-col gap-4 py-2"
              onTouchStart={() => setRate(3, 0)}
              onTouchEnd={() => setRate(3, 1)}
            >
              {[0, 1].map((copy) => (
                <div
                  key={copy}
                  className="flex flex-col gap-4"
                  aria-hidden={copy === 1 ? true : undefined}
                >
                  {reviews.map((r) => (
                    <Card
                      key={`m-${copy}-${r.slug}`}
                      r={r}
                      className="w-full shadow-[0_16px_34px_-26px_rgba(6,46,40,0.35)]"
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 text-center font-sans text-[0.62rem] font-bold uppercase tracking-[0.2em] text-ink-3">
            Continuous · bottom to top
          </p>
        </div>

        {/* ── desktop: three drifting marquee rows ─────────────────────── */}
        <div className="mt-12 hidden flex-col gap-4 lg:flex" style={fadeStyle}>
          <div className="overflow-hidden">
            <div
              ref={row1Ref}
              className={rowBase}
              onMouseEnter={() => setRate(0, 0.25)}
              onMouseLeave={() => setRate(0, 1)}
            >
              {[...row1, ...row1].map((r, i) => (
                <Card key={`r1-${r.slug}-${i}`} r={r} />
              ))}
            </div>
          </div>

          <div className="overflow-hidden">
            <div
              ref={row2Ref}
              className={rowBase}
              onMouseEnter={() => setRate(1, 0.25)}
              onMouseLeave={() => setRate(1, 1)}
            >
              {[...row2, ...row2].map((r, i) => (
                <Card key={`r2-${r.slug}-${i}`} r={r} />
              ))}
            </div>
          </div>

          <div className="overflow-hidden">
            <div
              ref={row3Ref}
              className={rowBase}
              onMouseEnter={() => setRate(2, 0.25)}
              onMouseLeave={() => setRate(2, 1)}
            >
              {[...row3, ...row3].map((r, i) => (
                <Card key={`r3-${r.slug}-${i}`} r={r} />
              ))}
            </div>
          </div>
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, delay: 0.12, ease: EASE_EXPO }}
          className="mt-10 flex flex-col items-center gap-3"
        >
          <Link href="/success-stories" className="btn-teal group relative h-12 overflow-hidden px-7 text-[0.84rem]">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 -left-full w-2/3 -skew-x-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)] transition-transform duration-[900ms] ease-out group-hover:translate-x-[450%]"
            />
            <span className="relative">Read all student stories</span>
            <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={2.2} />
          </Link>
          <p className="font-sans text-[0.68rem] font-medium uppercase tracking-[0.18em] text-ink-3">
            Every review is tied to a real enrolment
          </p>
        </motion.div>
      </div>
    </section>
  );
}
