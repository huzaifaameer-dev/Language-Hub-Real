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
  Trophy,
  User,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEscapeKey } from "@/components/ui/FocusTrap";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Account chip for the navbar — a calm "Sign in" button for guests;
 * signed-in users get an avatar, a name + role label and a clean
 * dropdown with their account, dashboard, placement test and sign out.
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
    return (
      <span
        aria-hidden
        className="hidden h-12 w-[7.5rem] animate-pulse rounded-full bg-ink/[0.06] md:block"
      />
    );
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
        className="group relative hidden h-12 items-center gap-2.5 overflow-hidden rounded-full bg-[linear-gradient(115deg,#1D4ED8_0%,#2563EB_45%,#6D4AFF_100%)] p-1.5 pr-5 font-display text-[0.86rem] font-bold tracking-tight text-white shadow-[0_14px_30px_-16px_rgba(37,99,235,0.7)] ring-1 ring-white/25 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-16px_rgba(37,99,235,0.85)] focus-visible:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] active:translate-y-0 md:inline-flex"
      >
        {/* light sweep on hover */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-full w-2/3 -skew-x-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.42),transparent)] transition-transform duration-[900ms] ease-out group-hover:translate-x-[420%]"
        />
        {/* soft top gloss */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-4 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.7),transparent)]"
        />

        <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-white/18 ring-1 ring-white/30 backdrop-blur-[2px] transition-transform duration-300 ease-out group-hover:scale-[1.06]">
          <UserRound className="icon-hover-swing h-[1.15rem] w-[1.15rem]" strokeWidth={2.1} />
        </span>

        <span className="relative select-none">Sign in</span>

        <ArrowRight
          aria-hidden
          className="relative h-[0.95rem] w-[0.95rem] -translate-x-1.5 opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100"
          strokeWidth={2.4}
        />
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
          "flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-3.5 transition-colors duration-200",
          open
            ? "bg-white ring-1 ring-[#2563EB]/20"
            : "border border-[#E6EDFF] bg-white/85 ring-1 ring-inset ring-white/50 hover:bg-white"
        )}
      >
        {/* Avatar */}
        <span className="relative grid h-9 w-9 shrink-0 place-items-center">
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-[conic-gradient(from_90deg,#2563EB,#6D4AFF,#0EA5E9,#2563EB)]"
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
                className="flex w-full items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2.5 font-display text-[0.78rem] font-bold uppercase tracking-[0.06em] text-rose-600 transition-colors duration-200 hover:bg-rose-100"
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
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#2563EB]/[0.08] text-[#1647C7]">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="font-display text-[0.84rem] font-bold text-ink">{label}</span>
        {note ? <span className="mt-0.5 text-[0.66rem] font-medium text-ink-3">{note}</span> : null}
      </span>
    </Link>
  );
}
