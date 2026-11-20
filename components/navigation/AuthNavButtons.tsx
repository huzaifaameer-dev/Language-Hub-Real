"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { ArrowRight, LogOut, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The identity control in the public navbar. Signed-out visitors land on
 * `/login`. Signed-in learners/admins click straight through to `/dashboard`
 * — no dropdown, no menu, one confident tap.
 */
export function AuthNavButtons({ fullWidth = false }: { fullWidth?: boolean }) {
  const { data: session, status } = useSession();
  const [img, setImg] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;
    if (session.user.role === "ADMIN") return;
    let on = true;
    fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (on && d?.user?.image) setImg(d.user.image);
      })
      .catch(() => {});
    return () => {
      on = false;
    };
  }, [status, session?.user?.id, session?.user?.role]);

  if (status === "loading") {
    return (
      <span
        aria-hidden
        className={cn(
          "inline-flex animate-pulse rounded-2xl bg-[#0b3b34]/20",
          fullWidth ? "h-12 w-full" : "h-11 w-11"
        )}
      />
    );
  }

  /* ─── Signed out ─── */
  if (!session?.user) {
    if (fullWidth) {
      return (
        <Link
          href="/login"
          className="btn-teal group h-12 w-full text-[0.86rem]"
        >
          <UserRound className="h-4 w-4" strokeWidth={2.1} />
          Sign in to your account
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={2.2} />
        </Link>
      );
    }

    return (
      <Link
        href="/login"
        aria-label="Sign in to Language Hub"
        className="group relative grid h-11 w-11 place-items-center rounded-2xl bg-[linear-gradient(150deg,#0f6b5c_0%,#0a4e43_58%,#073b33_100%)] text-white shadow-[0_14px_28px_-14px_rgba(10,78,67,0.9)] ring-1 ring-white/15 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_36px_-14px_rgba(10,78,67,1)]"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-full w-2/3 -skew-x-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.26),transparent)] transition-transform duration-[900ms] ease-out group-hover:translate-x-[420%]"
        />
        <UserRound className="icon-hover-swing relative h-[1.15rem] w-[1.15rem]" strokeWidth={2.1} />
        <span
          aria-hidden
          className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#fb6a47]"
        />
      </Link>
    );
  }

  /* ─── Signed in ─── */
  const initial = (session.user.name ?? "U").slice(0, 1).toUpperCase();
  const image = img ?? (session.user.image as string | null) ?? null;

  return (
    <div className={cn("relative flex items-center gap-2", fullWidth && "w-full flex-col items-start")}>
      {/* Avatar → dashboard directly (no menu). */}
      <Link
        href="/dashboard"
        aria-label={`${session.user.name ?? "Account"} — open dashboard`}
        className={cn(
          "group relative flex shrink-0 items-center gap-2 overflow-hidden rounded-2xl bg-[linear-gradient(150deg,#0f6b5c_0%,#0a4e43_58%,#073b33_100%)] text-white shadow-[0_14px_28px_-14px_rgba(10,78,67,0.9)] ring-1 ring-white/15 transition-all duration-300 hover:-translate-y-0.5",
          fullWidth ? "h-12 w-full justify-start px-3" : "h-11 w-11 justify-center px-0"
        )}
      >
        <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-[0.65rem] bg-white/12 ring-1 ring-inset ring-white/20">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="font-display text-[0.8rem] font-extrabold">{initial}</span>
          )}
          <span aria-hidden className="absolute right-0 top-0 h-2 w-2 rounded-full bg-[#7ef0c9]" />
        </span>
        {fullWidth ? (
          <span className="min-w-0 flex-1 truncate text-left font-display text-[0.82rem] font-semibold">
            {session.user.name ?? "My account"}
          </span>
        ) : null}
      </Link>

      {/* Separate sign-out action — never hidden inside a dropdown. */}
      <button
        type="button"
        onClick={() => void signOut({ callbackUrl: "/" })}
        aria-label="Sign out of Language Hub"
        className={cn(
          "group shrink-0 items-center justify-center rounded-2xl border border-[rgba(255,255,255,0.25)] bg-white/10 p-1 text-white/85 transition-all duration-300 hover:bg-white/20 hover:text-white hover:border-white",
          fullWidth
            ? "flex h-12 w-full justify-start px-3 text-[0.82rem]"
            : "hidden h-11 w-11 p-0 lg:flex"
        )}
      >
        <LogOut className={cn("h-4 w-4", fullWidth && "mr-2")} strokeWidth={2.1} />
        {fullWidth && <span>Sign out</span>}
      </button>
    </div>
  );
}
