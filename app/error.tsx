"use client";

import { useEffect } from "react";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    try {
      void fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          level: "error",
          scope: "route",
          message: error.message?.slice(0, 2000) ?? "Route segment error",
          stack: error.stack?.slice(0, 8000) ?? null,
          tag: error.digest ?? null,
        }),
      }).catch(() => {});
    } catch {
      // ignore
    }
  }, [error]);

  return (
    <main
      role="alert"
      className="grid min-h-[70vh] place-items-center bg-ivory px-6 py-24"
    >
      <div className="w-full max-w-md rounded-[2rem] border border-rose-200/80 bg-white/80 p-10 text-center shadow-2xl backdrop-blur-xl">
        <span
          aria-hidden
          className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-rose-100 text-3xl font-black text-rose-500"
        >
          !
        </span>
        <h1 className="mt-6 font-display text-2xl font-extrabold tracking-[-0.02em] text-ink">
          Something went wrong.
        </h1>
        <p className="mt-2 text-[0.92rem] leading-relaxed text-slate-500">
          The page hit an unexpected error. Try again — your data is safe.
        </p>
        {error.digest ? (
          <p className="mt-4 rounded-lg bg-slate-100 px-3 py-2 font-mono text-[0.6rem] text-slate-400">
            ref {error.digest}
          </p>
        ) : null}
        <button
          autoFocus
          type="button"
          onClick={retry}
          className="mt-7 inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-8 font-display text-[0.9rem] font-bold text-white shadow-[0_14px_30px_-12px_rgb(99_102_241/0.75)] transition-all hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/40"
        >
          Try again
        </button>
      </div>
    </main>
  );
}