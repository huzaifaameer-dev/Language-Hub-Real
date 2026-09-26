"use client";

import { useEffect, useState } from "react";
import { CalendarRange, Check, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
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
    chip: "bg-brand/80/15 text-brand-deep ring-brand/20",
    value: "text-ink",
    glow: "group-hover:shadow-[0_24px_52px_-18px_rgb(110_90_224/0.55)]",
  },
  amber: {
    chip: "bg-amber-500/15 text-amber-600 ring-amber-200",
    value: "text-ink",
    glow: "group-hover:shadow-[0_24px_52px_-18px_rgb(245_158_11/0.5)]",
  },
  emerald: {
    chip: "bg-emerald-500/15 text-emerald-600 ring-emerald-200",
    value: "text-ink",
    glow: "group-hover:shadow-[0_24px_52px_-18px_rgb(16_185_129/0.5)]",
  },
  fuchsia: {
    chip: "bg-brand-magenta/15 text-brand-magenta ring-brand-magenta/25",
    value: "text-ink",
    glow: "group-hover:shadow-[0_24px_52px_-18px_rgb(214_58_140/0.5)]",
  },
  sky: {
    chip: "bg-sky-500/15 text-sky-700 ring-sky-200",
    value: "text-ink",
    glow: "group-hover:shadow-[0_24px_52px_-18px_rgb(14_165_233/0.5)]",
  },
  violet: {
    chip: "bg-brand-deep/15 text-brand-deep ring-brand/20",
    value: "text-ink",
    glow: "group-hover:shadow-[0_24px_52px_-18px_rgb(81_63_196/0.5)]",
  },
  rose: {
    chip: "bg-rose-500/15 text-rose-600 ring-rose-200",
    value: "text-ink",
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
        "glass-dash group relative w-full overflow-hidden rounded-[1.5rem] px-5 py-5 text-start transition-all duration-300",
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
      <p className="relative mt-2.5 font-display text-[0.66rem] font-bold uppercase tracking-[0.22em] text-ink-2">
        {label}
      </p>
      {sub ? <p className="relative mt-0.5 font-mono text-[0.62rem] text-ink-3">{sub}</p> : null}
    </button>
  );
}

const STATUS_META: Record<string, { cls: string; dot: string; iconCls: string }> = {
  NEW: {
    cls: "border-amber-300 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
    iconCls: "text-amber-500",
  },
  CONTACTED: {
    cls: "border-sky-300 bg-sky-50 text-sky-700",
    dot: "bg-sky-500",
    iconCls: "text-sky-500",
  },
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
  AWAITING_PAYMENT: {
    cls: "border-sky-300 bg-sky-50 text-sky-700",
    dot: "bg-sky-500",
    iconCls: "text-sky-500",
  },
  PROOF_SUBMITTED: {
    cls: "border-violet-300 bg-violet-50 text-violet-700",
    dot: "bg-violet-500",
    iconCls: "text-violet-500",
  },
  ENROLLED: {
    cls: "border-brand/35 bg-brand/8 text-brand-deep",
    dot: "bg-brand-deep",
    iconCls: "text-brand-deep",
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
      "grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand/80 to-brand-deep font-display font-black text-white shadow-[0_8px_20px_-10px_rgb(110_90_224/0.8)]",
      className ?? "h-11 w-11 text-base"
    )}>
      {(name || "?").slice(0, 1).toUpperCase()}
    </span>
  );
}

export function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div>
      <p className="flex items-center gap-3 font-display text-[0.62rem] font-bold uppercase tracking-[0.4em] text-brand-deep">
        <span aria-hidden className="h-px w-7 bg-gradient-to-r from-brand/80 to-transparent" />
        {kicker}
      </p>
      <h2 className="mt-1.5 font-display text-[1.6rem] font-extrabold tracking-[-0.03em] text-ink sm:text-[1.85rem]">{title}</h2>
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
              ? "border-brand/80/60 bg-brand-deep text-white shadow-[0_10px_24px_-10px_rgb(110_90_224/0.8)]"
              : "border-ink/12 bg-white/70 text-ink-2 backdrop-blur-md hover:border-brand/45 hover:text-brand-deep"
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
          <p className="font-display text-[1.9rem] font-extrabold leading-none text-ink">
            <CountUp to={value} />
            <span className="text-base text-ink-3">%</span>
          </p>
          <p className="mt-1 font-display text-[0.55rem] font-bold uppercase tracking-[0.24em] text-ink-3">approval</p>
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
          <span aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-brand/10 blur-3xl" />
          <span aria-hidden className="pointer-events-none absolute -bottom-24 -left-16 h-44 w-44 rounded-full bg-brand-magenta/10 blur-3xl" />
        </>
      ) : null}
      <div className="relative">{children}</div>
    </section>
  );
}

export function SearchBox({
  value, onChange, placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full max-w-[22rem]">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" strokeWidth={2} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search…"}
        className="h-11 w-full rounded-xl border border-ink/12 bg-white/80 pl-10 pr-4 font-display text-[0.85rem] text-ink outline-none transition-all backdrop-blur-md placeholder:text-ink-3/80 focus:border-brand focus:ring-4 focus:ring-brand/80/15"
      />
    </div>
  );
}

