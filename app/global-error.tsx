"use client";

import { useEffect } from "react";

/**
 * Root-level error boundary. Catches errors thrown in the root layout itself
 * (which a nested `error.tsx` cannot). Must render its own <html>/<body> tags
 * because it replaces the whole document. Reports to /api/report then offers a
 * reload.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    try {
      void fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          level: "error",
          scope: "global",
          message: error.message?.slice(0, 2000) ?? "Root layout error",
          stack: error.stack?.slice(0, 8000) ?? null,
          tag: error.digest ?? null,
        }),
      }).catch(() => {});
    } catch {
      // ignore
    }
  }, [error]);

  return (
    <html lang="en">
      <body className="m-0 antialiased" style={{ background: "#f6f8fc", color: "#0f172a" }}>
        <main
          role="alert"
          className="grid min-h-[100dvh] place-items-center px-6"
          style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
        >
          <div className="w-full max-w-md rounded-[2rem] border border-rose-200 bg-white p-10 text-center shadow-2xl">
            <span
              aria-hidden
              className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-rose-100 text-3xl font-black text-rose-500"
            >
              !
            </span>
            <h1 className="mt-6 text-2xl font-extrabold tracking-tight">Something went wrong.</h1>
            <p className="mt-2 text-sm text-slate-500">
              We hit an unexpected error. Reload to continue — your data is safe.
            </p>
            {error.digest ? (
              <p className="mt-4 rounded-lg bg-slate-100 px-3 py-2 font-mono text-xs text-slate-400">
                ref {error.digest}
              </p>
            ) : null}
            <button
              autoFocus
              type="button"
              onClick={reset}
              className="mt-7 inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-8 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:brightness-110"
            >
              Reload
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
