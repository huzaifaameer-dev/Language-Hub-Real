"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

export function AuthNavButtons({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { data: session, status } = useSession();
  const [img, setImg] = useState<string | null>(null);

  const dark = variant === "dark";

  // The JWT snapshots the photo at sign-in; pull the freshest stored photo
  // from the API so the nav always matches the profile page.
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
          "flex h-10 w-16 animate-pulse items-center justify-center rounded-full border",
          dark ? "border-ivory/20 bg-ivory/10" : "border-ink/10 bg-ivory/60"
        )}
      />
    );
  }

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className={cn(
          "group inline-flex h-10 items-center gap-2 rounded-full border px-4 font-display text-[0.72rem] font-bold uppercase tracking-[0.16em] backdrop-blur-md transition-all duration-300",
          dark
            ? "border-gold/40 bg-gold/10 text-gold-light hover:-translate-y-0.5 hover:bg-gold/20"
            : "border-ink/15 bg-ivory/70 text-ink hover:-translate-y-0.5 hover:border-brand/60 hover:text-brand-deep",
          variant === "dark" ? "focus-visible:outline-gold" : "focus-visible:outline-brand/80"
        )}
      >
        Sign in
        <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
      </Link>
    );
  }

  const isAdmin = session.user.role === "ADMIN";
  const href = isAdmin ? "/admin-panel" : "/dashboard";
  const initial = (session.user.name ?? "U").slice(0, 1).toUpperCase();
  const label = isAdmin ? "Admin" : session.user.name;
  const image = img ?? (session.user.image as string | null) ?? null;

  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex h-11 items-center gap-2.5 rounded-full border py-1 pl-1 pr-4 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5",
        dark
          ? "border-gold/40 bg-gold/10 hover:bg-gold/20 focus-visible:outline-gold"
          : "border-ink/15 bg-ivory/70 hover:border-brand/60 focus-visible:outline-brand/80"
      )}
    >
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full",
          image
            ? "bg-white"
            : dark
              ? "bg-gradient-to-br from-gold-light to-gold-deep"
              : "bg-gradient-to-br from-brand/80 to-brand-deep"
        )}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={`${label} profile`} className="h-full w-full object-cover" />
        ) : (
          <span className="font-display text-[0.8rem] font-black text-white">{initial}</span>
        )}
      </span>
      <span
        className={cn(
          "hidden max-w-[9rem] truncate font-display text-[0.72rem] font-bold uppercase tracking-[0.12em] sm:block",
          dark ? "text-gold-light" : "text-slate-800"
        )}
      >
        {label}
      </span>
    </Link>
  );
}