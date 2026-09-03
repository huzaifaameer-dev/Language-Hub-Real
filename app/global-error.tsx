"use client";

import { useEffect } from "react";

export default function GlobalError({
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
          scope: "root",
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
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#faf8f4",
          color: "#1d2433",
          fontFamily:
            "Manrope, Inter, system-ui, -apple-system, sans-serif",
          padding: "0 24px",
        }}
      >
        <main
          role="alert"
          style={{
            maxWidth: 420,
            width: "100%",
            background: "rgba(255,255,255,0.9)",
            border: "1px solid #fecdd3",
            borderRadius: 32,
            padding: 40,
            textAlign: "center",
            boxShadow: "0 24px 60px -30px rgba(99,102,241,0.45)",
            backdropFilter: "blur(14px)",
          }}
        >
          <span
            aria-hidden
            style={{
              display: "grid",
              width: 64,
              height: 64,
              margin: "0 auto",
              placeItems: "center",
              background: "#ffe4e6",
              borderRadius: 16,
              color: "#f43f5e",
              fontWeight: 900,
              fontSize: 28,
            }}
          >
            !
          </span>
          <h1
            style={{
              margin: "24px 0 8px",
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            Something went wrong.
          </h1>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "#64748b" }}>
            The app hit an unexpected error. Please reload to continue.
          </p>
          <button
            autoFocus
            type="button"
            onClick={retry}
            style={{
              marginTop: 28,
              height: 48,
              padding: "0 32px",
              border: 0,
              borderRadius: 999,
              background: "linear-gradient(90deg,#4f46e5,#6366f1)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
              boxShadow: "0 14px 30px -12px rgba(79,70,229,0.75)",
              outline: "none",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}