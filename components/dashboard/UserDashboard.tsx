"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "next-auth/react";
import {
  Bot,
  CalendarDays,
  Camera,
  ChevronRight,
  ClipboardList,
  FileText,
  GraduationCap,
  LogOut,
  Mail,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useLiveSync } from "@/lib/use-live";
import {
  REGISTRATION_COURSES,
  REGISTRATION_COURSES_BY_KEY,
  registrationFeeLabel,
  type RegistrationCourseConfig,
} from "@/lib/registration-config";
import { SettingsModal } from "@/components/dashboard/SettingsModal";
import { NotificationsBell } from "@/components/dashboard/NotificationsBell";
import { RegistrationWizard } from "@/components/dashboard/RegistrationWizard";
import { resizeImage } from "@/components/dashboard/ui";

type RegStatus = "NEW" | "CONTACTED" | "ENROLLED";

interface MyRegistration {
  id: string;
  ref: string;
  course: string;
  courseKey: string;
  status: RegStatus;
  pdfAttached: boolean;
  createdAt: string;
}

const STATUS_META: Record<RegStatus, { cls: string; label: string }> = {
  NEW: { cls: "border-amber-300 bg-amber-50 text-amber-700", label: "Received" },
  CONTACTED: { cls: "border-sky-300 bg-sky-50 text-sky-700", label: "We contacted you" },
  ENROLLED: { cls: "border-emerald-300 bg-emerald-50 text-emerald-700", label: "Enrolled" },
};

const ease = [0.16, 1, 0.3, 1] as const;

