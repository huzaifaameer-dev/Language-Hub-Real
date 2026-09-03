"use client";

/**
 * Shared UI primitives for the student dashboard. Kept tiny so they can be
 * imported by the larger dashboard sections (EnrollmentCard, Bookshelf, modals)
 * once those are split out.
 */

import { cn } from "@/lib/utils";

export function Field({
  label, id, value, onChange, placeholder, error, required, type = "text", icon,
}: {
  label: string; id: string; value: string; onChange: (v: string) => void; placeholder?: string; error?: string; required?: boolean; type?: string; icon?: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-display text-[0.66rem] font-bold uppercase tracking-[0.2em] text-ink-2">
        {label}
      </label>
      <div className="relative">
        {icon ? (
          <span aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3">
            {icon}
          </span>
        ) : null}
        <input
          id={id} name={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required}
          className={cn(
            "w-full rounded-xl border bg-white px-4 py-3 text-[0.95rem] text-ink shadow-[0_1px_2px_rgb(15_23_42/0.04)] outline-none transition-all duration-300 placeholder:text-ink-3",
            icon ? "pl-11" : undefined,
            error
              ? "border-rose-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10"
              : "border-ink/12 hover:border-slate-300 focus:border-brand/80 focus:ring-4 focus:ring-brand-deep/12"
          )}
        />
      </div>
      {error ? <p className="mt-1.5 text-[0.78rem] font-medium text-rose-600">{error}</p> : null}
    </div>
  );
}

export function Chip({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-white px-3 py-1 font-mono text-[0.68rem] text-ink-2">
      {icon}
      {children}
    </span>
  );
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[0.85rem] font-medium text-rose-600">
      {children}
    </p>
  );
}

/** Downscale an image client-side to a data URL (max dimension `max` px). */
export function resizeImage(file: File, max: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL(file.type === "image/png" ? "image/png" : "image/webp", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Bad image"));
    };
    img.src = url;
  });
}

export type EnrStatus = "PENDING" | "AWAITING_PAYMENT" | "PROOF_SUBMITTED" | "ENROLLED" | "REJECTED";

export interface Enr {
  id: string;
  subjects: string[];
  batch: string;
  plan?: string;
  paymentMethod?: string | null;
  paymentInstructions?: string | null;
  paymentProof?: string | null;
  status: EnrStatus;
  adminMessage?: string | null;
  createdAt: string;
}

export interface CourseInfoForModal {
  name: string;
  tagline: string;
  description: string;
  fee: number;
  currency: "PKR";
  duration: string;
  teacher: string;
  schedule: string;
  batches: { name: string; time: string; seatsTotal: number; seatsUsed?: number; seatsLeft?: number; full?: boolean }[];
  order: number;
  active: boolean;
}