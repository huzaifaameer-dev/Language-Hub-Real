"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { ChevronDown, LogOut, User } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function AuthNavButtons({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { data: session, status } = useSession();
  const [img, setImg] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const dark = variant === "dark";

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
          "flex h-10 w-10 animate-pulse items-center justify-center rounded-full",
          dark ? "bg-ivory/10" : "bg-ink/[0.06]"
        )}
      />
    );
  }

  /* ─── Not authenticated ─── */
  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className={cn(
            "group relative inline-flex h-10 items-center gap-2.5 rounded-full pl-1 pr-4 font-display text-[0.8rem] font-medium tracking-tight transition-all duration-200",
            dark
              ? "border border-white/20 bg-white/10 text-white hover:bg-white/15"
              : "border border-slate-200 bg-white text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:border-slate-300 hover:bg-white hover:shadow-[0_8px_30px_-18px_rgba(15,23,42,0.35)]",
            variant === "dark" ? "focus-visible:outline-gold" : "focus-visible:outline-brand/80"
          )}
        >
          <motion.span
            className={cn(
              "relative grid h-7 w-7 place-items-center rounded-full",
              dark ? "bg-white/15 ring-1 ring-white/20" : "bg-gradient-to-br from-slate-50 to-white ring-1 ring-slate-200/80"
            )}
            animate={{
              y: [0, -1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 2,
              ease: "easeInOut",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn("h-4 w-4", dark ? "text-white" : "text-slate-700")}
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </motion.span>
          Sign in
        </Link>
      </div>
    );
  }

  /* ─── Authenticated ─── */
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "TEACHER";
  // Staff (admins + teachers) land in the management portal; students get the dashboard.
  const href = isAdmin ? "/management" : "/dashboard";
  const hrefLabel = isAdmin ? "Open admin panel" : "Open dashboard";
  const initial = (session.user.name ?? "U").slice(0, 1).toUpperCase();
  const label = isAdmin ? "Admin" : session.user.name;
  const image = img ?? (session.user.image as string | null) ?? null;

  return (
    <div className="relative">
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
          "group inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-3 backdrop-blur-md transition-all duration-300",
          menuOpen ? "shadow-sm" : "",
          dark
            ? "border border-gold/40 bg-gold/10 hover:bg-gold/20 focus-visible:outline-gold"
            : "border border-ink/12 bg-ivory/75 hover:bg-white hover:border-ink/20 focus-visible:outline-brand/80"
        )}
      >
        {/* Avatar wrapped in a brand gradient ring */}
        <span className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br p-[1.5px]",
          dark ? "from-gold-light to-gold-deep" : "from-brand to-brand-magenta"
        )}>
          <span className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={`${label} profile`} className="h-full w-full object-cover" />
            ) : (
              <span
                className={cn(
                  "flex h-full w-full items-center justify-center",
                  dark
                    ? "bg-gradient-to-br from-gold-light to-gold-deep"
                    : "bg-gradient-to-br from-brand/80 to-brand-deep"
                )}
              >
                {initial ? (
                  <span className="font-display text-[0.7rem] font-black text-white">{initial}</span>
                ) : (
                  <User className="h-3.5 w-3.5 text-white" strokeWidth={2} />
                )}
              </span>
            )}
            <span
              aria-hidden
              className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-[1.5px] border-white bg-emerald-500"
            />
          </span>
        </span>
        <span className="flex min-w-0 items-center gap-1.5">
          <span
            className={cn(
              "hidden max-w-[7rem] truncate font-display text-[0.7rem] font-bold uppercase tracking-[0.08em] sm:block",
              dark ? "text-gold-light" : "text-slate-800"
            )}
          >
            {label}
          </span>
          <ChevronDown
            className={cn(
              "hidden h-3.5 w-3.5 transition-transform duration-300 sm:block",
              menuOpen && "rotate-180",
              dark ? "text-gold-light/70" : "text-slate-400"
            )}
            strokeWidth={2.2}
          />
        </span>
      </button>

      {menuOpen ? (
        <div
          role="menu"
          className={cn(
            "fixed left-1/2 top-1/2 z-[200] w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border p-1.5 shadow-[0_24px_60px_-24px_rgb(15_23_42/0.45)] backdrop-blur-xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-56 sm:-translate-x-0 sm:-translate-y-0",
            dark ? "border-white/15 bg-[#0f172a]/95" : "border-ink/10 bg-white/95"
          )}
        >
          <div className="px-3 py-2">
            <p className={cn("truncate font-display text-[0.8rem] font-extrabold", dark ? "text-white" : "text-ink")}>
              {session.user.name ?? "Account"}
            </p>
            <p className={cn("truncate font-mono text-[0.6rem]", dark ? "text-white/40" : "text-ink-3")}>{session.user.email ?? ""}</p>
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