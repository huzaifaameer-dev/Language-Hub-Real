"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useInView, useReducedMotionSafe } from "@/lib/hooks";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  GraduationCap,
  MessageCircle,
  Mic,
  PenTool,
  PlayCircle,
  Volume2,
} from "lucide-react";

import { useLang } from "@/components/LanguageProvider";
import { LEARNERS_GUIDED } from "@/lib/content";

const ease = [0.16, 1, 0.3, 1] as const;

/** Warm ivory paper — never pure white. */
const PAPER = "#FBFAF7";

async function goTo(id: string) {
  const { scrollToId } = await import("@/lib/scroll");
  scrollToId(id);
}

const rise = (delay: number, reduce: boolean) => ({
  initial: { opacity: 0, y: reduce ? 0 : 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease, delay },
});

/* ───────────────────────────── trust badge ───────────────────────────── */

/**
 * Trust signal, deliberately understated: no icon, no shadow, no saturated
 * fill — just a quiet eyebrow line of type above the headline.
 */
function TrustBadge({ reduce }: { reduce: boolean }) {
  return (
    <motion.div {...rise(0.05, reduce)}>
      <span className="inline-flex items-center rounded border border-[#0B1B3A]/[0.07] bg-[#F1F4F9] px-2.5 py-1 font-display text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#5B6B87]">
        Trusted by {LEARNERS_GUIDED.toLocaleString()}+ Learners
      </span>
    </motion.div>
  );
}

/* ─────────────────────── handwritten editorial note ─────────────────────── */

/**
 * Editorial annotation, set in the open space the subject in the photograph is
 * looking toward. No backing wash behind it — the note sits straight on the
 * photograph so nothing reads as haze around the type.
 */
function HandwrittenNote({ reduce }: { reduce: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease, delay: 0.65 }}
      className="relative inline-block -rotate-2"
    >
      <p
        className="whitespace-nowrap text-[1.15rem] font-normal leading-[1.38] tracking-[0.005em] text-ink sm:text-[1.26rem]"
        style={{ fontFamily: "var(--font-hand)" }}
      >
        Better
        <br />
        English.
        <br />
        Bigger
        <br />
        <span className="relative inline-block">
          Opportunities.
          <svg
            aria-hidden
            className="absolute -bottom-[0.1em] left-0 h-[0.1em] w-full"
            viewBox="0 0 160 8"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M2 6.8C40 3.8 106 2.6 158 5"
              stroke="#1E3A5F"
              strokeWidth="1.3"
              strokeLinecap="round"
              opacity="0.38"
            />
          </svg>
        </span>
      </p>
    </motion.div>
  );
}

/* ───────────────────────────── founder ───────────────────────────── */

/**
 * Byline, not a profile component: a small circular portrait and two lines of
 * type. No ring, no card, no tracked-out caps — plain capitalisation so it
 * reads like a credit line in a magazine.
 */
function FounderLine({ reduce }: { reduce: boolean }) {
  return (
    <motion.div {...rise(0.52, reduce)} className="flex items-center gap-3">
      <Image
        src="/javeria-malik.jpg?v=2"
        alt="Javaria Malik"
        width={40}
        height={40}
        className="h-10 w-10 shrink-0 rounded-full object-cover"
      />
      <span className="min-w-0">
        <span className="block font-display text-[0.96rem] font-bold leading-tight text-ink">
          Javaria Malik
        </span>
        <span className="mt-0.5 block font-sans text-[0.8rem] leading-tight text-ink-3">
          Head of Language Hub
        </span>
      </span>
    </motion.div>
  );
}

/* ───────────────────────────── actions ───────────────────────────── */

/**
 * Primary action — a plain text link with a thin arrow. No filled button, so
 * the headline and the photograph keep all the weight in the composition.
 * Sends visitors to the free AI placement test: instant value, zero commitment.
 */
function PrimaryCta() {
  return (
    <Link
      href="/placement-test"
      className="group inline-flex items-center gap-1.5 font-display text-[0.95rem] font-bold tracking-[-0.01em] text-[#0B1B3A] transition-colors duration-300 hover:text-[#1D6FB8] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1D6FB8]"
    >
      Check Your Level — Free
      <ArrowRight
        className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
        strokeWidth={1.8}
      />
    </Link>
  );
}

