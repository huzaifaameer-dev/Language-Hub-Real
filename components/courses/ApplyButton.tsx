"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

/**
 * Course application / enrollment CTA that routes correctly for the user's
 * auth state:
 *  - signed in  → the student dashboard (optionally pre-opening the wizard
 *    for the course via `?apply=<courseKey>`)
 *  - signed out → the signup page
 * Renders as a <button> so the destination can be decided at click time.
 */
export function ApplyButton({
  children,
  className,
  style,
  courseKey,
  hrefIfGuest = "/signup",
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Registration course key to pre-select on the dashboard. */
  courseKey?: string;
  /** Where guests go to start the account + registration flow. */
  hrefIfGuest?: string;
}) {
  const router = useRouter();
  const { status } = useSession();

  const go = () => {
    const destination =
      status === "authenticated"
        ? courseKey
          ? `/dashboard?apply=${encodeURIComponent(courseKey)}`
          : "/dashboard"
        : hrefIfGuest;
    router.push(destination);
  };

  return (
    <button type="button" onClick={go} className={className} style={style}>
      {children}
    </button>
  );
}