"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ClipboardList, MessageCircle, Rocket, UserPlus } from "lucide-react";
import { whatsappLink } from "@/lib/content";
import { useReducedMotionSafe } from "@/lib/hooks";

const ease = [0.16, 1, 0.3, 1] as const;

interface Segment {
  d: string;
  arrow: { x: number; y: number; angle: number };
}

/** A measured step marker: centre point plus its height. */
interface Anchor {
  x: number;
  y: number;
  h: number;
}

/**
 * A straight vertical connector from one step marker down to the next, with a
 * downward arrowhead.
 *
 * Desktop: runs between the three big step discs — the centre column holds
 * nothing else, so the line travels through clean empty space and never crosses
 * the body text that sits in the left/right columns.
 *
 * Mobile/tablet: runs between the number badges, which stack in a centred
 * column, giving an unmistakable top-to-bottom path.
 *
 * Either way the connector reads as one calm, professional vertical route.
 */
function verticalSegment(a: Anchor, b: Anchor): Segment {
  const padTop = a.h >= 100 ? 26 : 8;
  const padBottom = b.h >= 100 ? 26 : 12;
  const startY = a.y + a.h / 2 + padTop;
  const tipY = b.y - b.h / 2 - padBottom;
  return {
    d: `M ${a.x} ${startY} L ${b.x} ${tipY}`,
    arrow: { x: b.x, y: tipY, angle: 90 },
  };
}

/**
 * Dashed curve joining the three NUMBER badges (01 → 02 → 03) with a quiet
 * lightning shimmer crawling along it and a small arrowhead pointing into each
 * number. Measured once against the real badge positions, so the line always
 * lands on the numbers at any width. The badges paint above the line, so the
 * connection reads number → number, never box → box.
 */
function ConnectorFlow({ children }: { children: ReactNode }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [geo, setGeo] = useState<{ w: number; h: number; segs: Segment[] } | null>(null);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const measure = () => {
      const hr = host.getBoundingClientRect();
      const toAnchor = (el: HTMLElement): Anchor => {
        const r = el.getBoundingClientRect();
        return {
          x: r.left - hr.left + r.width / 2,
          y: r.top - hr.top + r.height / 2,
          h: r.height,
        };
      };
      const badges = [...host.querySelectorAll<HTMLElement>("[data-badge]")];
      const discs = [...host.querySelectorAll<HTMLElement>("[data-disc]")];
      if (badges.length !== 3 || discs.length !== 3 || !badges[0].getBoundingClientRect().width) {
        return;
      }
      const b = badges.map(toAnchor);
      const d = discs.map(toAnchor);

      // Stacked layout (mobile/tablet): badges share a near-vertical column.
      // Wide layout (desktop): badges sit in the side columns, so we anchor the
      // route to the centred discs instead — a clean vertical line down empty
      // space, clear of every text column.
      const stacked = (i: number) =>
        b[i + 1].y - b[i].y > 60 && Math.abs(b[i + 1].x - b[i].x) < 130;

      setGeo({
        w: hr.width,
        h: hr.height,
        segs: [0, 1].map((i) =>
          stacked(i)
            ? verticalSegment(b[i], b[i + 1])
            : verticalSegment(d[i], d[i + 1])
        ),
      });
    };
    measure();
    // Text metrics can change once webfonts land, which shifts row heights —
    // re-measure so the connector never drifts after the font swap.
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }
    window.addEventListener("resize", measure, { passive: true });
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <div
      ref={hostRef}
      // The entrance lives on the whole block, not on each row: every row (and
      // the connector) rises together, so their relative positions never change
      // mid-animation — no layout shift, no misaligned line.
      className="relative mt-16 lg:mt-24 motion-safe:animate-[soft-rise_0.9s_cubic-bezier(0.16,1,0.3,1)_both]"
    >
      {geo ? (
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 h-full w-full"
          width="100%"
          height="100%"
          viewBox={`0 0 ${geo.w} ${geo.h}`}
          preserveAspectRatio="none"
        >
          {geo.segs.map((s, i) => (
            <g key={i}>
              {/* base dashed route 01 → 02 → 03 */}
              <path
                d={s.d}
                fill="none"
                stroke="#0B1B3A"
                strokeOpacity="0.26"
                strokeWidth="1.5"
                strokeDasharray="9 11"
                strokeLinecap="round"
              />
              {/* lightning shimmer crawling along the same route */}
              <path
                d={s.d}
                fill="none"
                stroke="#2E86F0"
                strokeOpacity="0.75"
                strokeWidth="1.6"
                strokeDasharray="5 17"
                strokeLinecap="round"
                className="motion-safe:animate-[flowdash_3.2s_linear_infinite] motion-reduce:hidden"
              />
              {/* arrowhead pointing into the next number */}
              <path
                d="M -6 -5.6 L 6.6 0 L -6 5.6 L -3.6 0 Z"
                fill="#0B1B3A"
                fillOpacity="0.75"
                transform={`translate(${s.arrow.x} ${s.arrow.y}) rotate(${s.arrow.angle})`}
              />
            </g>
          ))}
        </svg>
      ) : null}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/**
 * Three enrolment steps as a vertical infographic.
 * Accents: step 1 + 3 carry the site blue; step 2 borrows the muted teal of
 * the hero's "confidence." so the column reads restrained, not rainbow.
 */
const STEPS = [
  {
    icon: UserPlus,
    title: "Create your account",
    desc: "Sign up in a minute with your email or Google account — it's free and takes no time at all.",
    accent: "#1D6FB8",
    metaLeft: false,
  },
  {
    icon: ClipboardList,
    title: "Register your course",
    desc: "Apply for the programme that fits your goal — Spoken English, IELTS, PTE or Duolingo — and upload your payment proof.",
    accent: "#2E6472",
    metaLeft: true,
  },
  {
    icon: Rocket,
    title: "Start your journey",
    desc: "Join your batch and begin live, small-batch classes with structured, trackable progress.",
    accent: "#1D6FB8",
    metaLeft: false,
  },
] as const;

