"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import { Navbar } from "@/components/navigation/Navbar";
import { cn } from "@/lib/utils";

type AuthTab = "signin" | "signup";

interface AuthShellProps {
  /** Which tab is highlighted in the form panel. */
  mode?: AuthTab | "plain";
  /** Swap between the two tabs in place — no navigation, no refresh. */
  onModeChange?: (mode: AuthTab) => void;
  /** Changing this key animates the panel content (title, form, footer). */
  animateKey?: string;
  kicker?: string;
  title: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  maxWidth?: string;
}

const ease = [0.16, 1, 0.3, 1] as const;

const PERKS = ["Expert Instructors", "Flexible Learning", "Personalized Experience"];

/**
 * The shared sign-in / sign-up surface: the real site navbar on a mint field,
 * one white card split into the story panel and the form panel.
 */
export function AuthShell({
  mode = "plain",
  onModeChange,
  animateKey,
  kicker,
  title,
  subtitle,
  children,
  footer,
  maxWidth = "max-w-[30rem]",
}: AuthShellProps) {
  const tabs: { id: AuthTab; label: string }[] = [
    { id: "signin", label: "Sign In" },
    { id: "signup", label: "Sign Up" },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eaf7f1]">
      {/* organic background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute -left-40 -top-56 h-[38rem] w-[38rem] rounded-full bg-[#dcf4e8]" />
        <span className="absolute -left-24 top-[42%] h-[18rem] w-[18rem] rounded-full bg-[#dff5ea]" />
        <span className="absolute -right-48 -top-40 h-[42rem] w-[42rem] rounded-full bg-[#cdeee0]" />
        <span className="absolute -bottom-56 -left-24 h-[34rem] w-[34rem] rounded-full bg-[#d4f0e3]" />
        <span className="absolute bottom-[-12rem] right-[-10rem] h-[30rem] w-[30rem] rounded-full bg-[#dff5ea]" />
        <span
          className="absolute right-[8%] top-[30%] hidden h-32 w-40 rounded-[1.5rem] opacity-70 lg:block"
          style={{
            backgroundImage: "radial-gradient(#8cc9b4 2px, transparent 2px)",
            backgroundSize: "20px 20px",
          }}
        />
      </div>

      {/* ── the real site navbar ─────────────────────────────────────── */}
      <Navbar />

      {/* ── card ─────────────────────────────────────────────────────── */}
      <main className="relative z-10 mx-auto max-w-[1200px] px-4 pb-14 pt-[6.4rem] sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="grid overflow-hidden rounded-[1.9rem] border border-white/70 bg-white shadow-[0_40px_90px_-50px_rgba(13,71,60,0.55)] lg:grid-cols-[minmax(0,1.04fr)_minmax(0,1fr)]"
        >
          {/* ── story panel ─────────────────────────────────────────────── */}
          <aside className="relative hidden min-h-[40rem] overflow-hidden bg-[linear-gradient(150deg,#f3fdf8_0%,#e8f9f0_45%,#d8f2e5_100%)] px-9 pb-6 pt-10 lg:flex lg:flex-col xl:px-11 xl:pt-11">
            <span className="relative inline-flex w-fit items-center gap-2 rounded-full bg-[#fde9e1] px-3.5 py-1.5 font-sans text-[0.78rem] font-semibold text-[#e8603c]">
              <span aria-hidden className="h-2 w-2 rounded-full bg-[#f26a4a]" />
              Welcome to Language Hub
            </span>

            <h2 className="relative mt-5 font-display text-[clamp(2.1rem,3.2vw,2.85rem)] font-extrabold leading-[1.08] tracking-[-0.042em] text-[#0b1f1b]">
              Learn English
              <br />
              With{" "}
              <span className="relative inline-block text-[#0d6a58]">
                Confidence.
                <svg aria-hidden viewBox="0 0 260 12" preserveAspectRatio="none" className="absolute -bottom-1.5 left-0 h-2.5 w-full">
                  <path d="M3 8c50-5 160-6 254-3" fill="none" stroke="#f26a4a" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
            </h2>

            <p className="relative mt-4 max-w-[21rem] font-sans text-[0.9rem] leading-[1.75] text-[#48625b]">
              Join our community of learners and take the first step towards a brighter
              future.
            </p>

            <ul className="relative mt-4 space-y-2.5">
              {PERKS.map((perk) => (
                <li key={perk} className="flex items-center gap-2.5 font-sans text-[0.85rem] text-[#315a50]">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-[#c6eedb] text-[#0d6a58]">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {perk}
                </li>
              ))}
            </ul>

            {/* illustration bleeds into the panel edges, like the mock */}
            <div aria-hidden className="relative mt-3 flex flex-1 items-end justify-end">
              <Image
                src="/brand/auth-illustration.png"
                alt=""
                width={1149}
                height={812}
                priority
                sizes="(min-width: 1024px) 560px, 0px"
                className="pointer-events-none -mb-6 -mr-9 w-[112%] max-w-[30rem] select-none xl:-mr-11"
              />
            </div>

            <div className="relative z-10 mt-3 flex items-center gap-4 rounded-2xl bg-[#e6f8ef] px-4 py-3">
              <div className="flex -space-x-2.5">
                {["/hero-student.webp", "/founder-2026.jpg", "/brand/hero-student-teal.png"].map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={src}
                    src={src}
                    alt=""
                    className="h-9 w-9 rounded-full border-2 border-white object-cover"
                    style={{ zIndex: 3 - i }}
                  />
                ))}
              </div>
              <div className="min-w-0">
                <p className="font-display text-[1.02rem] font-extrabold leading-none text-[#10231f]">
                  1,000+
                </p>
                <p className="mt-0.5 font-sans text-[0.7rem] text-[#5c706a]">Happy Learners</p>
              </div>
              <span aria-hidden className="h-9 w-px bg-[#c4ddd1]" />
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-display text-[1.02rem] font-extrabold leading-none text-[#10231f]">
                  <Star className="h-4 w-4 fill-[#f5c542] text-[#f5c542]" />
                  4.9/5
                </p>
                <p className="mt-0.5 font-sans text-[0.7rem] text-[#5c706a]">Student Rating</p>
              </div>
            </div>
          </aside>

          {/* ── form panel ──────────────────────────────────────────────── */}
          <section className="flex items-center px-6 py-9 sm:px-10 sm:py-11 xl:px-12">
            <div className={cn("mx-auto w-full", maxWidth)}>
              {mode !== "plain" ? (
                <div
                  className="mx-auto mb-7 flex max-w-[19.5rem] rounded-full bg-[#edf9f3] p-1.5"
                  role="tablist"
                  aria-label="Account"
                >
                  {tabs.map((tab) => {
                    const selected = mode === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        onClick={() => onModeChange?.(tab.id)}
                        className={cn(
                          "h-11 flex-1 rounded-full font-display text-[0.9rem] font-bold transition-colors duration-300",
                          selected
                            ? "bg-[#0d5c4d] text-white shadow-[0_10px_20px_-14px_rgba(13,92,77,0.9)]"
                            : "text-[#44615a] hover:text-[#0d6a58]"
                        )}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              ) : kicker ? (
                <p className="mb-3 text-center font-display text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#0d6a58]">
                  {kicker}
                </p>
              ) : null}

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={animateKey ?? "static"}
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.26, ease }}
                >
                  <div className="text-center">
                    <h1 className="font-display text-[clamp(1.7rem,3vw,2rem)] font-extrabold leading-tight tracking-[-0.035em] text-[#0b1f1b]">
                      {title}
                    </h1>
                    {subtitle ? (
                      <p className="mt-2 font-sans text-[0.9rem] leading-relaxed text-[#5c706a]">{subtitle}</p>
                    ) : null}
                  </div>

                  <div className="mt-7">{children}</div>

                  <div className="mt-6 text-center font-sans text-[0.86rem] text-[#5c706a]">{footer}</div>
                </motion.div>
              </AnimatePresence>
            </div>
          </section>
        </motion.div>
      </main>
    </div>
  );
}

/* ───────────────────────────── shared field ────────────────────────────── */

export function Field({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
  hint,
  required,
  icon,
  trailing,
}: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        {icon ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7d948e]"
          >
            {icon}
          </span>
        ) : null}
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? label}
          autoComplete={autoComplete}
          required={required}
          className={cn(
            "h-[3.4rem] w-full rounded-xl border bg-white px-4 font-sans text-[0.88rem] text-[#10231f] outline-none transition-all duration-300 placeholder:text-[#9aada7]",
            icon ? "pl-11" : undefined,
            trailing ? "pr-12" : undefined,
            error
              ? "border-rose-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10"
              : "border-[#e3ede9] hover:border-[#cfe3da] focus:border-[#0d6a58] focus:ring-4 focus:ring-[#0d6a58]/10"
          )}
        />
        {trailing ? (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2">{trailing}</span>
        ) : null}
      </div>
      {error ? (
        <p className="mt-1.5 font-sans text-[0.76rem] font-medium text-rose-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 font-sans text-[0.76rem] font-medium text-[#5c706a]">{hint}</p>
      ) : null}
    </div>
  );
}