/** Secondary action — quieter than the primary, outlined play disc + label. */
function SecondaryCta({ onGo }: { onGo: () => void }) {
  return (
    <button
      type="button"
      onClick={onGo}
      className="group relative inline-flex items-center gap-3 pb-1.5 font-display text-[0.95rem] font-bold tracking-[-0.01em] text-ink-2 transition-colors duration-300 hover:text-ink"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#0B1B3A]/12 transition-colors duration-300 group-hover:border-[#1D6FB8]/45 group-hover:bg-[#1D6FB8]/[0.06]">
        <PlayCircle className="h-[1.1rem] w-[1.1rem] text-[#1D6FB8]" strokeWidth={1.6} />
      </span>
      Explore Courses
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-[#1D6FB8]/55 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
      />
    </button>
  );
}

/* ───────────────────────────── course strip ───────────────────────────── */

/**
 * Programme strip — a continuously scrolling marquee.
 *
 * The track holds exactly two identical halves, so `translateX(-50%)` lands
 * precisely on the start of the second copy and the loop has no seam.
 *
 * Hover decelerates it (never stops) by rewriting the animation timing so the
 * normalized progress — and therefore the on-screen position — is preserved
 * across the speed change; releasing the pointer accelerates it back the same
 * seamless way.
 */
const STRIP: Array<{ icon: typeof GraduationCap; label: string }> = [
  { icon: GraduationCap, label: "IELTS Preparation" },
  { icon: MessageCircle, label: "Spoken English" },
  { icon: Mic, label: "PTE Academic" },
  { icon: PenTool, label: "Duolingo English Test" },
  { icon: BookOpen, label: "Creative Writing" },
  { icon: Briefcase, label: "Business Writing" },
  { icon: Volume2, label: "Pronunciation Drills" },
];

/** Steady and slow; on hover it decelerates but never stops. */
const STRIP_FAST_MS = 70_000;
const STRIP_SLOW_MS = 150_000;

function CourseStrip({ reduce }: { reduce: boolean }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [stripRef, inView] = useInView<HTMLDivElement>();

  /**
   * Decelerate / accelerate on hover without ever snapping.
   *
   * A CSS marquee's position is purely its NORMALIZED progress — elapsed time
   * (measured from the current delay) over duration — so the track only stays
   * continuous if that ratio is identical on both sides of the swap. Two past
   * bugs are folded into this one formula: assuming the outgoing duration was
   * always FAST (wrong on mouse-leave → the row lurched forward), and ignoring
   * the live delay offset (wrong on every swap after the first → progress was
   * recomputed from a shifted origin). Reading both from the effect and
   * solving `delay = t - next * progress` keeps progress untouched either way:
   * the strip simply glides out of the hover from exactly where it was.
   */
  const setSpeed = (slow: boolean) => {
    const el = trackRef.current;
    if (!el) return;
    const [anim] = el.getAnimations();
    if (!anim || !anim.effect) return;
    const t = Number(anim.currentTime ?? 0);
    const timing = anim.effect.getTiming();
    const cur = Number(timing.duration || STRIP_FAST_MS);
    const next = slow ? STRIP_SLOW_MS : STRIP_FAST_MS;
    if (next === cur) return;
    const origin = Number(timing.delay || 0);
    // progress since the animation's real origin; modulo normalised so a
    // negative origin delay (a swap that happened in the past) still lands
    // in [0, 1).
    const elapsed = (((t - origin) % cur) + cur) % cur;
    const progress = elapsed / cur;
    const delay = t - next * progress;
    anim.effect.updateTiming({
      duration: next,
      delay,
      easing: "linear",
      iterations: Infinity,
    });
  };

  const items: Array<{ icon: typeof GraduationCap; label: string }> = [...STRIP];
  const loop = [...items, ...items];

  return (
    <motion.div
      {...rise(0.85, reduce)}
      ref={stripRef}
      className="relative overflow-hidden border-t border-[#0B1B3A]/[0.08] bg-[#F5F2EA]"
    >
      <div className="flex items-stretch">
        {/* Static label rail — gives the band a start point so it reads as a
            labelled strip rather than a lone marquee. */}
        <div className="z-10 hidden shrink-0 items-center border-r border-[#0B1B3A]/10 bg-[#F5F2EA] pl-6 pr-6 sm:flex lg:pl-14 lg:pr-7 2xl:pl-16">
          <span className="font-display text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[#5B6B87]">
            Our Programmes
          </span>
        </div>

        {/* Marquee rail */}
        <div
          className="relative min-w-0 flex-1 overflow-hidden"
          onMouseEnter={() => !reduce && setSpeed(true)}
          onMouseLeave={() => setSpeed(false)}
        >
          {/* Fades to the strip's own tone, so items slide under the band. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#F5F2EA] to-transparent sm:w-20"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#F5F2EA] to-transparent sm:w-20"
          />

          <div
            ref={trackRef}
            className="flex w-max animate-[marquee_70s_linear_infinite] items-center py-[1.15rem] will-change-transform motion-reduce:animate-none"
            style={{ animationPlayState: inView ? "running" : "paused" }}
          >
            {loop.map(({ icon: Icon, label }, i) => (
              <div key={`${label}-${i}`} className="flex shrink-0 items-center">
                {/* A defined tile anchors each item so the row reads as a strip
                    rather than loose words drifting over the background. */}
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-[#0B1B3A]/[0.08] bg-white/85">
                  <Icon className="h-3.5 w-3.5 text-[#6B7A99]" strokeWidth={1.8} />
                </span>
                <span className="ml-2.5 whitespace-nowrap font-display text-[0.84rem] font-semibold tracking-tight text-[#3B4A6B]">
                  {label}
                </span>
                <span
                  aria-hidden
                  className="mx-6 h-4 w-px bg-[#0B1B3A]/15 sm:mx-8"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ───────────────────────────── hero ───────────────────────────── */

export function Hero() {
  const { lang } = useLang();
  const isUr = lang === "ur";
  const reduce = useReducedMotionSafe() === true;

  return (
    <section
      id="home"
      data-section
      dir={isUr ? "rtl" : "ltr"}
      aria-label="Welcome to Language Hub"
      className="relative isolate overflow-hidden"
      style={{ background: PAPER }}
    >
      {/* Paper field: a soft white bloom behind the copy, warm ivory at the
          base. Enough to keep the type crisp, never enough to look like a
          gradient background. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(90% 70% at 14% 26%, #FFFFFF 0%, rgba(255,255,255,0) 62%), radial-gradient(70% 60% at 4% 100%, #F2F0E9 0%, rgba(242,240,233,0) 62%)",
          }}
        />
      </div>

      {/* Full-bleed grid: the copy column is padded, the photograph column is
          not — it runs to the right edge of the viewport on every desktop
          width, which is what makes it read as an editorial image rather than
          a panel. Navbar is 4.2rem tall and fixed, hence the top offset. */}
      <div className="relative grid items-center pt-[4.2rem] lg:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)]">
        {/* ═══════════ LEFT — copy ═══════════ */}
        <div className="flex items-center px-6 pb-12 pt-10 sm:px-10 lg:py-[clamp(3rem,6vh,5rem)] lg:pl-[clamp(2rem,4.5vw,5.5rem)] lg:pr-6 2xl:pr-12">
          <div className="w-full max-w-[38rem]">
            <TrustBadge reduce={reduce} />

            {/* Poppins at 700: rounder and lighter than the previous face, so
                the block reads cleaner and more modern without losing presence.
                Colour still does the emphasis — no gradients, no glow. */}
            <motion.h1
              initial={{ opacity: 0, y: reduce ? 0 : 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease, delay: 0.14 }}
              className="mt-7 max-w-[38rem] text-[#0B1B3A]"
              style={{
                fontFamily: "var(--font-headline)",
                fontSize: "clamp(2.5rem, 4.9vw, 4.7rem)",
                fontWeight: 700,
                lineHeight: 0.97,
                letterSpacing: "-0.04em",
              }}
            >
              <span className="block">
                Master{" "}
                <span className="relative inline-block">
                  <span className="text-[#1D6FB8]">English</span>
                  {/* Thin, hand-drawn rather than a text-decoration: the curve
                      is deliberately uneven and sits tight under the word. */}
                  <svg
                    aria-hidden
                    className="absolute -bottom-[0.05em] left-0 h-[0.09em] w-full"
                    viewBox="0 0 200 10"
                    fill="none"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M2 7.8C54 4.6 132 3.4 198 5.6"
                      stroke="#1D6FB8"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      opacity="0.38"
                    />
                  </svg>
                </span>
              </span>
              <span className="block">and speak with</span>
              <span className="block text-[#2E6472]">confidence.</span>
            </motion.h1>

            <motion.p
              {...rise(0.4, reduce)}
              className="mt-7 max-w-[31rem] text-[1.04rem] leading-[1.68] text-ink-3"
            >
              Learn to speak, score, and express yourself fluently through live,
              small-batch classes built around real conversation.
            </motion.p>

            {/* Hairline gives the authority block its own section instead of
                letting it float in the same gap as everything else. */}
            <div className="mt-8 max-w-[31rem] border-t border-[#0B1B3A]/10 pt-6">
              <FounderLine reduce={reduce} />
            </div>

            <motion.div
              {...rise(0.6, reduce)}
              className="mt-9 flex flex-wrap items-center gap-x-9 gap-y-5"
            >
              <PrimaryCta />
              <SecondaryCta onGo={() => goTo("courses")} />
            </motion.div>
          </div>
        </div>

        {/* ═══════════ RIGHT — full-bleed photograph ═══════════ */}
        <div className="relative h-[24rem] w-full sm:h-[30rem] lg:h-[clamp(34rem,82vh,52rem)]">
          {/* Soft seam only. The blur is confined to the outer ~18% of the
              image so the photograph itself stays sharp and fully legible. */}
          <div
            aria-hidden
            className="absolute inset-0 overflow-hidden"
            style={{
              maskImage:
                "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.45) 9%, #000 19%, #000 100%)",
              WebkitMaskImage:
                "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.45) 9%, #000 19%, #000 100%)",
            }}
          >
            <Image
              src="/hero-editorial.jpg"
              alt=""
              fill
              priority
              aria-hidden
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="scale-[1.04] object-cover opacity-70 blur-[16px]"
            />
          </div>

          {/* Sharp layer — fully opaque past ~22% of its width. */}
          <motion.div
            initial={{ opacity: 0, scale: reduce ? 1 : 1.025 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease, delay: 0.12 }}
            className="absolute inset-0 overflow-hidden"
            style={{
              maskImage:
                "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.3) 6%, rgba(0,0,0,0.8) 14%, #000 22%, #000 100%)",
              WebkitMaskImage:
                "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.3) 6%, rgba(0,0,0,0.8) 14%, #000 22%, #000 100%)",
            }}
          >
            <Image
              src="/hero-editorial.jpg"
              alt="A Language Hub learner practising spoken English during a live small-batch class"
              fill
              priority
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-cover"
            />
          </motion.div>

          {/* Ivory wash: just enough to melt the left edge into the page tone.
              It stops well before mid-image so the photograph stays clear. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, #FBFAF7 0%, rgba(251,250,247,0.9) 3%, rgba(251,250,247,0.48) 9%, rgba(251,250,247,0.14) 16%, rgba(251,250,247,0) 25%)",
            }}
          />
          {/* Light feather on the bottom edge only, so it meets the course
              strip without dimming the subject. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
            style={{
              background: "linear-gradient(180deg, rgba(251,250,247,0) 0%, rgba(251,250,247,0.72) 100%)",
            }}
          />

          {/* Editorial annotation, set in the open space the subject in the
              photograph is looking toward — between the headline block and her
              face, never over either. Nudge `left`/`top` if the crop moves. */}
          <div className="pointer-events-none absolute left-[11%] top-[18%] sm:left-[14%] sm:top-[20%] lg:left-[17%] lg:top-[22%]">
            <HandwrittenNote reduce={reduce} />
          </div>
        </div>
      </div>

      <CourseStrip reduce={reduce} />
    </section>
  );
}