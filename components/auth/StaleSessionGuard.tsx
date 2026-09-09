"use client";

import { useEffect } from "react";
import { signOut, useSession } from "next-auth/react";

/**
 * Global stale-session guard. When the browser holds a NextAuth JWT that no
 * longer maps to a real account (e.g. after a database reset), it signs the
 * session out automatically — from ANY page — so the navbar never shows a
 * ghost account and /login actually becomes reachable again.
 */
export function StaleSessionGuard() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;
    let on = true;
    fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d) => {
        if (on && !d?.user) {
          void signOut({ callbackUrl: window.location.pathname });
        }
      })
      .catch(() => {}); // network hiccup — leave the session as-is
    return () => {
      on = false;
    };
  }, [status, session?.user?.id]);

  return null;
}