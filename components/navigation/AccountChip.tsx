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
  UserCircle,
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
        prefetch
        aria-label="Sign in"
        className="group relative hidden items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-4 py-2.5 font-display text-[0.8rem] font-medium tracking-tight text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-colors duration-150 hover:border-slate-300 hover:bg-white hover:shadow-[0_4px_14px_-10px_rgba(15,23,42,0.2)] md:inline-flex"
      >
        <motion.span
          className="relative grid h-6 w-6 place-items-center rounded-full bg-slate-50 ring-1 ring-slate-200/80 perspective-[600px]"
          initial={{ rotateY: 0 }}
          animate={{ rotateY: 360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
            repeatDelay: 2,
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
            className="-ml-0.5 h-3.5 w-3.5 transform-gpu text-slate-700"
          >
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
        </motion.span>
        Sign in
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
            : "border border-[#E6EDFF] bg-white/80 shadow-[0_8px_22px_-14px_rgb(11_27_58/0.2)] ring-1 ring-inset ring-white/40 hover:-translate-y-0.5 hover:border-[#2563EB]/35 hover:shadow-[0_14px_32px_-16px_rgb(37_99_235/0.5)]"
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

      {/* Dropdown — clean, settled */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.24, ease }}
            role="menu"
            className="absolute right-0 top-[calc(100%+0.6rem)] z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white/95 shadow-[0_30px_70px_-30px_rgb(11_27_58/0.35)] backdrop-blur-xl"
          >
            {/* caret */}
            <span aria-hidden className="absolute -top-1.5 right-6 h-3 w-3 rotate-45 rounded-[3px] border-l border-t border-[#E2E8F0] bg-white" />
            {/* top hairline */}
            <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#1D4ED8] via-[#38BDF8] to-[#1D4ED8]" />

            {/* Header */}
            <div className="flex items-center gap-3 px-4 pb-3 pt-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full ring-2 ring-[#2563EB]/15">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#2563EB] to-[#6D4AFF]">
                    <span className="font-display text-[0.85rem] font-black text-white">{initial}</span>
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-[0.95rem] font-extrabold text-ink">{name}</span>
                <span className="block truncate font-mono text-[0.56rem] font-semibold uppercase tracking-[0.14em] text-ink-3">
                  {roleLabel} · {email}
                </span>
              </span>
            </div>

            {/* Menu */}
            <div className="px-1.5 pb-1.5">
              <MenuItem icon={<LayoutDashboard className="h-4.5 w-4.5" />} label="Dashboard" note="Your learning home" href={href} onClick={() => setOpen(false)} />
              <MenuItem icon={<Trophy className="h-4.5 w-4.5" />} label="Placement Test" note="Find your level in 10 min" href="/placement-test" onClick={() => setOpen(false)} />
              <MenuItem icon={<GraduationCap className="h-4.5 w-4.5" />} label="Courses" note="Browse all programmes" href="/courses" onClick={() => setOpen(false)} />
              <MenuItem icon={<User className="h-4.5 w-4.5" />} label="My Profile" note="Edit account & photo" href="/dashboard?settings=1" onClick={() => setOpen(false)} />
            </div>

            {/* Sign out */}
            <div className="border-t border-ink/[0.06] px-3 pb-3 pt-2">
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                role="menuitem"
                className="flex w-full items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2.5 font-display text-[0.78rem] font-bold uppercase tracking-[0.06em] text-rose-600 transition-all duration-300 hover:bg-rose-100 hover:shadow-[0_10px_24px_-12px_rgb(225_29_72/0.45)]"
              >
                <LogOut className="h-4 w-4" strokeWidth={2.2} />
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
  note,
  href,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  note?: string;
  href: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[#2563EB]/[0.05]"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#2563EB]/[0.08] text-[#1647C7] transition-transform group-hover:scale-105">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="font-display text-[0.84rem] font-bold text-ink group-hover:text-[#1647C7]">{label}</span>
        {note ? <span className="mt-0.5 text-[0.66rem] font-medium text-ink-3">{note}</span> : null}
      </span>
      <ArrowRight className="mt-2 h-4 w-4 shrink-0 -translate-x-1 text-[#2563EB] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" strokeWidth={2.2} />
    </Link>
  );
}
