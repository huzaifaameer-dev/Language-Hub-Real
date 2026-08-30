"use client";

import { useEffect } from "react";

/**
 * Registers the service worker in production only — dev must stay cache-free
 * so HMR/edits are never served stale. The SW is served from `/sw.js` with
 * scope `/`, so it only ever runs after a page load in an installed PWA.
 */
export function PwaInit({ enabled }: { enabled?: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    if (!("serviceWorker" in navigator)) return;
    let cancelled = false;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch(() => {})
      .finally(() => {
        if (cancelled) return;
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return null;
}