export function Pager({
  page, pageSize, total, onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (n: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/60 px-4 py-3 backdrop-blur-xl">
      <p className="font-mono text-[0.64rem] font-bold uppercase tracking-widest text-ink-3">
        {start}–{end} of <span className="text-brand-deep">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="inline-flex items-center gap-1 rounded-full border border-ink/12 bg-white/80 px-3.5 py-2 font-display text-[0.7rem] font-bold text-ink-2 transition-all hover:border-brand/45 hover:text-brand-deep disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Prev
        </button>
        <span className="rounded-full border border-brand/20 bg-brand/8 px-3 py-1.5 font-mono text-[0.68rem] font-black text-brand-deep">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages || total === 0}
          onClick={() => onPage(page + 1)}
          className="inline-flex items-center gap-1 rounded-full border border-ink/12 bg-white/80 px-3.5 py-2 font-display text-[0.7rem] font-bold text-ink-2 transition-all hover:border-brand/45 hover:text-brand-deep disabled:opacity-40"
        >
          Next <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/** Download rows as a UTF-8 (BOM) CSV so Excel opens it correctly. */
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const body = [headers, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
  const blob = new Blob([`\uFEFF${body}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function DateFilter({
  from, to, onChange,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  // Reset feels natural in YYYY-MM-DD; inputs are <input type="date">.
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-ink/12 bg-white/70 px-3 py-2 backdrop-blur-md">
      <CalendarRange className="h-4 w-4 text-ink-3" />
      <input
        type="date"
        value={from}
        onChange={(e) => onChange(e.target.value, to)}
        aria-label="From date"
        className="rounded-lg border border-ink/12 bg-white px-2 py-1.5 font-mono text-[0.72rem] text-ink outline-none focus:border-brand"
      />
      <span className="font-mono text-[0.62rem] uppercase tracking-widest text-ink-3">to</span>
      <input
        type="date"
        value={to}
        onChange={(e) => onChange(from, e.target.value)}
        aria-label="To date"
        className="rounded-lg border border-ink/12 bg-white px-2 py-1.5 font-mono text-[0.72rem] text-ink outline-none focus:border-brand"
      />
      {(from || to) ? (
        <button
          type="button"
          onClick={() => onChange("", "")}
          className="grid h-7 w-7 place-items-center rounded-full text-ink-3 transition-colors hover:bg-ink/10 hover:text-ink"
          aria-label="Clear date filter"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

export interface BulkActionDef {
  label: string;
  action: string;
  tone: "brand" | "rose" | "emerald" | "amber";
  confirm?: string;
}

const BULK_TONE: Record<BulkActionDef["tone"], string> = {
  brand: "bg-brand-deep text-white hover:brightness-110 shadow-[0_12px_24px_-10px_rgb(110_90_224/0.7)]",
  emerald: "bg-emerald-600 text-white hover:brightness-110 shadow-[0_12px_24px_-10px_rgb(16_185_129/0.6)]",
  rose: "bg-rose-600 text-white hover:brightness-110 shadow-[0_12px_24px_-10px_rgb(244_63_94/0.6)]",
  amber: "bg-amber-500 text-white hover:brightness-110 shadow-[0_12px_24px_-10px_rgb(245_158_11/0.6)]",
};

export function BulkActionsBar({
  selectedCount,
  actions,
  busy,
  onAction,
  onClear,
}: {
  selectedCount: number;
  actions: BulkActionDef[];
  busy?: boolean;
  onAction: (action: string) => void;
  onClear: () => void;
}) {
  if (selectedCount === 0 && !busy) return null;

  return (
    <div className="sticky top-[4.6rem] z-20 flex flex-wrap items-center gap-3 rounded-2xl border border-brand/25 bg-white/90 px-4 py-3 shadow-[0_14px_34px_-16px_rgb(110_90_224/0.5)] backdrop-blur-xl">
      <span className="inline-flex items-center gap-2 rounded-full bg-brand/8 px-3 py-1.5 font-display text-[0.78rem] font-extrabold text-brand-deep">
        <Check className="h-3.5 w-3.5" /> {selectedCount} selected
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {actions.map((a) => (
          <button
            key={a.action}
            type="button"
            disabled={selectedCount === 0 || busy}
            onClick={() => {
              if (a.confirm && !window.confirm(a.confirm)) return;
              onAction(a.action);
            }}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full px-4 font-display text-[0.72rem] font-bold transition-all disabled:opacity-40",
              BULK_TONE[a.tone]
            )}
          >
            {a.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onClear}
        disabled={busy}
        className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full border border-ink/12 bg-white px-4 font-display text-[0.72rem] font-bold text-ink-2 transition-all hover:bg-ink hover:text-ivory disabled:opacity-40"
      >
        <X className="h-3.5 w-3.5" /> Clear
      </button>
    </div>
  );
}