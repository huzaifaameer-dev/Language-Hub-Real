"use client";

import { useEffect, useRef, type ReactNode } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Closes a modal/menu when Escape is pressed while it is open. */
export function useEscapeKey(onClose: () => void, active: boolean) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active]);
}

/**
 * Keeps keyboard focus inside a modal while it is open and returns focus to
 * the previously-focused element (the opener) when it closes. The wrapper
 * itself receives a focusable placeholder so Tab from the last element wraps.
 */
export function FocusTrap({
  active,
  children,
  className,
}: {
  active: boolean;
  children: ReactNode;
  className?: string;
}) {
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
    <div ref={ref} tabIndex={-1} style={{ outline: "none" }} data-focus-trap className={className}>
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