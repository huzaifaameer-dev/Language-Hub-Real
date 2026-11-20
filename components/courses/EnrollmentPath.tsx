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

interface Anchor {
  x: number;
  y: number;
  h: number;
}

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
 * Dashed route joining the three number badges with a quiet coral shimmer
 * crawling along it. Always measured against the live layout.
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
      const discs = [...host.querySelectorAll<HTMLElement>("[data-disc]")];
      if (discs.length !== 3 || !discs[0].getBoundingClientRect().width) {
        return;
      }
      const d = discs.map(toAnchor);

      // The route follows the discs on every breakpoint: they always share one
      // column (centre on desktop, left rail on mobile), so the line stays calm.
      setGeo({
        w: hr.width,
        h: hr.height,
        segs: [0, 1].map((i) => verticalSegment(d[i], d[i + 1])),
      });
    };
    measure();
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }
    window.addEventListener("resize", measure, { passive: true });
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <div
      ref={hostRef}
      className="relative mt-16 lg:mt-20 motion-safe:animate-[soft-rise_0.9s_cubic-bezier(0.16,1,0.3,1)_both]"
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
              <path
                d={s.d}
                fill="none"
                stroke="#0f6b5c"
                strokeOpacity="0.22"
                strokeWidth="1.5"
                strokeDasharray="9 11"
                strokeLinecap="round"
              />
              <path
                d={s.d}
                fill="none"
                stroke="#fb6a47"
                strokeOpacity="0.8"
                strokeWidth="1.6"
                strokeDasharray="5 17"
                strokeLinecap="round"
                className="motion-safe:animate-[flowdash_3.2s_linear_infinite] motion-reduce:hidden"
              />
              <path
                d="M -6 -5.6 L 6.6 0 L -6 5.6 L -3.6 0 Z"
                fill="#0f6b5c"
                fillOpacity="0.7"
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

const STEPS = [
  {
    icon: UserPlus,
    title: "Create your account",
    desc: "Sign up in a minute with your email or Google account — it's free and takes no time at all.",
    accent: "#0f6b5c",
    dark: false,
    metaLeft: false,
  },
  {
    icon: ClipboardList,
    title: "Register your course",
    desc: "Apply for the programme that fits your goal — Spoken English, IELTS, PTE or Duolingo — and upload your payment proof.",
    accent: "#fb6a47",
    dark: true,
    metaLeft: true,
  },
  {
    icon: Rocket,
    title: "Start your journey",
    desc: "Join your batch and begin live, small-batch classes with structured, trackable progress.",
    accent: "#d99a1a",
    dark: false,
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
      className="relative overflow-hidden bg-white px-5 pb-20 pt-14 sm:px-8 sm:pb-24 sm:pt-16"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage: "repeating-linear-gradient(135deg, rgba(15,107,92,0.03) 0 1px, transparent 1px 26px)",
        }}
      />

      <div className="relative mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center motion-safe:animate-[soft-rise_0.9s_cubic-bezier(0.16,1,0.3,1)_both]">
          <div className="flex items-center justify-center gap-3">
            <span aria-hidden className="h-px w-7 bg-[#fb6a47]/60" />
            <span className="font-display text-[0.62rem] font-bold uppercase tracking-[0.3em] text-[#d9532f]">
              How it works
            </span>
            <span aria-hidden className="h-px w-7 bg-[#fb6a47]/60" />
          </div>
          <h2 className="mt-4 font-display text-[clamp(1.95rem,4.2vw,3rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-ink">
            Three clear steps to{" "}
            <span className="text-[#0f6b5c]">get started.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-[34rem] font-sans text-[0.97rem] leading-[1.8] text-ink-2">
            We have streamlined onboarding so you move forward with full
            confidence at every stage — no hidden steps, no confusion.
          </p>
        </div>

        <ConnectorFlow>
          <div className="flex flex-col gap-16 lg:gap-24">
            {STEPS.map((s, i) => {
              const num = String(i + 1).padStart(2, "0");

              const meta = (
                <div className={"order-2 text-start " + (s.metaLeft ? "lg:order-1 lg:text-right" : "lg:order-3 lg:text-left")}>
                  <div className="inline-flex items-center gap-3">
                    <span
                      data-badge
                      aria-hidden
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl font-display text-[0.85rem] font-bold text-white shadow-[0_12px_24px_-14px_rgba(10,78,67,0.7)] sm:h-10 sm:w-10 sm:text-[0.92rem]"
                      style={{ backgroundColor: s.accent }}
                    >
                      {num}
                    </span>
                    <h3 className="font-display text-[0.88rem] font-bold uppercase tracking-[0.05em] text-ink sm:text-[1.02rem] sm:tracking-[0.07em]">
                      {s.title}
                    </h3>
                  </div>
                </div>
              );

              const desc = (
                <div className={"order-3 text-start " + (s.metaLeft ? "lg:order-3 lg:text-left" : "lg:order-1 lg:text-right")}>
                  <p className="max-w-[22rem] font-sans text-[0.9rem] leading-[1.8] text-ink-2 sm:text-[0.92rem] lg:mx-0">
                    {s.desc}
                  </p>
                </div>
              );

              return (
                <div
                  key={s.title}
                  className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 lg:grid-cols-[1fr_auto_1fr] lg:gap-x-14 lg:gap-y-7"
                >
                  <div className="order-1 row-span-2 flex justify-center lg:order-2 lg:row-span-1">
                    <motion.div
                      data-disc
                      initial={reduce ? false : { opacity: 0, scale: 0.82, rotate: -8 }}
                      whileInView={reduce ? undefined : { opacity: 1, scale: 1, rotate: 0 }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{ type: "spring", stiffness: 220, damping: 18, delay: i * 0.12 }}
                      className="group relative grid h-20 w-20 place-items-center lg:h-36 lg:w-36"
                    >
                      <span
                        aria-hidden
                        className="absolute inset-0 -rotate-12 rounded-[1.4rem] shadow-[0_24px_40px_-24px_rgba(10,78,67,0.55)] lg:rounded-[2.4rem]"
                        style={{ backgroundColor: s.accent }}
                      />
                      <span className="relative z-10 grid h-14 w-14 place-items-center rounded-full border border-white/70 bg-white shadow-[0_30px_54px_-30px_rgba(10,78,67,0.5)] lg:h-24 lg:w-24">
                        <s.icon
                          className="icon-hover-pop h-6 w-6 lg:h-9 lg:w-9"
                          strokeWidth={1.5}
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

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, ease, delay: 0.1 }}
          className="mt-14 flex flex-wrap items-center justify-center gap-3 lg:mt-16"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eaf7f3] text-[#0f6b5c]">
            <MessageCircle className="h-4 w-4" strokeWidth={2} />
          </span>
          <p className="text-center font-sans text-[0.9rem] leading-relaxed text-ink-2">
            Prefer to talk first?{" "}
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#0f6b5c] underline decoration-[#0f6b5c]/35 underline-offset-4 transition-colors hover:text-[#0a4e43]"
            >
              Message us on WhatsApp
            </a>{" "}
            <span className="text-ink-3">— our team replies within minutes.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
