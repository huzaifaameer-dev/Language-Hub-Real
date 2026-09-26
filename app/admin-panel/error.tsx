"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

/** Catches any server/DB error while streaming the admin panel — surfaces a
 *  clear retry instead of an infinite loading state. */
export default function AdminPanelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin-panel] failed to render:", error);
  }, [error]);

  return (
    <div className="grid min-h-screen place-items-center bg-[#f3f4fb] px-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-[0_30px_70px_-40px_rgb(15_23_42/0.4)]">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
          <AlertTriangle className="h-7 w-7" />
        </span>
        <h1 className="mt-5 font-display text-xl font-extrabold text-slate-900">
          Admin panel hiccup
        </h1>
        <p className="mt-2 text-[0.9rem] leading-relaxed text-slate-500">
          The database didn&apos;t respond in time. This usually clears up on a cold
          start — give it another go.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-7 font-display text-[0.85rem] font-bold text-white shadow-[0_14px_30px_-12px_rgb(99_102_241/0.7)] transition-all hover:-translate-y-0.5 hover:brightness-110"
        >
          Try again
        </button>
      </div>
    </div>
  );
}