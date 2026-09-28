"use client";

import { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import { Lock, Mail } from "lucide-react";

import { AuthShell, Field } from "@/components/auth/AuthShell";
import { cn } from "@/lib/utils";

/**
 * Dedicated, secure staff login for the /manage area (and the /management
 *  teacher portal — pass the redirect target through `target`).
 *
 * - Logs in through the separate STAFF cookie (never a public NextAuth
 *   session), so the public navbar stays clean — exactly like the admin panel.
 * - Generic password error ("Invalid email or password") on purpose: we never
 *   reveal whether an account exists.
 * - Redirects only after the staff cookie actually sticks.
 */
export function ManageLogin({ target = "/manage" }: { target?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Race-proof redirect: if the staff cookie is somehow already there, leave.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (document.cookie.includes("hub_staff_token")) redirect(target);
    }, 60);
    return () => window.clearTimeout(timer);
  }, [target]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/management/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (res.ok) {
        window.location.href = target;
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d?.message ?? "Invalid email or password. Staff accounts only.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      kicker="Staff Portal"
      title="Sign in to management"
      subtitle="Teacher & admin access — protected by the Language Hub auth system."
      footer={
        <div className="text-[0.82rem] text-slate-500">
          Students use{" "}
          <a href="/login" className="font-bold text-[#1647C7] underline-offset-2 hover:underline">
            the student login
          </a>
          .
        </div>
      }
    >
      <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-3.5">
        <Field
          label="Email"
          id="mg-login-email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="teacher@languagehub.pk"
          autoComplete="email"
          icon={<Mail className="h-4 w-4" />}
          required
        />
        <Field
          label="Password"
          id="mg-login-password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          autoComplete="current-password"
          icon={<Lock className="h-4 w-4" />}
          required
        />

        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[0.8rem] font-semibold text-rose-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy || !email.trim() || !password}
          className={cn(
            "mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1647C7] to-[#6D4AFF] font-display text-[0.95rem] font-extrabold text-white shadow-[0_18px_34px_-16px_rgb(99_102_241/0.8)] transition-all hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          {busy ? "Signing in…" : "Sign in to management"}
        </button>
      </form>
    </AuthShell>
  );
}
