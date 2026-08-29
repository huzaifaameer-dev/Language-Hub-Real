"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle2, GraduationCap, Mic } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  kicker: string;
  title: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  maxWidth?: string;
}

const ease = [0.16, 1, 0.3, 1] as const;

const FEATURES = [
  { icon: Mic, text: "Live spoken English classes with real conversation practice" },
  { icon: BookOpen, text: "IELTS, PTE & Duolingo preparation with assigned books" },
  { icon: GraduationCap, text: "Track your application and enrollment in real time" },
];

const FLOATERS = [
  { icon: Mic, label: "Spoken English", cls: "left-[8%] top-[16%] delay-0", delay: "0s" },
  { icon: BookOpen, label: "IELTS Prep", cls: "right-[6%] top-[30%]", delay: "-2.2s" },
  { icon: GraduationCap, label: "PTE Ready", cls: "left-[14%] bottom-[20%]", delay: "-4s" },
];

export function AuthShell({
  kicker,
  title,
  subtitle,
  children,
  footer,
  maxWidth = "max-w-md",
}: AuthShellProps) {
  return (
    <div className="grid min-h-screen bg-[#f4f6fb] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      {/* Brand panel — desktop only */}
      <aside className="mesh-auth relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-ink/20 blur-3xl" />

        {/* floating feature chips */}
        {FLOATERS.map((f) => (
          <div
            key={f.label}
            aria-hidden
            className={cn("absolute hidden animate-bob rounded-2xl bg-white/12 py-2.5 pr-4 pl-2.5 backdrop-blur-md xl:flex xl:items-center xl:gap-2.5", f.cls)}
            style={{ animationDelay: f.delay }}
          >
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/20">
              <f.icon className="h-4 w-4" strokeWidth={2} />
            </span>
            <span className="font-display text-[0.72rem] font-bold tracking-wide">{f.label}</span>
          </div>
        ))}

        {/* wordmark */}
        <div className="relative flex items-center gap-3">
          <Link
            href="/"
            className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white shadow-lg transition-transform duration-300 hover:scale-105"
            aria-label="Back to Language Hub"
          >
            <Logo size="xs" eager />
          </Link>
          <span className="font-display text-[0.95rem] font-extrabold tracking-wide">
            Language Hub
          </span>
        </div>

        {/* headline + features */}
        <div className="relative max-w-lg">
          <motion.h2
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.05 }}
            className="font-display text-[clamp(2.1rem,3.4vw,3.1rem)] font-extrabold leading-[1.08] tracking-[-0.025em]"
          >
            Learn English with confidence, book by book.
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.15 }}
            className="mt-7 flex flex-col gap-3.5"
          >
            {FEATURES.map((f) => (
              <div key={f.text} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-white/85" strokeWidth={2} />
                <p className="font-sans text-[0.95rem] leading-relaxed text-white/85">{f.text}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* footer */}
        <div className="relative flex items-center justify-between">
          <p className="font-mono text-[0.68rem] tracking-widest text-white/55">
            HUB OF LANGUAGE EXCELLENCE
          </p>
          <div className="flex items-end gap-1" aria-hidden>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className="w-1 animate-wavebar rounded-full bg-white/60"
                style={{ height: `${10 + ((i * 7) % 16)}px`, animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </div>
        </div>
      </aside>

      {/* Form panel */}
      <div className="relative flex items-center justify-center px-5 py-12 sm:px-10">
        <div
          aria-hidden="true"
          className="bg-grid pointer-events-none absolute inset-0 opacity-70"
          style={{
            maskImage: "radial-gradient(ellipse at center, black 20%, transparent 72%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 20%, transparent 72%)",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease }}
          className={cn("relative z-10 w-full", maxWidth)}
        >
          {/* mobile wordmark */}
          <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
            <Link
              href="/"
              className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-slate-200/70 transition-transform hover:scale-105"
              aria-label="Back to Language Hub"
            >
              <Logo size="xs" eager />
            </Link>
            <span className="font-display text-[0.85rem] font-extrabold tracking-wide text-slate-900">
              Language Hub
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.12 }}
            className="mb-7 text-center lg:text-left"
          >
            <p className="font-display text-[0.72rem] font-bold uppercase tracking-[0.22em] text-indigo-600">
              {kicker}
            </p>
            <h1 className="mt-2 font-display text-[clamp(1.9rem,4.5vw,2.5rem)] font-extrabold leading-tight tracking-[-0.03em] text-slate-900">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-2 font-sans text-[0.97rem] leading-relaxed text-slate-500">
                {subtitle}
              </p>
            ) : null}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease, delay: 0.2 }}
            className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_30px_70px_-32px_rgb(15_23_42/0.35)] sm:p-8"
          >
            {children}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease, delay: 0.28 }}
            className="mt-6 text-center font-sans text-[0.88rem] text-slate-500"
          >
            {footer}
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}

export function Field({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
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
  required?: boolean;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block font-sans text-[0.82rem] font-semibold text-slate-700"
      >
        {label}
      </label>
      <div className="relative">
        {icon ? (
          <span aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        ) : null}
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className={cn(
            "h-12 w-full rounded-xl border bg-white px-4 font-sans text-[0.95rem] text-slate-900 shadow-[0_1px_2px_rgb(15_23_42/0.04)] outline-none transition-all duration-300 placeholder:text-slate-400",
            icon ? "pl-11" : undefined,
            trailing ? "pr-11" : undefined,
            error
              ? "border-rose-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10"
              : "border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/12"
          )}
        />
        {trailing ? (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</span>
        ) : null}
      </div>
      {error ? (
        <p className="mt-1.5 flex items-center gap-1 font-sans text-[0.78rem] font-medium text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}