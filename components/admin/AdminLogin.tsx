"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Field } from "@/components/auth/AuthShell";
import { Navbar } from "@/components/navigation/Navbar";
import { Logo } from "@/components/ui/Logo";

const ease = [0.16, 1, 0.3, 1] as const;

const GUARANTEES = [
  "Separate credential store — admin access never rides a learner session.",
  "Every change lands in an immutable audit trail.",
  "Optional access code as a second factor.",
];

/**
 * Standalone control-suite sign-in. Completely separate from the learner
 * NextAuth flow: it exchanges email + password (+ optional access code) for
 * the signed `hub_admin_token` cookie via /api/admin/session.
 *
 * There is exactly one admin sign-in — no sign-up, no social providers, no
 * second door.
 */
export function AdminLogin({ accessCodeRequired }: { accessCodeRequired: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, accessCode: accessCode || undefined }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message ?? "Sign-in failed. Check your credentials.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eaf7f1]">
      {/* organic background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute -left-40 -top-56 h-[38rem] w-[38rem] rounded-full bg-[#d9f2e5]" />
        <span className="absolute -left-24 top-[42%] h-[18rem] w-[18rem] rounded-full bg-[#dff5ea]" />
        <span className="absolute -right-48 -top-40 h-[40rem] w-[40rem] rounded-full bg-[#c9eedd]" />
        <span className="absolute -bottom-56 -left-24 h-[34rem] w-[34rem] rounded-full bg-[#d4f0e3]" />
        <span className="absolute bottom-[-12rem] right-[-10rem] h-[30rem] w-[30rem] rounded-full bg-[#dff5ea]" />
      </div>

      {/* ── the real site navbar ─────────────────────────────────────── */}
      <Navbar />

      {/* ── card ─────────────────────────────────────────────────────── */}
      <main className="relative z-10 mx-auto max-w-[1100px] px-4 pb-14 pt-[6.4rem] sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="grid overflow-hidden rounded-[1.8rem] border border-white/70 bg-white shadow-[0_40px_90px_-50px_rgba(13,71,60,0.55)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
        >
          {/* story panel — deep green, signals restricted access */}
          <aside className="relative hidden overflow-hidden bg-[linear-gradient(165deg,#0d5c4d_0%,#0a4e43_52%,#083f37_100%)] p-10 text-white lg:flex lg:flex-col xl:p-12">
            <span aria-hidden className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-white/[0.06]" />
            <span aria-hidden className="absolute -bottom-24 -left-16 h-60 w-60 rounded-full bg-white/[0.05]" />
            <span
              aria-hidden
              className="absolute right-10 top-1/2 h-40 w-40 opacity-25"
              style={{
                backgroundImage: "radial-gradient(#8fe0c6 2px, transparent 2px)",
                backgroundSize: "18px 18px",
              }}
            />

            <span className="relative inline-flex w-fit items-center gap-2 rounded-full bg-white/12 px-4 py-1.5 font-sans text-[0.76rem] font-semibold text-[#c6f0e0] ring-1 ring-white/15">
              <Fingerprint className="h-3.5 w-3.5" strokeWidth={2.2} />
              Restricted access
            </span>

            <h2 className="relative mt-6 font-display text-[clamp(2.1rem,3vw,2.8rem)] font-extrabold leading-[1.08] tracking-[-0.04em]">
              One secure desk
              <br />
              for the whole
              <br />
              <span className="relative inline-block text-[#8fe0c6]">
                academy.
                <svg
                  aria-hidden
                  viewBox="0 0 240 12"
                  preserveAspectRatio="none"
                  className="absolute -bottom-1.5 left-0 h-2.5 w-full"
                >
                  <path
                    d="M3 8c46-5 148-6 234-3"
                    fill="none"
                    stroke="#f26a4a"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h2>

            <p className="relative mt-5 max-w-[22rem] font-sans text-[0.92rem] leading-[1.75] text-white/65">
              Admissions, learner records, programmes, live classes, feedback and the public
              site — managed from a single audited workspace.
            </p>

            <ul className="relative mt-6 space-y-3">
              {GUARANTEES.map((line) => (
                <li key={line} className="flex gap-2.5 font-sans text-[0.84rem] text-white/75">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/12 text-[#8fe0c6]">
                    <ShieldCheck className="h-3 w-3" strokeWidth={2.6} />
                  </span>
                  <span className="leading-relaxed">{line}</span>
                </li>
              ))}
            </ul>

            <div aria-hidden className="relative mt-8 flex flex-1 items-end justify-center">
              <ShieldIllustration className="h-[12.5rem] w-auto max-w-full" />
            </div>

            <div className="relative mt-6 flex items-center justify-between border-t border-white/12 pt-5 font-sans text-[0.68rem] uppercase tracking-[0.16em] text-white/40">
              <span>Single admin sign-in</span>
              <span className="flex items-center gap-1.5">
                <Lock className="h-3 w-3" /> TLS + signed token
              </span>
            </div>
          </aside>

          {/* form panel */}
          <section className="px-6 py-9 sm:px-10 sm:py-11 xl:px-12">
            <div className="mx-auto w-full max-w-[26rem]">
              {/* mobile logo */}
              <div className="mb-7 flex flex-col items-center gap-2 lg:hidden">
                <Link
                  href="/"
                  className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-[#eaf7f1] shadow ring-1 ring-[#dcece5]"
                >
                  <Logo size="xs" eager />
                </Link>
                <span className="font-display text-[0.9rem] font-bold text-[#10231f]">
                  Language Hub
                </span>
              </div>

              <div className="text-center">
                <p className="inline-flex items-center gap-1.5 rounded-full bg-[#eef7f2] px-3.5 py-1.5 font-display text-[0.66rem] font-bold uppercase tracking-[0.2em] text-[#0d6a58]">
                  <Sparkles className="h-3 w-3" /> Admin only
                </p>
                <h1 className="mt-4 font-display text-[clamp(1.8rem,3.2vw,2.15rem)] font-extrabold leading-tight tracking-[-0.035em] text-[#10231f]">
                  Admin Sign In
                </h1>
                <p className="mt-2 font-sans text-[0.9rem] leading-relaxed text-[#5c706a]">
                  Use your administrator credentials. There is only one admin account.
                </p>
              </div>

              <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
                <Field
                  label="Admin email"
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="Enter admin email"
                  autoComplete="username"
                  icon={<Mail className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.8} />}
                  required
                />

                <Field
                  label="Password"
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={setPassword}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  icon={<KeyRound className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.8} />}
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="grid h-9 w-9 place-items-center rounded-lg text-[#7d948e] transition-colors hover:bg-[#f1f8f4] hover:text-[#10231f]"
                    >
                      {showPassword ? (
                        <EyeOff className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.8} />
                      ) : (
                        <Eye className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.8} />
                      )}
                    </button>
                  }
                  required
                />

                <Field
                  label="Access code"
                  id="admin-access-code"
                  type="password"
                  value={accessCode}
                  onChange={setAccessCode}
                  placeholder={accessCodeRequired ? "Required second factor" : "Second factor (if configured)"}
                  autoComplete="one-time-code"
                  icon={<ShieldCheck className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.8} />}
                  hint={
                    accessCodeRequired
                      ? "The access code is required for this deployment."
                      : "Only needed when an access code is configured."
                  }
                />

                {error ? (
                  <p
                    role="alert"
                    className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[0.82rem] font-medium text-rose-600"
                  >
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={busy}
                  className="group mt-1 inline-flex h-[3.35rem] items-center justify-center gap-2.5 rounded-xl bg-[#0d5c4d] font-display text-[0.92rem] font-bold text-white shadow-[0_18px_30px_-18px_rgba(13,92,77,0.9)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0a4e43] disabled:opacity-60"
                >
                  {busy ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Verifying…
                    </>
                  ) : (
                    <>
                      Enter Console
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 flex items-start gap-2 font-sans text-[0.72rem] leading-relaxed text-[#8ba19b]">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Eight attempts per 15 minutes. Failed attempts are logged with the client
                address.
              </p>
            </div>
          </section>
        </motion.div>
      </main>
    </div>
  );
}

/* ────────────────────────── decorative illustration ────────────────────── */

function ShieldIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 260" className={className} role="presentation">
      <defs>
        <linearGradient id="adminShield" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a8f0d8" />
          <stop offset="1" stopColor="#6fd6b6" />
        </linearGradient>
      </defs>

      <ellipse cx="160" cy="238" rx="120" ry="16" fill="#0a4e43" opacity=".55" />

      {/* glow */}
      <circle cx="160" cy="120" r="96" fill="#8fe0c6" opacity=".12" />

      {/* shield */}
      <path
        d="M160 32l74 28v66c0 52-34 88-74 104-40-16-74-52-74-104V60z"
        fill="url(#adminShield)"
      />
      <path
        d="M160 32l74 28v66c0 52-34 88-74 104z"
        fill="#0d6a58"
        opacity=".18"
      />
      <path
        d="M160 48l58 22v56c0 42-27 72-58 86-31-14-58-44-58-86V70z"
        fill="#0b4f45"
        opacity=".92"
      />

      {/* lock */}
      <rect x="136" y="118" width="48" height="40" rx="9" fill="#c6f0e0" />
      <path
        d="M146 118v-10a14 14 0 0 1 28 0v10"
        fill="none"
        stroke="#c6f0e0"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="160" cy="136" r="4.5" fill="#0b4f45" />
      <path d="M160 139v8" stroke="#0b4f45" strokeWidth="4" strokeLinecap="round" />

      {/* orbit accents */}
      <circle cx="66" cy="82" r="6" fill="#f26a4a" />
      <circle cx="256" cy="70" r="4.5" fill="#f5c542" />
      <circle cx="272" cy="150" r="3.5" fill="#8fe0c6" opacity=".9" />
      <path
        d="M38 150c22-42 62-66 106-72"
        fill="none"
        stroke="#8fe0c6"
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".55"
      />
      <path
        d="M236 196c14-18 20-38 20-58"
        fill="none"
        stroke="#8fe0c6"
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".4"
      />
    </svg>
  );
}
