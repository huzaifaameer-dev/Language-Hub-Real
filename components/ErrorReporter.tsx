"use client";

import { useEffect } from "react";

type ReportBody = {
  level: "error" | "warning";
  scope: string;
  message: string;
  stack?: string | null;
  url?: string | null;
  tag?: string | null;
};

let installed = false;
let recent = 0;
const seen = new Set<string>();

/**
 * Global client error capture. Window errors and unhandled rejections are
 * deduplicated (by message) and POSTed to /api/report with `keepalive` so
 * they survive navigation. Installed exactly once despite StrictMode remounts.
 */
export function ErrorReporter() {
  useEffect(() => {
    if (installed) return;
    installed = true;

    const push = (body: ReportBody) => {
      const key = `${body.message}::${body.url ?? ""}`;
      if (seen.has(key)) return;
      if (seen.size > 40) seen.clear();
      seen.add(key);

      // Coalesce bursts: at most one report per 2 seconds.
      const now = Date.now();
      if (now - recent < 2000) return;
      recent = now;

      try {
        void fetch("/api/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          body: JSON.stringify(body),
        }).catch(() => {});
      } catch {
        // ignore
      }
    };

    const onError = (event: ErrorEvent) => {
      const message = event.message || "Uncaught error";
      push({
        level: "error",
        scope: "window",
        message: message.slice(0, 2000),
        stack: event.error?.stack?.slice(0, 8000) ?? null,
        url: event.filename ? `${event.filename}:${event.lineno}` : null,
        tag: "global",
      });
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason ?? "Unhandled rejection");
      push({
        level: "error",
        scope: "promise",
        message: message.slice(0, 2000),
        stack: reason instanceof Error ? reason.stack?.slice(0, 8000) ?? null : null,
        tag: "global",
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      installed = false;
    };
  }, []);

  return null;
}