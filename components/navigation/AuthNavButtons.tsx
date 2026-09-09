"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { LogOut, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function AuthNavButtons({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { data: session, status } = useSession();
  const [img, setImg] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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
  const hrefLabel = isAdmin ? "Open admin panel" : "Open dashboard";
  const initial = (session.user.name ?? "U").slice(0, 1).toUpperCase();
  const label = isAdmin ? "Admin" : session.user.name;
  const image = img ?? (session.user.image as string | null) ?? null;

  return (
    <div className="relative">
      {/* Click-away backdrop */}
      {menuOpen ? (
        <button
          type="button"
          aria-label="Close profile menu"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 cursor-default"
        />
      ) : null}

      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label={`${label} profile menu`}
        className={cn(
          "group inline-flex h-11 items-center gap-2.5 rounded-full border py-1 pl-1 pr-3.5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5",
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
        <ChevronDown
          className={cn(
            "hidden h-3.5 w-3.5 transition-transform duration-300 sm:block",
            menuOpen ? "rotate-180" : "",
            dark ? "text-gold-light/70" : "text-slate-400"
          )}
        />
      </button>

      {menuOpen ? (
        <div
          role="menu"
          className={cn(
            "absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border p-1.5 shadow-[0_24px_60px_-24px_rgb(15_23_42/0.45)] backdrop-blur-xl",
            dark ? "border-white/15 bg-[#0f172a]/95" : "border-ink/10 bg-white/95"
          )}
        >
          <div className="px-3 py-2">
            <p className={cn("truncate font-display text-[0.8rem] font-extrabold", dark ? "text-white" : "text-ink")}>
              {session.user.name ?? "Account"}
            </p>
            <p className={cn("truncate font-mono text-[0.6rem] text-ink-3")}>{session.user.email ?? ""}</p>
          </div>
          <div className={cn("mx-2 mb-1 h-px", dark ? "bg-white/10" : "bg-ink/[0.06]")} />
          <Link
            href={href}
            onClick={() => setMenuOpen(false)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2 font-display text-[0.76rem] font-bold transition-colors",
              dark ? "text-white/90 hover:bg-white/10" : "text-ink hover:bg-ink/[0.05]"
            )}
          >
            {hrefLabel} →
          </Link>
          <button
            type="button"
            onClick={() => void signOut({ callbackUrl: "/login" })}
            className={cn(
              "flex w-full items-center gap-2 rounded-xl px-3 py-2 font-display text-[0.76rem] font-bold transition-colors",
              dark
                ? "text-rose-300 hover:bg-rose-400/10"
                : "text-rose-600 hover:bg-rose-50"
            )}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}