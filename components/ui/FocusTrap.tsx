"use client";

import { useEffect, useRef, type ReactNode } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keeps keyboard focus inside a modal while it is open and returns focus to
 * the previously-focused element (the opener) when it closes. The wrapper
 * itself receives a focusable placeholder so Tab from the last element wraps.
 */
export function FocusTrap({ active, children }: { active: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const previous = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    previous.current = document.activeElement as HTMLElement | null;

    const container = ref.current;
    if (!container) return;
    container.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !container.contains(document.activeElement)) return;

      const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement as HTMLElement | null;

      if (e.shiftKey && current === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previous.current?.focus?.();
    };
  }, [active]);

  return (
    <div ref={ref} tabIndex={-1} style={{ outline: "none" }} data-focus-trap>
      {children}
    </div>
  );
}

/** SR-visible live region for announcing modal/state changes to screen readers. */
export function LiveRegion({ text }: { text: string | null }) {
  return (
    <div role="status" aria-live="polite" aria-atomic className="sr-only">
      {text ?? ""}
    </div>
  );
}