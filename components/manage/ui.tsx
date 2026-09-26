"use client";

import { useCallback, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, Info, Loader2, Paperclip, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadCsv } from "@/components/admin-panel/ui";

/* ────────────────────────────── toasts ────────────────────────────── */

export type ToastTone = "ok" | "err" | "info";
export interface ToastMsg {
  id: number;
  text: string;
  tone: ToastTone;
}

export function useToasts() {
  const [items, setItems] = useState<ToastMsg[]>([]);
  const push = useCallback((text: string, tone: ToastTone = "ok") => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s.slice(-2), { id, text, tone }]);
    window.setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 4200);
  }, []);
  const dismiss = useCallback((id: number) => setItems((s) => s.filter((t) => t.id !== id)), []);
  return { items, push, dismiss };
}

export function Toasts({ items, onClose }: { items: ToastMsg[]; onClose: (id: number) => void }) {
  if (!items.length) return null;
  return (
    <div className="fixed bottom-5 right-5 z-[90] flex w-[min(94vw,26rem)] flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-[0.85rem] font-semibold shadow-xl backdrop-blur-xl",
            t.tone === "ok" && "border-emerald-300 bg-emerald-50/95 text-emerald-800",
            t.tone === "err" && "border-rose-300 bg-rose-50/95 text-rose-800",
            t.tone === "info" && "border-indigo-300 bg-white/95 text-indigo-900"
          )}
        >
          {t.tone === "ok" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          ) : t.tone === "err" ? (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          ) : (
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
          )}
          <p className="flex-1 leading-snug">{t.text}</p>
          <button type="button" aria-label="Dismiss" onClick={() => onClose(t.id)} className="grid h-6 w-6 place-items-center rounded-full hover:bg-black/5">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────── atoms ────────────────────────────── */

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin", className)} />;
}

export function MgButton({
  children,
  onClick,
  tone = "brand",
  disabled,
  className,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: "brand" | "ghost" | "rose" | "gold";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-45",
        tone === "brand" && "bg-gradient-to-r from-[#2563EB] to-[#6D4AFF] text-white shadow-[0_12px_26px_-12px_rgb(99_102_241/0.85)] hover:brightness-110",
        tone === "ghost" && "border border-slate-300 bg-white text-slate-600 hover:border-indigo-400 hover:text-[#1647C7]",
        tone === "rose" && "bg-rose-600 text-white hover:brightness-110",
        tone === "gold" && "bg-[#D4AF37] text-[#3a2d0b] hover:brightness-105",
        className
      )}
    >
      {children}
    </button>
  );
}

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[0.6rem] font-bold tracking-widest", className ?? "border-slate-200 bg-slate-50 text-slate-600")}>
      {children}
    </span>
  );
}

const STATUS_CLASSES: Record<string, string> = {
  DRAFT: "border-slate-300 bg-slate-100 text-slate-600",
  SCHEDULED: "border-sky-300 bg-sky-50 text-sky-700",
  PUBLISHED: "border-emerald-300 bg-emerald-50 text-emerald-700",
  OPEN: "border-violet-300 bg-violet-50 text-violet-700",
  CLOSED: "border-slate-300 bg-slate-100 text-slate-500",
  SENT: "border-emerald-300 bg-emerald-50 text-emerald-700",
  FAILED: "border-rose-300 bg-rose-50 text-rose-600",
  CANCELLED: "border-slate-300 bg-slate-100 text-slate-500",
  PROCESSING: "border-amber-300 bg-amber-50 text-amber-700",
  SUBMITTED: "border-emerald-300 bg-emerald-50 text-emerald-700",
  LATE: "border-amber-300 bg-amber-50 text-amber-700",
  REVIEWED: "border-violet-300 bg-violet-50 text-violet-700",
  RETURNED: "border-sky-300 bg-sky-50 text-sky-700",
  PRESENT: "border-emerald-300 bg-emerald-50 text-emerald-700",
  ABSENT: "border-rose-300 bg-rose-50 text-rose-600",
  EXCUSED: "border-slate-300 bg-slate-100 text-slate-500",
  ACTIVE: "border-emerald-300 bg-emerald-50 text-emerald-700",
  ARCHIVED: "border-slate-300 bg-slate-100 text-slate-500",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge className={STATUS_CLASSES[status] ?? "border-slate-200 bg-slate-50 text-slate-600"}>{status}</Badge>;
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/50 px-6 py-14 text-center">
      <p className="font-display text-[0.95rem] font-extrabold text-slate-500">{title}</p>
      {hint ? <p className="mt-1 max-w-xs text-[0.82rem] text-slate-400">{hint}</p> : null}
    </div>
  );
}

