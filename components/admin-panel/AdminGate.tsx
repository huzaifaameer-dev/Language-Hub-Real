"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Mail, KeyRound, ArrowLeft } from "lucide-react";

export function AdminGate() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shaking, setShaking] = useState(false);

  const deny = (msg: string) => {
    setError(msg);
    setShaking(true);
    setTimeout(() => setShaking(false), 600);
  };

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          accessCode: code.trim(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        deny(data.message ?? "ACCESS DENIED — INVALID CREDENTIALS");
      } else {
        router.push("/admin-panel");
        router.refresh();
      }
    } catch {
      deny("SECURE RELAY ERROR — TRY AGAIN");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#eef1f9] px-5 py-12 text-slate-900">
      {/* backdrop scenery */}
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 opacity-60" style={{ maskImage: "radial-gradient(ellipse at center, black 0%, transparent 70%)", WebkitMaskImage: "radial-gradient(ellipse at center, black 0%, transparent 70%)" }} />
      <div aria-hidden className="orb left-[8%] top-[12%] h-72 w-72 bg-indigo-500/30" />
      <div aria-hidden className="orb bottom-[10%] right-[6%] h-80 w-80 bg-violet-500/25" style={{ animationDelay: "-6s" }} />
      <div aria-hidden className="orb left-[38%] top-[58%] h-64 w-64 bg-fuchsia-400/20" style={{ animationDelay: "-11s" }} />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-indigo-500/10 to-transparent" />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="relative">
            <span aria-hidden className="absolute inset-0 animate-spin rounded-full border border-dashed border-indigo-400/60" style={{ animation: "spin-dash 9s linear infinite" }} />
            <span aria-hidden className="absolute -inset-2 rounded-full bg-indigo-500/15 blur-xl" />
            <div className="relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-[0_16px_40px_-14px_rgb(99_102_241/0.75)]">
              <ShieldCheck className="h-8 w-8 text-white" strokeWidth={1.8} />
            </div>
          </div>
          <p className="mt-2 font-mono text-[0.62rem] font-bold uppercase tracking-[0.5em] text-indigo-600">
            LH · Secure Relay
          </p>
          <h1 className="font-display text-[clamp(1.7rem,5vw,2.4rem)] font-extrabold leading-tight tracking-[-0.03em] text-slate-900">
            ADMIN <span className="indigo-text-shimmer">GATEWAY</span>
          </h1>
          <p className="font-display text-[0.9rem] font-medium text-slate-500">
            Authorized personnel only — cleared connection required.
          </p>
        </div>

        <div
          className={
            "glass-dash relative mt-7 overflow-hidden rounded-[1.75rem] p-7 pb-8 " +
            (shaking ? "animate-[shake_0.6s_ease]" : "")
          }
        >
          <span aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-violet-400/20 blur-3xl" />

          <div className="relative mb-5 flex items-center justify-between font-mono text-[0.58rem] font-bold uppercase tracking-[0.28em] text-slate-400">
            <span className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5" />
              Handshake
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              {busy ? "Auth…" : "Standby"}
            </span>
          </div>

          <div className="relative flex flex-col gap-4">
            <GateField id="ag-email" label="Admin Email" type="email" value={email} onChange={setEmail} placeholder="admin@languagehub" autoComplete="username" icon={<Mail className="h-4 w-4" />} />
            <GateField id="ag-pass" label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••••" autoComplete="current-password" onEnter={submit} icon={<Lock className="h-4 w-4" />} />
            <GateField id="ag-code" label="Access Code" type="password" value={code} onChange={setCode} placeholder="2nd-factor key" autoComplete="off" onEnter={submit} icon={<KeyRound className="h-4 w-4" />} />
          </div>

          {error ? (
            <p className="relative mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 font-mono text-[0.72rem] font-bold tracking-widest text-rose-600">
              ! {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="group relative mt-6 inline-flex h-[3.25rem] w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 font-display text-[0.85rem] font-extrabold uppercase tracking-[0.2em] text-white shadow-[0_18px_44px_-16px_rgb(99_102_241/0.75)] transition-all duration-300 hover:shadow-[0_22px_54px_-16px_rgb(124_58_237/0.85)] disabled:opacity-50"
          >
            <span aria-hidden className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            {busy ? (
              <span className="relative flex items-center gap-2">
                Verifying
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-white"
                      style={{ animation: `dot-blink 1.1s ease-in-out ${i * 0.15}s infinite` }}
                    />
                  ))}
                </span>
              </span>
            ) : (
              <span className="relative inline-flex items-center gap-3">
                <Lock className="h-4 w-4" strokeWidth={2} />
                Unlock Panel
              </span>
            )}
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 font-mono text-[0.55rem] font-bold uppercase tracking-[0.22em] text-slate-400">
          <Chip>E2EE</Chip>
          <Chip>Rate-limited</Chip>
          <Chip>5-try lockout</Chip>
          <Chip>Audit log</Chip>
        </div>

        <p className="mt-4 text-center font-display text-[0.75rem] font-semibold text-slate-500">
          Lost access? Contact the super admin.{" "}
          <Link href="/" className="inline-flex items-center gap-1 text-indigo-600 underline-offset-4 hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to site
          </Link>
        </p>
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-white/60 bg-white/50 px-2.5 py-1 backdrop-blur-sm">{children}</span>;
}

function GateField({
  id, label, value, onChange, placeholder, type = "text", autoComplete, onEnter, icon,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
  onEnter?: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-display text-[0.62rem] font-bold uppercase tracking-[0.28em] text-slate-500">
        {label}
      </label>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
        ) : null}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && onEnter) onEnter();
          }}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={cnInput(icon)}
        />
      </div>
    </div>
  );
}

function cnInput(hasIcon?: React.ReactNode) {
  const base =
    "w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 font-mono text-[0.9rem] text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-400/70 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15 backdrop-blur-md";
  return hasIcon ? `pl-11 ${base}` : base;
}