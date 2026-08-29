"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function CountUp({ to, duration = 800 }: { to: number; duration?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return <>{v}</>;
}

const STAT_ACCENTS: Record<string, { chip: string; value: string; glow: string }> = {
  indigo: {
    chip: "bg-indigo-500/15 text-indigo-600 ring-indigo-200",
    value: "text-slate-900",
    glow: "group-hover:shadow-[0_24px_52px_-18px_rgb(99_102_241/0.55)]",
  },
  amber: {
    chip: "bg-amber-500/15 text-amber-600 ring-amber-200",
    value: "text-slate-900",
    glow: "group-hover:shadow-[0_24px_52px_-18px_rgb(245_158_11/0.5)]",
  },
  emerald: {
    chip: "bg-emerald-500/15 text-emerald-600 ring-emerald-200",
    value: "text-slate-900",
    glow: "group-hover:shadow-[0_24px_52px_-18px_rgb(16_185_129/0.5)]",
  },
  fuchsia: {
    chip: "bg-fuchsia-500/15 text-fuchsia-600 ring-fuchsia-200",
    value: "text-slate-900",
    glow: "group-hover:shadow-[0_24px_52px_-18px_rgb(217_70_239/0.5)]",
  },
  violet: {
    chip: "bg-violet-500/15 text-violet-600 ring-violet-200",
    value: "text-slate-900",
    glow: "group-hover:shadow-[0_24px_52px_-18px_rgb(139_92_246/0.5)]",
  },
  rose: {
    chip: "bg-rose-500/15 text-rose-600 ring-rose-200",
    value: "text-slate-900",
    glow: "group-hover:shadow-[0_24px_52px_-18px_rgb(244_63_94/0.5)]",
  },
};

export function AdminStatCard({
  label,
  value,
  accent = "indigo",
  onClick,
  sub,
  icon,
}: {
  label: string;
  value: number;
  accent?: keyof typeof STAT_ACCENTS;
  onClick?: () => void;
  sub?: string;
  icon?: React.ReactNode;
}) {
  const a = STAT_ACCENTS[accent];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "glass-dash group relative w-full overflow-hidden rounded-[1.5rem] px-5 py-5 text-left transition-all duration-300",
        onClick ? "cursor-pointer hover:-translate-y-1" : "cursor-default",
        a.glow
      )}
    >
      <span aria-hidden className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-white/50 blur-2xl" />
      <div className="relative flex items-start justify-between gap-2">
        <p className={cn("font-display text-[2rem] font-extrabold leading-none tracking-tight", a.value)}>
          <CountUp to={value} />
        </p>
        {icon ? (
          <span className={cn("grid h-10 w-10 place-items-center rounded-xl ring-1", a.chip)}>{icon}</span>
        ) : null}
      </div>
      <p className="relative mt-2.5 font-display text-[0.66rem] font-bold uppercase tracking-[0.22em] text-slate-500">
        {label}
      </p>
      {sub ? <p className="relative mt-0.5 font-mono text-[0.62rem] text-slate-400">{sub}</p> : null}
    </button>
  );
}

const STATUS_META: Record<string, { cls: string; dot: string; iconCls: string }> = {
  PENDING: {
    cls: "border-amber-300 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
    iconCls: "text-amber-500",
  },
  APPROVED: {
    cls: "border-emerald-300 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
    iconCls: "text-emerald-500",
  },
  ENROLLED: {
    cls: "border-violet-300 bg-violet-50 text-violet-700",
    dot: "bg-violet-500",
    iconCls: "text-violet-500",
  },
  REJECTED: {
    cls: "border-rose-300 bg-rose-50 text-rose-600",
    dot: "bg-rose-500",
    iconCls: "text-rose-500",
  },
};

export function StatusPill({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.PENDING;
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[0.6rem] font-bold tracking-widest", m.cls)}>
      <span className={cn("h-1.5 w-1.5 animate-pulse rounded-full", m.dot)} />
      {status}
    </span>
  );
}

export function AvatarInitial({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn(
      "grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 font-display font-black text-white shadow-[0_8px_20px_-10px_rgb(99_102_241/0.8)]",
      className ?? "h-11 w-11 text-base"
    )}>
      {(name || "?").slice(0, 1).toUpperCase()}
    </span>
  );
}

export function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div>
      <p className="flex items-center gap-3 font-display text-[0.62rem] font-bold uppercase tracking-[0.4em] text-indigo-600">
        <span aria-hidden className="h-px w-7 bg-gradient-to-r from-indigo-500 to-transparent" />
        {kicker}
      </p>
      <h2 className="mt-1.5 font-display text-[1.6rem] font-extrabold tracking-[-0.03em] text-slate-900 sm:text-[1.85rem]">{title}</h2>
    </div>
  );
}

export function FilterChips<T extends string>({
  options, value, onChange,
}: {
  options: { key: T; label: string; count: number }[];
  value: T;
  onChange: (k: T) => void;
}) {
  return (
    <div className="no-scrollbar flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={cn(
            "rounded-full border px-3.5 py-1.5 font-mono text-[0.68rem] font-bold tracking-widest transition-all duration-200",
            value === o.key
              ? "border-indigo-500/60 bg-indigo-600 text-white shadow-[0_10px_24px_-10px_rgb(99_102_241/0.8)]"
              : "border-slate-200 bg-white/70 text-slate-500 backdrop-blur-md hover:border-indigo-300 hover:text-indigo-700"
          )}
        >
          {o.label} <span className={cn("opacity-70", value === o.key && "font-black")}>{o.count}</span>
        </button>
      ))}
    </div>
  );
}

export function ProgressRing({
  value, size = 150, stroke = 10,
}: {
  value: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, value)) / 100) * c;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(148 163 184 / 0.18)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${Math.max(0, dash - 4)} ${c - Math.max(0, dash - 4)}`}
          style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.22,1,0.36,1)" }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="55%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="font-display text-[1.9rem] font-extrabold leading-none text-slate-900">
            <CountUp to={value} />
            <span className="text-base text-slate-400">%</span>
          </p>
          <p className="mt-1 font-display text-[0.55rem] font-bold uppercase tracking-[0.24em] text-slate-400">approval</p>
        </div>
      </div>
    </div>
  );
}

export function GlassPanel({
  children, className, blob = true,
}: {
  children: React.ReactNode;
  className?: string;
  blob?: boolean;
}) {
  return (
    <section className={cn("glass-dash relative overflow-hidden rounded-[1.75rem] p-6 sm:p-7", className)}>
      {blob ? (
        <>
          <span aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-indigo-400/15 blur-3xl" />
          <span aria-hidden className="pointer-events-none absolute -bottom-24 -left-16 h-44 w-44 rounded-full bg-fuchsia-400/10 blur-3xl" />
        </>
      ) : null}
      <div className="relative">{children}</div>
    </section>
  );
}