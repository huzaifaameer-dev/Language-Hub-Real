"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Check, Eye, EyeOff, Lock, Mail, Smartphone, Ticket, User } from "lucide-react";

import { AuthShell, Field } from "@/components/auth/AuthShell";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { cn } from "@/lib/utils";
import { waitForSessionAndGo } from "@/lib/client-session";

interface FieldErrors {
  name?: string[];
  email?: string[];
  phone?: string[];
  password?: string[];
}

const PASSWORD_RULES = [
  { label: "8+ characters", test: (p: string) => p.length >= 8 },
  { label: "A letter", test: (p: string) => /[A-Za-z]/.test(p) },
  { label: "A number", test: (p: string) => /[0-9]/.test(p) },
  { label: "A special char", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function SignupPage() {
  return (
    <Suspense fallback={<div aria-hidden className="min-h-screen" />}>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = (searchParams.get("ref") ?? "").trim().toUpperCase();
  const { status } = useSession();

  // Auto-login is async; navigate the instant the session is confirmed so a
  // cookie race can never strand the user on the signup page.
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
      router.refresh();
    }
  }, [status, router]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<FieldErrors | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const checked = password.length > 0
    ? PASSWORD_RULES.reduce<{ label: string; ok: boolean }[]>((acc, r) => {
        acc.push({ label: r.label, ok: r.test(password) });
        return acc;
      }, [])
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
        // Account created — just take them to login.
        router.push("/login?created=1");
      } else {
        // Wait for the server to confirm the session, then land on dashboard.
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
    <AuthShell
      kicker="Join the Hub"
      title={
        <>
          Create your <span className="bg-gradient-to-r from-brand-deep to-brand-magenta bg-clip-text text-transparent">voice.</span>
        </>
      }
      subtitle="A free account lets you apply to a course and track your application live."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-brand-deep underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        {refCode ? (
          <div className="flex items-center gap-3 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3">
            <Ticket className="h-5 w-5 shrink-0 text-gold-deep" />
            <div className="text-[0.85rem] text-ink">
              <p className="font-bold text-gold-deep">Referral discount applied</p>
              <p className="text-ink-2">Code <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[0.78rem] font-bold text-brand-deep">{refCode}</code> · 10% off on your course</p>
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
          icon={<User className="h-4.5 w-4.5" strokeWidth={1.8} />}
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
          icon={<Mail className="h-4.5 w-4.5" strokeWidth={1.8} />}
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
          icon={<Smartphone className="h-4.5 w-4.5" strokeWidth={1.8} />}
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
            icon={<Lock className="h-4.5 w-4.5" strokeWidth={1.8} />}
            trailing={
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? "Hide password" : "Show password"}
                className="grid h-9 w-9 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-cream hover:text-ink"
              >
                {showPass ? <EyeOff className="h-4.5 w-4.5" strokeWidth={1.8} /> : <Eye className="h-4.5 w-4.5" strokeWidth={1.8} />}
              </button>
            }
            error={errors?.password?.[0]}
            required
          />
          {checked ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {checked.map((r) => (
                <span
                  key={r.label}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[0.62rem] font-bold transition-colors",
                    r.ok
                      ? "bg-emerald-500/12 text-emerald-600"
                      : "bg-cream text-ink-3"
                  )}
                >
                  {r.ok ? <Check className="h-3 w-3" strokeWidth={3} /> : <span aria-hidden>·</span>}
                  {r.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {formError ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[0.85rem] font-medium text-rose-600">
            {formError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="group mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-deep to-brand-deep font-display text-[0.95rem] font-bold text-white shadow-[0_14px_30px_-12px_rgb(99_102_241/0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-12px_rgb(99_102_241/0.6)] hover:brightness-[1.05] disabled:opacity-60"
        >
          {busy ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <>
              Create Account
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
            </>
          )}
        </button>
      </form>

      <OAuthButtons callbackUrl="/dashboard" />
    </AuthShell>
  );
}