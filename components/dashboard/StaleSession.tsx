"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

/**
 * Rendered when the NextAuth session is valid but the account no longer
 * exists in the DB (leftover cookie from a deleted/cleaned account).
 * Automatically signs the browser out so the public site stops treating
 * the stale identity as logged in.
 */
export function StaleSession() {
  useEffect(() => {
    signOut({ callbackUrl: "/login" });
  }, []);

  return (
    <div className="grid min-h-screen place-items-center bg-[#f4f6fb] px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-12 w-12 animate-pulse rounded-2xl bg-gradient-to-br from-brand/80 to-brand-deep shadow-[0_10px_24px_-8px_rgb(110_90_224/0.6)]" />
        <div>
          <p className="font-display text-[0.9rem] font-extrabold tracking-[-0.01em] text-ink">
            Session expired
          </p>
          <p className="mt-1.5 max-w-[16rem] text-sm leading-relaxed text-ink-2">
            Your account could not be found. Signing you out…
          </p>
        </div>
      </div>
    </div>
  );
}