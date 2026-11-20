"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { ArrowRight, Check, Eye, EyeOff, Lock, Mail, Smartphone, Ticket, User } from "lucide-react";

import { AuthShell, Field } from "@/components/auth/AuthShell";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { cn } from "@/lib/utils";
import { waitForSessionAndGo } from "@/lib/client-session";

type Mode = "signin" | "signup";

const PASSWORD_RULES = [
  { label: "8+ characters", test: (p: string) => p.length >= 8 },
  { label: "A letter", test: (p: string) => /[A-Za-z]/.test(p) },
  { label: "A number", test: (p: string) => /[0-9]/.test(p) },
  { label: "A special char", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

interface FieldErrors {
  name?: string[];
  email?: string[];
  phone?: string[];
  password?: string[];
}

/**
 * One surface, two forms. `/login` and `/signup` both render this component;
 * switching tabs swaps the panel with a slide and rewrites the address bar via
 * `history.replaceState`, so nothing reloads and no RSC navigation happens.
 */
export function AuthFlow({ initialMode }: { initialMode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>(initialMode);
  const refCode = (searchParams.get("ref") ?? "").trim().toUpperCase();

  const { status } = useSession();

  // Race-proof: once the session is confirmed against the database, leave this
  // page. A JWT that outlived its account is cleared instead of redirected.
  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;

    (async () => {
      let hasAccount = true;
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        const data = res.ok ? ((await res.json()) as { user?: unknown }) : null;
        hasAccount = Boolean(data?.user);
      } catch {
        // Network hiccup — optimistically continue to the dashboard.
      }
      if (cancelled) return;

      if (hasAccount) {
        router.replace("/dashboard");
        router.refresh();
      } else {
        await signOut({ redirect: false });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, router]);

  // Keep the URL honest without a navigation.
  useEffect(() => {
    const path = mode === "signin" ? "/login" : "/signup";
    if (typeof window === "undefined" || window.location.pathname === path) return;
    window.history.replaceState(window.history.state, "", `${path}${window.location.search}`);
  }, [mode]);

  const switchTo = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
  };

  return (
    <AuthShell
      mode={mode}
      onModeChange={switchTo}
      animateKey={mode}
      title={mode === "signin" ? "Welcome Back!" : "Create your account"}
      subtitle={
        mode === "signin"
          ? "Sign in to continue your learning journey."
          : "Start your learning journey with Language Hub today."
      }
      footer={
        mode === "signin" ? (
          <>
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => switchTo("signup")}
              className="inline-flex items-center gap-1 font-display font-bold text-[#0d6a58] transition-colors hover:text-[#0a4e43]"
            >
              Sign Up
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => switchTo("signin")}
              className="inline-flex items-center gap-1 font-display font-bold text-[#0d6a58] transition-colors hover:text-[#0a4e43]"
            >
              Sign In
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </>
        )
      }
    >
      {mode === "signin" ? <SignInForm /> : <SignUpForm refCode={refCode} />}
    </AuthShell>
  );
}

/* ─────────────────────────────── sign in ───────────────────────────────── */

function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        remember,
        redirect: false,
        callbackUrl: "/dashboard",
      });
      if (res?.error) {
        setError("Invalid email or password.");
      } else {
        const landed = await waitForSessionAndGo(router);
        if (!landed) setError("Session did not stick. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field
        label="Email"
        id="login-email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="Enter your email address"
        autoComplete="email"
        icon={<Mail className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.8} />}
        required
      />
      <Field
        label="Password"
        id="login-password"
        type={showPass ? "text" : "password"}
        value={password}
        onChange={setPassword}
        placeholder="Enter your password"
        autoComplete="current-password"
        icon={<Lock className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.8} />}
        trailing={
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            aria-label={showPass ? "Hide password" : "Show password"}
            className="grid h-9 w-9 place-items-center rounded-lg text-[#7d948e] transition-colors hover:bg-[#f1f8f4] hover:text-[#10231f]"
          >
            {showPass ? (
              <EyeOff className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.8} />
            ) : (
              <Eye className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.8} />
            )}
          </button>
        }
        required
      />

      <div className="flex items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-[#cfdfd8] accent-[#0d5c4d]"
          />
          <span className="font-sans text-[0.82rem] text-[#44615a]">Remember me</span>
        </label>
        <a
          href="/reset-password"
          className="font-sans text-[0.82rem] font-semibold text-[#0d6a58] transition-colors hover:text-[#0a4e43]"
        >
          Forgot password?
        </a>
      </div>

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
        className="group mt-1 inline-flex h-[3.5rem] items-center justify-center gap-2.5 rounded-xl bg-[#0d5c4d] font-display text-[0.92rem] font-bold text-white shadow-[0_18px_30px_-18px_rgba(13,92,77,0.9)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0a4e43] disabled:opacity-60"
      >
        {busy ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <>
            Sign In
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </>
        )}
      </button>

      <OAuthButtons callbackUrl="/dashboard" />
    </form>
  );
}

