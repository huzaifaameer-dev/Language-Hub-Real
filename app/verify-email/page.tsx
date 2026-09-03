"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BadgeCheck, ShieldAlert, ArrowLeft } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";

function VerifyEmailForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [result, setResult] = useState<"done" | "error" | null>(null);
  const [error, setError] = useState<string | null>(
    token
      ? null
      : "This verification link is missing a token. Open the full link from your email."
  );

  const checking = result === null && !!token;

  useEffect(() => {
    if (!token || result !== null) return;
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok) setResult("done");
        else {
          setResult("error");
          setError(data.message ?? "Something went wrong. Please try again.");
        }
      } catch {
        if (!cancelled) {
          setResult("error");
          setError("Something went wrong. Please try again.");
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [token, result]);

  const state: "checking" | "done" | "error" = checking
    ? "checking"
    : result === "done"
      ? "done"
      : "error";

  return (
    <AuthShell
      kicker="Email verification"
      title={
        state === "done" ? (
          <>
            You&apos;re <span className="bg-gradient-to-r from-brand-deep to-brand-deep bg-clip-text text-transparent">verified.</span>
          </>
        ) : state === "checking" ? (
          "Verifying your email…"
        ) : (
          "Something's off."
        )
      }
      subtitle={
        state === "done"
          ? "Your email address is confirmed."
          : state === "checking"
            ? "Hang tight, this only takes a second."
            : "We couldn't verify your email."
      }
      footer={
        <Link href="/login" className="inline-flex items-center gap-1.5 font-bold text-brand-deep underline-offset-4 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      }
    >
      <div className="flex flex-col gap-4">
        {state === "checking" ? (
          <div className="grid h-12 place-items-center rounded-xl bg-slate-50">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand/20 border-t-brand-deep" />
          </div>
        ) : state === "done" ? (
          <>
            <div className="grid place-items-center rounded-xl border border-emerald-200 bg-emerald-50 py-4 text-emerald-600">
              <BadgeCheck className="h-9 w-9" strokeWidth={1.6} />
            </div>
            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-deep to-brand-deep font-display text-[0.95rem] font-bold text-white shadow-[0_14px_30px_-12px_rgb(99_102_241/0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-[1.05]"
            >
              Go to dashboard
            </Link>
          </>
        ) : (
          <>
            <div className="grid place-items-center rounded-xl border border-rose-200 bg-rose-50 py-4 text-rose-500">
              <ShieldAlert className="h-9 w-9" strokeWidth={1.6} />
            </div>
            {error ? (
              <p className="rounded-xl border border-ink/12 bg-white px-4 py-3 text-[0.88rem] font-medium text-ink-2">
                {error}
              </p>
            ) : null}
            <p className="text-center text-[0.8rem] text-ink-3">
              You can ignore this if you already verified — most flows never block on it.
            </p>
          </>
        )}
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}