export function EnrollmentPath() {
  const wa = whatsappLink("Assalam o alaikum! I'd like to ask about enrolment at Language Hub.");
  const reduce = useReducedMotionSafe();

  return (
    <section
      id="enroll"
      data-section
      aria-label="How to enrol"
      className="relative overflow-hidden bg-[#FBFAF7] px-6 pt-16 pb-16 sm:px-12 lg:px-16 lg:pt-16 lg:pb-16"
    >
      <div className="mx-auto max-w-5xl">
        {/* Heading — centred, editorial, Poppins */}
        <div className="mx-auto max-w-2xl text-center motion-safe:animate-[soft-rise_0.9s_cubic-bezier(0.16,1,0.3,1)_both]">
          <div className="flex items-center justify-center gap-4">
            <span aria-hidden className="h-px w-8 bg-[#0B1B3A]/25" />
            <span className="font-display text-[0.66rem] font-bold uppercase tracking-[0.24em] text-[#5B6B87]">
              How it works
            </span>
            <span aria-hidden className="h-px w-8 bg-[#0B1B3A]/25" />
          </div>
          <h2
            className="mt-5 text-[clamp(1.95rem,4vw,2.9rem)] leading-[1.06] tracking-[-0.025em] text-[#0B1B3A]"
            style={{ fontFamily: "var(--font-headline)", fontWeight: 700 }}
          >
            Three clear steps to <span className="text-[#1D6FB8]">get started.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-[34rem] text-[0.98rem] leading-[1.7] text-[#5B6B87]">
            We have streamlined the onboarding process so you move forward with
            full confidence at every stage — no hidden steps, no confusion.
          </p>
        </div>

        {/* Vertical infographic — number badges joined by a curved, shimmering
            dashed route (01 → 02 → 03), measured against the live layout. */}
        <ConnectorFlow>
          <div className="flex flex-col gap-16 lg:gap-28">
            {STEPS.map((s, i) => {
              const num = String(i + 1).padStart(2, "0");

              const meta = (
                <div className={"order-2 text-center " + (s.metaLeft ? "lg:order-1 lg:text-right" : "lg:order-3 lg:text-left")}>
                  <div className="inline-flex items-center gap-3">
                    <span
                      data-badge
                      aria-hidden
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display text-[0.95rem] font-bold text-white shadow-[0_12px_26px_-14px_rgb(11_27_58/0.7)]"
                      style={{ backgroundColor: s.accent }}
                    >
                      {num}
                    </span>
                    <h3 className="font-display text-[1.02rem] font-bold uppercase tracking-[0.08em] text-[#0B1B3A]">
                      {s.title}
                    </h3>
                  </div>
                </div>
              );

              const desc = (
                <div className={"order-3 text-center " + (s.metaLeft ? "lg:order-3 lg:text-left" : "lg:order-1 lg:text-right")}>
                  <p className="mx-auto max-w-[22rem] text-[0.92rem] font-light leading-[1.75] text-[#4A5A78] lg:mx-0">
                    {s.desc}
                  </p>
                </div>
              );

              return (
                <div
                  key={s.title}
                  className="grid items-center gap-7 lg:grid-cols-[1fr_auto_1fr] lg:gap-x-14"
                >
                  {/* Circle — layered: white disc centred on a larger tilted
                      rounded accent plate (rotate only, no offset) so the disc
                      sits dead-centre in the box with even breathing room. */}
                  <div className="order-1 flex justify-center lg:order-2">
                    <motion.div
                      data-disc
                      initial={reduce ? false : { opacity: 0, scale: 0.82, rotate: -8 }}
                      whileInView={reduce ? undefined : { opacity: 1, scale: 1, rotate: 0 }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{ type: "spring", stiffness: 220, damping: 18, delay: i * 0.12 }}
                      className="group relative grid h-36 w-36 place-items-center"
                    >
                      <span
                        aria-hidden
                        className="absolute inset-0 -rotate-12 rounded-[2.4rem]"
                        style={{ backgroundColor: s.accent }}
                      />
                      <span className="relative z-10 grid h-24 w-24 place-items-center rounded-full border border-[#0B1B3A]/[0.06] bg-white shadow-[0_34px_60px_-34px_rgb(11_27_58/0.5)]">
                        <s.icon
                          className="icon-hover-pop h-9 w-9"
                          strokeWidth={1.3}
                          style={{ color: s.accent }}
                        />
                      </span>
                    </motion.div>
                  </div>

                  {s.metaLeft ? (
                    <>
                      {meta}
                      {desc}
                    </>
                  ) : (
                    <>
                      {desc}
                      {meta}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </ConnectorFlow>

        {/* Assurance line — quiet, keeps the existing human contact nudge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, ease, delay: 0.1 }}
          className="mt-14 flex items-center justify-center gap-3 lg:mt-20"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1D6FB8]/10 text-[#1D6FB8]">
            <MessageCircle className="h-4 w-4" strokeWidth={2} />
          </span>
          <p className="text-center font-display text-[0.9rem] font-semibold leading-relaxed text-[#5B6B87]">
            Prefer to talk first?{" "}
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#1D6FB8] underline decoration-[#1D6FB8]/40 underline-offset-4 transition-colors hover:text-[#2E6472]"
            >
              Message us on WhatsApp
            </a>{" "}
            <span className="text-[#8B97AB]">— our team replies within minutes.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
