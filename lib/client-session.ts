"use client";

import { getSession } from "next-auth/react";

interface NavRouter {
  replace: (href: string) => void;
  refresh: () => void;
}

/**
 * Race-proof sign-in landing. Client-side `signIn(redirect:false)` sets the
 * cookie, but the middleware/session may not "see" it for a beat — navigating
 * immediately can bounce off /dashboard guarded routes. This polls the live
 * `/api/auth/session` endpoint and navigates only when the server confirms the
 * session. Returns false if the session never materialises.
 */
export async function waitForSessionAndGo(
  router: NavRouter,
  tries = 8,
  delayMs = 350
): Promise<boolean> {
  for (let i = 0; i < tries; i += 1) {
    try {
      const session = await getSession();
      if (session?.user) {
        router.replace("/dashboard");
        router.refresh();
        return true;
      }
    } catch {
      // keep polling
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}