export function SkeletonRows({ rows = 4, cols = 3 }: { rows?: number; cols?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid gap-3 rounded-2xl border border-slate-100 bg-white/70 p-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className={cn("h-4 animate-pulse rounded-full bg-slate-100", c === 0 ? "w-2/3" : "w-full")} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className={cn("w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl", wide ? "max-w-3xl" : "max-w-lg")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="font-display text-[1.05rem] font-extrabold text-slate-900">{title}</h3>
          <button type="button" aria-label="Close" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative w-full max-w-[20rem]">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search…"}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-[0.85rem] outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
      />
    </div>
  );
}

export function CsvButton({ filename, headers, rows, label = "Export CSV" }: { filename: string; headers: string[]; rows: (string | number)[][]; label?: string }) {
  return (
    <MgButton tone="ghost" className="h-9 px-3.5 text-[0.75rem]" onClick={() => downloadCsv(filename, headers, rows)} disabled={rows.length === 0}>
      <Download className="h-3.5 w-3.5" /> {label}
    </MgButton>
  );
}

export interface PickedFile {
  name: string;
  mime: string;
  dataUri: string;
}

const MAX_FILE = 3 * 1024 * 1024;
const MAX_FILES = 3;

/** Client-side file picker → data-URI so the assignment/submission APIs can
 *  persist attachments server-side without any browser-side upload endpoint. */
export function FilePicker({ files, onChange, accept, label }: { files: PickedFile[]; onChange: (f: PickedFile[]) => void; accept?: string; label?: string }) {
  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []).slice(0, MAX_FILES - files.length);
    const read = (file: File) =>
      new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result ?? ""));
        r.onerror = () => rej(new Error("read"));
        r.readAsDataURL(file);
      });
    (async () => {
      const next = [...files];
      for (const file of list) {
        if (file.size > MAX_FILE) continue;
        try {
          const dataUri = await read(file);
          next.push({ name: file.name, mime: file.type || "application/octet-stream", dataUri });
        } catch {
          /* skip unreadable file */
        }
      }
      if (next.length !== files.length) onChange(next);
    })();
    e.target.value = "";
  };

  return (
    <div>
      <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3.5 text-[0.72rem] font-bold text-slate-600 transition-colors hover:border-indigo-400 hover:text-[#1647C7]">
        <Paperclip className="h-3.5 w-3.5" /> {label ?? "Attach files"}
        <input type="file" multiple accept={accept} onChange={pick} className="hidden" />
      </label>
      {files.length ? (
        <p className="mt-2 flex flex-wrap gap-1.5">
          {files.map((f, i) => (
            <span key={`${f.name}-${i}`} className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 font-mono text-[0.6rem] font-bold text-[#1647C7]">
              <Paperclip className="h-3 w-3" />
              {f.name.length > 22 ? `${f.name.slice(0, 20)}…` : f.name}
              <button type="button" aria-label="Remove file" onClick={() => onChange(files.filter((_, x) => x !== i))} className="grid h-4 w-4 place-items-center rounded-full hover:bg-indigo-100">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}

/* ────────────────────────────── format helpers ────────────────────────────── */

export function fmtWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function fmtDay(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}