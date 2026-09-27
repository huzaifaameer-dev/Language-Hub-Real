"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Sparkles,
  Trophy,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEscapeKey } from "@/components/ui/FocusTrap";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Premium account system — a single premium "identity chip" that works for
 * guests and signed-in users alike. Guests get a magnetic "Sign in" pill;
 * signed-in users get a conic-gradient avatar ring, a name + role label and a
 * glass dropdown with their account, dashboard, placement test and sign out.
 */
export function AccountChip() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [img, setImg] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Fetch freshest stored avatar (JWT only snapshots at sign-in).
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;
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
  }, [status, session?.user?.id]);

  useEscapeKey(() => setOpen(false), open);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (status === "loading") {
    return <span aria-hidden className="hidden h-11 w-11 animate-pulse rounded-full bg-ink/[0.06] md:block" />;
  }

  const isAuthed = !!session?.user;
  const role = (session?.user as { role?: string } | undefined)?.role ?? "USER";
  const href = isAuthed
    ? role === "ADMIN" || role === "TEACHER"
      ? "/management"
      : "/dashboard"
    : "/login";

  const name = session?.user?.name ?? (isAuthed ? "Account" : "Sign in");
  const email = session?.user?.email ?? "Welcome back, guest.";
  const initial = (session?.user?.name ?? "G").charAt(0).toUpperCase();
  const image = img ?? (session?.user?.image as string | null | undefined);
  const roleLabel = !isAuthed ? "Guest" : role === "ADMIN" ? "Admin" : role === "TEACHER" ? "Teacher" : "Student";

  /* ─────────────────────────── Guests ─────────────────────────── */
  if (!isAuthed) {
    return (
      <Link
        href="/login"
        aria-label="Sign in"
        className="group relative hidden items-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-[#2563EB] to-[#6D4AFF] pl-3.5 pr-4 py-2.5 shadow-[0_12px_28px_-14px_rgb(37_99_235/0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_38px_-16px_rgb(37_99_235/0.9)] md:inline-flex"
      >
        {/* moving shine */}
        <span aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        <span className="grid h-6 w-6 place-items-center rounded-full bg-white/90 text-[#2563EB]">
          <Sparkles className="h-3.5 w-3.5" strokeWidth={2.4} />
        </span>
        <span className="font-display text-[0.78rem] font-extrabold uppercase tracking-[0.08em] text-white">
          Sign in
        </span>
        <ArrowRight className="h-4 w-4 text-white/80 transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={2.4} />
      </Link>
    );
  }

  /* ─────────────────────── Signed-in chip ─────────────────────── */
  return (
    <div ref={rootRef} className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "group flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-3.5 transition-all duration-300",
          open
            ? "bg-white shadow-[0_16px_36px_-16px_rgb(37_99_235/0.45)] ring-1 ring-[#2563EB]/15"
            : "border border-[#E6EDFF] bg-white/80 shadow-[0_8px_22px_-14px_rgb(11_27_58/0.2)] hover:-translate-y-0.5 hover:border-[#2563EB]/35 hover:shadow-[0_14px_32px_-16px_rgb(37_99_235/0.5)]"
        )}
      >
        {/* Conic-ring avatar */}
        <span className="relative grid h-9 w-9 shrink-0 place-items-center">
          <span
            aria-hidden
            className={cn(
              "absolute inset-0 rounded-full transition-all duration-500",
              open
                ? "bg-[conic-gradient(from_90deg,#2563EB,#0EA5E9,#6D4AFF,#F0C36D,#2563EB)]"
                : "bg-[conic-gradient(from_90deg,#2563EB,#6D4AFF,#0EA5E9,#2563EB)]"
            )}
            style={{ animation: "spin 6s linear infinite" }}
          />
          <span className="absolute inset-[2px] grid place-items-center overflow-hidden rounded-full bg-white">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#2563EB] to-[#6D4AFF]">
                <span className="font-display text-[0.72rem] font-black text-white">{initial}</span>
              </span>
            )}
          </span>
          <span aria-hidden className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
        </span>

        {/* Name + role */}
        <span className="hidden flex-col items-start leading-none lg:flex">
          <span className="max-w-[9rem] truncate font-display text-[0.76rem] font-bold text-ink">{name}</span>
          <span className="mt-0.5 font-mono text-[0.5rem] font-semibold uppercase tracking-[0.14em] text-[#64748B]">
            {roleLabel}
          </span>
        </span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 text-[#94A3B8] transition-transform duration-300", open && "rotate-180")}
          strokeWidth={2.4}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease }}
            role="menu"
            className="absolute right-0 top-[calc(100%+0.6rem)] z-50 w-64 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white/95 shadow-[0_30px_70px_-30px_rgb(11_27_58/0.35)] backdrop-blur-xl"
          >
            {/* Gradient head band */}
            <div className="bg-gradient-to-br from-[#2563EB] via-[#1647C7] to-[#6D4AFF] px-4 py-3.5 text-white">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-white">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#2563EB] to-[#6D4AFF]">
                      <span className="font-display text-[0.8rem] font-black text-white">{initial}</span>
                    </span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-display text-[0.88rem] font-extrabold">{name}</span>
                  <span className="block truncate font-mono text-[0.6rem] text-white/70">{email}</span>
                </span>
              </div>
            </div>

            <div className="p-1.5">
              <MenuItem icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" href={href} onClick={() => setOpen(false)} />
              <MenuItem icon={<Trophy className="h-4 w-4" />} label="Placement Test" href="/placement-test" onClick={() => setOpen(false)} />
              <MenuItem icon={<GraduationCap className="h-4 w-4" />} label="Browse Courses" href="/courses" onClick={() => setOpen(false)} />
              <MenuItem icon={<User className="h-4 w-4" />} label="My Profile" href="/dashboard" onClick={() => setOpen(false)} />

              <div className="my-1.5 h-px bg-ink/[0.06]" />
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                role="menuitem"
                className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-display text-[0.82rem] font-bold text-rose-600 transition-colors hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" strokeWidth={2} />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  href,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-display text-[0.82rem] font-bold text-ink transition-colors hover:bg-[#2563EB]/[0.05] hover:text-[#1647C7]"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#2563EB]/[0.08] text-[#1647C7] transition-transform group-hover:scale-105">
        {icon}
      </span>
      {label}
      <ArrowRight className="ml-auto h-3.5 w-3.5 text-[#94A3B8] opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" strokeWidth={2.2} />
    </Link>
  );
}