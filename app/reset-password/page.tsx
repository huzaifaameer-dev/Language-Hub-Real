"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { KeyRound, Mail, ArrowLeft } from "lucide-react";

import { AuthShell, Field } from "@/components/auth/AuthShell";

const PASSWORD_RULES = "At least 8 characters, with a letter, a number, and a special character.";

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [mode, setMode] = useState(token ? "set" : "request");
  const [message, setMessage] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const requestLink = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setDevLink(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message ?? "Something went wrong. Please try again.");
      } else {
        setMode("sent");
        setMessage(
          data.smtpConfigured
            ? "If an account exists for that email, a reset link is on its way."
            : "If an account exists for that email, a reset link would be sent."
        );
        if (data.devLink) setDevLink(data.devLink);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const setNewPassword = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setDevLink(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message ?? "Something went wrong. Please try again.");
      } else {
        setMode("done");
        setMessage("Your password has been updated. You can now sign in.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (mode === "sent" || mode === "done") {
    return (
      <AuthShell
        kicker="Password reset"
        title={
          <>
            {mode === "done" ? "All set." : "Check your inbox."}
          </>
        }
        subtitle={
          mode === "done"
            ? "Your password has been updated."
            : "We'll wait here while you check your email."
        }
        footer={
          <Link href="/login" className="inline-flex items-center gap-1.5 font-bold text-indigo-600 underline-offset-4 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
        }
      >
        <div className="flex flex-col gap-4">
          {message ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[0.9rem] font-medium text-emerald-700">
              {message}
            </p>
          ) : null}

          {devLink ? (
            <div className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Dev link (SMTP not configured)
              </span>
              <span className="break-all font-mono text-[0.8rem] text-slate-600">{devLink}</span>
            </div>
          ) : null}

          {mode === "done" ? (
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 font-display text-[0.95rem] font-bold text-white shadow-[0_14px_30px_-12px_rgb(99_102_241/0.75)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-[1.05]"
            >
              Sign in
            </Link>
          ) : (
            <button
              type="button"
              onClick={requestLink}
              disabled={busy}
              className="group mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 font-display text-[0.95rem] font-bold text-white shadow-[0_14px_30px_-12px_rgb(99_102_241/0.75)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-[1.05] disabled:opacity-60"
            >
              Send again
            </button>
          )}

          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-indigo-600"
          >
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  const isRequest = mode === "request";

  return (
    <AuthShell
      kicker={isRequest ? "Password reset" : "Choose a new password"}
      title={
        <>
          {isRequest
            ? "Forgot your password?"
            : "Set a new password."}
        </>
      }
      subtitle={
        isRequest
          ? "Enter your account email and we'll send you a reset link."
          : "Pick a strong password you haven't used before."
      }
      footer={
        <Link href="/login" className="inline-flex items-center gap-1.5 font-bold text-indigo-600 underline-offset-4 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      }
    >
      <form onSubmit={isRequest ? requestLink : setNewPassword} className="flex flex-col gap-4">
        {isRequest ? (
          <Field
            label="Email"
            id="reset-email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            autoComplete="email"
            icon={<Mail className="h-4.5 w-4.5" strokeWidth={1.8} />}
            required
          />
        ) : (
          <>
            <Field
              label="New password"
              id="reset-password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Enter a new password"
              autoComplete="new-password"
              icon={<KeyRound className="h-4.5 w-4.5" strokeWidth={1.8} />}
              hint={PASSWORD_RULES}
              required
            />
            <Field
              label="Confirm password"
              id="reset-password-confirm"
              type="password"
              value={confirm}
              onChange={setConfirm}
              placeholder="Repeat the new password"
              autoComplete="new-password"
              hint={password && confirm && password !== confirm ? "Passwords do not match." : undefined}
              required
            />
          </>
        )}

        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[0.85rem] font-medium text-rose-600">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="group mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 font-display text-[0.95rem] font-bold text-white shadow-[0_14px_30px_-12px_rgb(99_102_241/0.75)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-12px_rgb(99_102_241/0.85)] hover:brightness-[1.05] disabled:opacity-60"
        >
          {busy ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : isRequest ? (
            "Send reset link"
          ) : (
            "Update password"
          )}
        </button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}