export function UserDashboard({ name, email, image, userId }: { name: string; email: string; image?: string | null; userId?: string }) {
  const [displayName, setDisplayName] = useState(name);
  const [joined, setJoined] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [regs, setRegs] = useState<MyRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<RegistrationCourseConfig | null>(null);

  const [avatar, setAvatar] = useState<string | null>(image ?? null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    fetch("/api/registrations", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.registrations) setRegs(d.registrations as MyRegistration[]);
        if (d) setLoading(false);
      })
      .catch(() => setLoading(false));
    fetch("/api/dashboard")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        if (d.user) {
          setJoined(d.user.createdAt ?? null);
          if (d.user.image !== undefined) setAvatar(d.user.image);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // "Apply for X" CTAs across the site land here as /dashboard?apply=<key> —
  // open that course's registration wizard immediately.
  useEffect(() => {
    try {
      const key = new URLSearchParams(window.location.search).get("apply");
      const course = key ? REGISTRATION_COURSES_BY_KEY[key] : undefined;
      if (course) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedCourse(course);
        window.history.replaceState({}, "", window.location.pathname);
      }
    } catch {
      // ignore — the wizard is a convenience, never a hard requirement
    }
  }, []);

  useLiveSync((ev) => {
    if (ev.userId && ev.userId !== userId) return;
    load();
  });

  const onWizardSuccess = () => {
    load();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please upload an image file (JPG, PNG or WebP).");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setAvatarError("Image must be under 3 MB.");
      return;
    }
    setAvatarBusy(true);
    setAvatarError(null);
    try {
      const dataUrl = await resizeImage(file, 480);
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAvatarError(d.message ?? "Could not update your photo.");
        return;
      }
      setAvatar(typeof d.image === "string" ? d.image : dataUrl);
    } catch {
      setAvatarError("Could not read that image.");
    } finally {
      setAvatarBusy(false);
    }
  };

  const firstName = (displayName || name || "Learner").trim().split(/\s+/)[0];
  const newCount = regs.filter((r) => r.status === "NEW").length;

  return (
    <div
      id="lh-dashboard"
      className="relative min-h-screen bg-[#F8FAFF] text-[#0B1B3A]"
      style={{
        backgroundImage:
          "radial-gradient(1100px 520px at 85% -10%, rgb(37 99 235 / 0.10), transparent 60%), radial-gradient(900px 480px at -10% 30%, rgb(109 74 255 / 0.08), transparent 55%)",
      }}
    >
      <main className="relative z-10 mx-auto max-w-7xl px-4 pt-28 pb-8 sm:px-6 lg:px-8 lg:pt-32">
        {/* Dashboard tools bar */}
        <div className="mb-6 flex flex-wrap items-center justify-end gap-2">
          <Link
            href="/tutor"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E6EDFF] bg-white px-3.5 py-2 font-display text-[0.74rem] font-bold text-[#1647C7] shadow-sm transition-all duration-300 hover:border-[#2563EB]/50 md:inline-flex"
          >
            <Bot className="h-3.5 w-3.5" strokeWidth={2} />
            AI Tutor
          </Link>
          <Link
            href="/ai-feedback"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E6EDFF] bg-white px-3.5 py-2 font-display text-[0.74rem] font-bold text-[#1647C7] shadow-sm transition-all duration-300 hover:border-[#2563EB]/50 md:inline-flex"
          >
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
            Feedback
          </Link>
          <Link
            href="/feedback"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E6EDFF] bg-white px-3.5 py-2 font-display text-[0.74rem] font-bold text-[#1647C7] shadow-sm transition-all duration-300 hover:border-[#6D4AFF]/50 md:inline-flex"
          >
            <Send className="h-3.5 w-3.5" strokeWidth={2} />
            Give Feedback
          </Link>
          <Link
            href="/my-learning"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E6EDFF] bg-white px-3.5 py-2 font-display text-[0.74rem] font-bold text-[#1647C7] shadow-sm transition-all duration-300 hover:border-[#2BB3D8]/60 md:inline-flex"
          >
            <ClipboardList className="h-3.5 w-3.5" strokeWidth={2} />
            My Assignments
          </Link>
          <NotificationsBell userId={userId} />
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
            className="grid h-10 w-10 place-items-center rounded-xl border border-[#E6EDFF] bg-white text-[#3B4A6B] shadow-sm transition-all duration-300 hover:border-[#2563EB]/50 hover:text-[#2563EB]"
          >
            <Settings className="h-4 w-4" strokeWidth={1.9} />
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            aria-label="Sign out"
            className="grid h-10 w-10 place-items-center rounded-xl border border-[#E6EDFF] bg-white text-[#3B4A6B] shadow-sm transition-all duration-300 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.9} />
          </button>
        </div>

        {/* Welcome hero */}
        <section className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <span className="grid h-16 w-16 shrink-0 rounded-full bg-gradient-to-br from-[#2563EB] to-[#6D4AFF] p-[2px] shadow-[0_10px_26px_-12px_rgb(37_99_235/0.6)] ring-2 ring-white/80 sm:h-20 sm:w-20">
                <span className="relative grid h-full w-full place-items-center overflow-hidden rounded-full bg-white">
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatar} alt={`Profile photo of ${displayName}`} className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full w-full place-items-center rounded-full bg-gradient-to-br from-[#2563EB] to-[#6D4AFF] font-display text-2xl font-black text-white">
                      {(displayName || name || "L").slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span aria-hidden className="absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                </span>
              </span>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={avatarBusy}
                aria-label="Upload profile photo"
                className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-[#1647C7] text-white shadow transition-all duration-300 hover:scale-110 hover:bg-[#2563EB] disabled:opacity-60"
              >
                <Camera className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
            </div>
            <div className="min-w-0">
              <p className="font-display text-[0.6rem] font-bold uppercase tracking-[0.32em] text-[#1647C7]">My account</p>
              <h1 className="mt-1 truncate font-display text-[1.55rem] font-extrabold tracking-[-0.02em] text-[#0B1B3A] sm:text-[1.85rem]">
                Welcome back, <span className="bg-gradient-to-r from-[#2563EB] to-[#6D4AFF] bg-clip-text text-transparent">{firstName}</span>
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.85rem] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
                  {email}
                </span>
                <span aria-hidden className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
                  {joined
                    ? `Member since ${new Date(joined).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`
                    : "Member"}
                </span>
              </p>
              {avatarBusy ? (
                <p className="mt-1 inline-flex items-center gap-2 font-mono text-[0.62rem] font-bold uppercase tracking-widest text-[#1647C7]">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#2563EB]/30 border-t-[#2563EB]" />
                  Uploading photo…
                </p>
              ) : avatarError ? (
                <p className="mt-1 font-mono text-[0.62rem] font-bold uppercase tracking-widest text-rose-600">
                  ! {avatarError}
                </p>
              ) : null}
            </div>
          </div>

          {/* Quick stats */}
          <dl className="grid grid-cols-3 gap-3">
            <StatTile label="Registrations" value={loading ? "…" : String(regs.length).padStart(2, "0")} accent="indigo" />
            <StatTile label="In review" value={loading ? "…" : String(newCount).padStart(2, "0")} accent="amber" />
            <StatTile label="Enrolled" value={loading ? "…" : String(regs.filter((r) => r.status === "ENROLLED").length).padStart(2, "0")} accent="emerald" />
          </dl>
        </section>

        {/* Course selection + registrations */}
        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Courses */}
          <div className="lg:col-span-2">
            <Rise>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="flex items-center gap-3 font-display text-[0.62rem] font-bold uppercase tracking-[0.36em] text-[#1647C7]">
                    <span aria-hidden className="h-px w-7 bg-[#2563EB]/40" /> Step 1 · choose your course
                  </p>
                  <h2 className="mt-1.5 font-display text-[1.7rem] font-extrabold tracking-[-0.02em]">
                    Start your <span className="bg-gradient-to-r from-[#2563EB] to-[#6D4AFF] bg-clip-text text-transparent">journey.</span>
                  </h2>
                  <p className="mt-1 max-w-xl text-[0.9rem] text-slate-500">
                    Pick a programme and complete the secure registration. Our team reviews every registration within 24 hours.
                  </p>
                </div>
                <span className="rounded-full border border-[#E6EDFF] bg-white px-3 py-1.5 font-mono text-[0.6rem] font-bold uppercase tracking-[0.18em] text-[#1647C7]">
                  reply in 24h
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {REGISTRATION_COURSES.map((course, i) => (
                  <motion.button
                    key={course.key}
                    type="button"
                    initial={{ opacity: 0, y: 22 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.6, ease, delay: Math.min(0.25, i * 0.07) }}
                    onClick={() => setSelectedCourse(course)}
                    className="group relative overflow-hidden rounded-[1.6rem] border border-white/80 bg-white/80 p-5 text-start shadow-[0_18px_44px_-28px_rgb(15_23_42/0.35)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_-28px_rgb(99_102_241/0.55)] sm:p-6"
                  >
                    <span
                      aria-hidden
                      className="absolute inset-x-0 top-0 h-1.5"
                      style={{ background: `linear-gradient(90deg, ${course.accent.from}, ${course.accent.to})` }}
                    />
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${course.accent.from}, ${course.accent.to})` }}
                      >
                        <GraduationCap className="h-5.5 w-5.5" strokeWidth={1.9} />
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-mono text-[0.58rem] font-bold uppercase tracking-widest text-slate-500">
                        {course.duration}
                      </span>
                    </div>
                    <h3 className="mt-3.5 font-display text-[1.08rem] font-extrabold tracking-[-0.01em] text-slate-900">
                      {course.name}
                    </h3>
                    <p className="mt-1 text-[0.78rem] italic text-slate-500">“{course.tagline}”</p>
                    <p className="mt-2.5 line-clamp-2 text-[0.82rem] leading-relaxed text-slate-500">
                      {course.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5">
                      <span className="font-display text-[1.05rem] font-extrabold text-[#0B1B3A]">
                        {registrationFeeLabel(course)}
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-display text-[0.74rem] font-bold text-[#1647C7] transition-transform duration-300 group-hover:translate-x-0.5">
                        Register <ChevronRight className="h-4 w-4" />
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </Rise>
          </div>

          {/* My registrations */}
          <section className="flex flex-col gap-4">
            <Rise delay={0.12}>
              <div className="glass-dash relative flex flex-col overflow-hidden rounded-3xl p-6 sm:p-7">
                <span aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-40 w-40 rounded-full bg-indigo-400/15 blur-3xl" />
                <p className="relative flex items-center gap-3 font-display text-[0.6rem] font-bold uppercase tracking-[0.36em] text-[#1647C7]">
                  <span aria-hidden className="h-px w-7 bg-[#2563EB]/40" /> Track your progress
                </p>
                <h2 className="relative mt-2 font-display text-[1.5rem] font-extrabold tracking-[-0.02em]">
                  My <span className="text-[#1647C7]">registrations.</span>
                </h2>

                <div className="relative mt-5 flex flex-1 flex-col gap-3">
                  {loading ? (
                    <div className="space-y-3">
                      {[0, 1].map((i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 + i * 0.15, duration: 0.6, ease }}
                          className="h-24 animate-pulse rounded-2xl bg-slate-200/70"
                        />
                      ))}
                    </div>
                  ) : regs.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, ease }}
                      className="grid flex-1 place-items-center rounded-2xl border border-dashed border-slate-300/80 bg-white/40 px-6 py-12 text-center backdrop-blur-md"
                    >
                      <div>
                        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-600">
                          <ClipboardList className="h-7 w-7" strokeWidth={1.6} />
                        </span>
                        <p className="mt-4 font-display text-[0.95rem] font-bold text-slate-700">No registrations yet</p>
                        <p className="mx-auto mt-1 max-w-[18rem] text-[0.88rem] text-slate-400">
                          Pick a course on the left and submit the secure registration form to get started.
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    regs.map((r, i) => {
                      const meta = STATUS_META[r.status];
                      return (
                        <motion.article
                          key={r.id}
                          initial={{ opacity: 0, y: 18 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + i * 0.08, duration: 0.6, ease }}
                          className="rounded-2xl border border-white/80 bg-white/70 p-4 shadow-[0_10px_28px_-16px_rgb(15_23_42/0.2)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-white/90"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="truncate font-display text-[0.95rem] font-extrabold tracking-[-0.01em]">{r.course}</h3>
                              <p className="mt-0.5 font-mono text-[0.7rem] text-slate-400">
                                {r.ref} · {new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                            </div>
                            <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[0.58rem] font-bold tracking-widest", meta.cls)}>
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              {meta.label}
                            </span>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2} />
                            <p className="text-[0.78rem] text-slate-500">
                              {r.status === "NEW"
                                ? "We replied — within 24 hours."
                                : r.status === "CONTACTED"
                                  ? "Our team has reached out to you."
                                  : "Welcome aboard — seat confirmed."}
                            </p>
                          </div>
                          {r.pdfAttached ? (
                            <a
                              href={`/api/registrations/media/${r.id}?field=pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50/70 px-3 py-1.5 font-display text-[0.7rem] font-bold text-indigo-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-100"
                            >
                              <FileText className="h-3.5 w-3.5" /> My registration PDF
                            </a>
                          ) : null}
                        </motion.article>
                      );
                    })
                  )}
                </div>
              </div>
            </Rise>
          </section>
        </section>
      </main>

      <AnimatePresence>
        {selectedCourse ? (
          <RegistrationWizard
            course={selectedCourse}
            userName={displayName || name}
            userEmail={email}
            onExit={() => {
              setSelectedCourse(null);
            }}
            onSuccess={onWizardSuccess}
          />
        ) : null}
      </AnimatePresence>

      {settingsOpen ? (
        <SettingsModal
          name={displayName}
          email={email}
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onSaved={(n) => setDisplayName(n)}
        />
      ) : null}
    </div>
  );
}

function StatTile({ label, value, accent }: { label: string; value: string; accent: "indigo" | "amber" | "emerald" }) {
  const tones: Record<string, string> = {
    indigo: "text-indigo-600",
    amber: "text-amber-600",
    emerald: "text-emerald-600",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <dt className="font-mono text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</dt>
      <dd className={`mt-1 font-display text-[1.5rem] font-extrabold leading-none ${tones[accent]}`}>{value}</dd>
    </div>
  );
}

function Rise({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.7, ease, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}