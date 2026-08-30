"use client";

import { useEffect } from "react";

const UMAMI_URL = process.env.NEXT_PUBLIC_UMAMI_URL?.trim();
const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim();
const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim();
const PLAUSIBLE_URL = (process.env.NEXT_PUBLIC_PLAUSIBLE_URL?.trim() || "https://plausible.io").replace(
  /\/+$/,
  ""
);

/**
 * Self-hosted analytics loader (umami or plausible), picked up at build time.
 * Renders nothing — and injects nothing — until the matching env vars exist:
 *  - Umami:     NEXT_PUBLIC_UMAMI_URL + NEXT_PUBLIC_UMAMI_WEBSITE_ID
 *  - Plausible: NEXT_PUBLIC_PLAUSIBLE_DOMAIN (+ optional NEXT_PUBLIC_PLAUSIBLE_URL)
 */
export function SiteAnalytics() {
  useEffect(() => {
    if (UMAMI_URL && UMAMI_WEBSITE_ID) {
      const script = document.createElement("script");
      script.defer = true;
      script.src = `${UMAMI_URL.replace(/\/+$/, "")}/script.js`;
      script.setAttribute("data-website-id", UMAMI_WEBSITE_ID);
      document.head.appendChild(script);
      return;
    }
    if (PLAUSIBLE_DOMAIN) {
      const script = document.createElement("script");
      script.defer = true;
      script.src = `${PLAUSIBLE_URL}/js/script.js`;
      script.setAttribute("data-domain", PLAUSIBLE_DOMAIN);
      document.head.appendChild(script);
    }
  }, []);

  return null;
}