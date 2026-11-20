"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Inbox, Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils";

/* ─────────────────────────────── data ──────────────────────────────────── */

export class ApiError extends Error {}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(payload?.message ?? `Request failed (${res.status})`);
  }
  return payload as T;
}

/** GET a JSON endpoint, re-running whenever `path` changes. */
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!path) return;
    let alive = true;
    api<T>(path)
      .then((next) => {
        if (!alive) return;
        setData(next);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Request failed.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [path, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { data, loading, error, reload, setData };
}

/* ─────────────────────────────── primitives ────────────────────────────── */

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl bg-white shadow-[0_16px_36px_-32px_rgba(13,71,60,0.5)] ring-1 ring-[#eef5f1]",
        className
      )}
    >
      {children}
    </section>
  );
}

export function SectionHead({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-3 pt-5">
      <div>
        <h2 className="font-display text-[1.05rem] font-bold text-[#10231f]">{title}</h2>
        {hint && <p className="mt-0.5 font-sans text-[0.76rem] text-[#8ba19b]">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

export function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "amber" | "red" | "brand" | "dark";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-[#f1f8f4] text-[#44615a]",
    green: "bg-[#e4f6ee] text-[#0d6a58]",
    amber: "bg-[#fff6dc] text-[#a97a10]",
    red: "bg-[#fdeee8] text-[#d0452b]",
    brand: "bg-[#e4f6ee] text-[#0d6a58]",
    dark: "bg-[#0b4f45] text-white",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 font-sans text-[0.64rem] font-semibold",
        tones[tone ?? "neutral"]
      )}
    >
      {children}
    </span>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 px-5 py-16 font-sans text-sm text-[#8ba19b]">
      <Loader2 className="h-4 w-4 animate-spin" /> {label}
    </div>
  );
}

export function Empty({
  title,
  hint,
  icon: Icon = Inbox,
}: {
  title: string;
  hint?: string;
  icon?: typeof Inbox;
}) {
  return (
    <div className="px-6 py-12 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#eaf8f1] text-[#0d6a58]">
        <Icon className="h-6 w-6" strokeWidth={1.9} />
      </span>
      <p className="mt-3 font-display text-[0.98rem] font-bold text-[#10231f]">{title}</p>
      {hint && <p className="mx-auto mt-1 max-w-sm font-sans text-[0.82rem] text-[#8ba19b]">{hint}</p>}
    </div>
  );
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 font-sans text-[0.84rem] font-medium text-rose-600">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      {children}
    </p>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "whitespace-nowrap px-4 py-2.5 text-left font-sans text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-[#9aada7]",
        className
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-middle font-sans text-[0.84rem] text-[#44615a]", className)}>{children}</td>;
}

export function Pager({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (page: number) => void;
}) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-t border-[#f2f7f4] px-5 py-3">
      <span className="font-sans text-[0.74rem] text-[#8ba19b]">
        Page {page} of {pages}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="rounded-full border border-[#e3ede9] px-4 py-1.5 font-sans text-[0.76rem] font-semibold text-[#44615a] transition hover:border-[#cfe3da] hover:text-[#0d6a58] disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="rounded-full border border-[#e3ede9] px-4 py-1.5 font-sans text-[0.76rem] font-semibold text-[#44615a] transition hover:border-[#cfe3da] hover:text-[#0d6a58] disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function FilterChips({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ key: string; label: string; count?: number }>;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-sans text-[0.74rem] font-semibold transition",
            value === opt.key
              ? "bg-[#0d5c4d] text-white"
              : "border border-[#e3ede9] bg-white text-[#44615a] hover:border-[#cfe3da] hover:text-[#0d6a58]"
          )}
        >
          {opt.label}
          {typeof opt.count === "number" && (
            <span
              className={cn(
                "rounded-full px-1.5 text-[0.62rem] font-bold",
                value === opt.key ? "bg-white/20" : "bg-[#f1f8f4] text-[#0d6a58]"
              )}
            >
              {opt.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Modal({
  open,
  title,
  onClose,
  children,
  wide,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-[#062e28]/45 p-4 backdrop-blur-sm sm:p-8">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative w-full rounded-3xl bg-white shadow-2xl ring-1 ring-[#eef5f1]",
          wide ? "max-w-3xl" : "max-w-lg"
        )}
      >
        <div className="flex items-center justify-between border-b border-[#f2f7f4] px-5 py-4">
          <h2 className="font-display text-[1rem] font-bold tracking-[-0.01em] text-[#10231f]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-[#8ba19b] transition hover:bg-[#f1f8f4] hover:text-[#10231f]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────── fields ────────────────────────────────── */

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-sans text-[0.7rem] font-semibold text-[#44615a]">
      {children}
    </span>
  );
}

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-[#e3ede9] bg-white px-3.5 py-2.5 font-sans text-[0.84rem] text-[#10231f] outline-none transition placeholder:text-[#9aada7] focus:border-[#0d6a58] focus:ring-4 focus:ring-[#0d6a58]/10 disabled:bg-[#f6fbf9] disabled:text-[#9aada7]";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(fieldClass, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(fieldClass, "min-h-24", props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(fieldClass, "pr-8", props.className)} />;
}

export function PrimaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full bg-[#0d5c4d] px-5 py-2.5 font-display text-[0.82rem] font-bold text-white shadow-[0_12px_22px_-18px_rgba(13,92,77,0.9)] transition hover:bg-[#0a4e43] disabled:opacity-60",
        className
      )}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full border border-[#e3ede9] px-3.5 py-1.5 font-sans text-[0.76rem] font-semibold text-[#44615a] transition hover:border-[#cfe3da] hover:text-[#0d6a58] disabled:opacity-50",
        className
      )}
    >
      {children}
    </button>
  );
}

/* ─────────────────────────────── helpers ───────────────────────────────── */

export const fmtDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

export const fmtDateTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

export const money = (n: number) => `PKR ${new Intl.NumberFormat("en-PK").format(n)}`;