/* ─────────────────────────────── sign up ───────────────────────────────── */

function SignUpForm({ refCode }: { refCode: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<FieldErrors | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const checked =
    password.length > 0
      ? PASSWORD_RULES.map((rule) => ({ label: rule.label, ok: rule.test(password) }))
      : null;

  const submit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setFormError(null);
    setErrors(null);
    setBusy(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password, referralCode: refCode || undefined }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        setFormError(data.message ?? "Could not create your account.");
        return;
      }

      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/dashboard",
      });
      if (signInRes?.error) {
        router.push("/login?created=1");
      } else {
        const landed = await waitForSessionAndGo(router);
        if (!landed) router.push("/login?created=1");
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3.5">
      {refCode ? (
        <div className="flex items-center gap-3 rounded-xl border border-[#f0dca8] bg-[#fdf6e3] px-4 py-3">
          <Ticket className="h-5 w-5 shrink-0 text-[#a97a10]" />
          <div className="text-[0.82rem] text-[#10231f]">
            <p className="font-bold text-[#a97a10]">Referral discount applied</p>
            <p className="text-[#5c706a]">
              Code{" "}
              <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[0.76rem] font-bold text-[#0d6a58]">
                {refCode}
              </code>{" "}
              · 10% off on your course
            </p>
          </div>
        </div>
      ) : null}

      <Field
        label="Full Name"
        id="signup-name"
        value={name}
        onChange={setName}
        placeholder="Your name"
        autoComplete="name"
        icon={<User className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.8} />}
        error={errors?.name?.[0]}
        required
      />
      <Field
        label="Email"
        id="signup-email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
        autoComplete="email"
        icon={<Mail className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.8} />}
        error={errors?.email?.[0]}
        required
      />
      <Field
        label="WhatsApp / Phone number"
        id="signup-phone"
        type="tel"
        value={phone}
        onChange={setPhone}
        placeholder="0300 1234567 (optional)"
        autoComplete="tel"
        icon={<Smartphone className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.8} />}
        error={errors?.phone?.[0]}
      />

      <div>
        <Field
          label="Password"
          id="signup-password"
          type={showPass ? "text" : "password"}
          value={password}
          onChange={setPassword}
          placeholder="Create a strong password"
          autoComplete="new-password"
          icon={<Lock className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.8} />}
          trailing={
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              aria-label={showPass ? "Hide password" : "Show password"}
              className="grid h-9 w-9 place-items-center rounded-lg text-[#7d948e] transition-colors hover:bg-[#f1f8f4] hover:text-[#10231f]"
            >
              {showPass ? (
                <EyeOff className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.8} />
              ) : (
                <Eye className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.8} />
              )}
            </button>
          }
          error={errors?.password?.[0]}
          required
        />
        {checked ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {checked.map((rule) => (
              <span
                key={rule.label}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-sans text-[0.66rem] font-semibold transition-colors",
                  rule.ok ? "bg-[#e2f6ec] text-[#0d6a58]" : "bg-[#f2f6f4] text-[#8ba19b]"
                )}
              >
                {rule.ok ? <Check className="h-3 w-3" strokeWidth={3} /> : <span aria-hidden>·</span>}
                {rule.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {formError ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[0.82rem] font-medium text-rose-600">
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="group mt-1 inline-flex h-[3.5rem] items-center justify-center gap-2.5 rounded-xl bg-[#0d5c4d] font-display text-[0.92rem] font-bold text-white shadow-[0_18px_30px_-18px_rgba(13,92,77,0.9)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0a4e43] disabled:opacity-60"
      >
        {busy ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <>
            Create Account
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </>
        )}
      </button>

      <OAuthButtons callbackUrl="/dashboard" />
    </form>
  );
}
