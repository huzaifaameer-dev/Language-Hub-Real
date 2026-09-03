"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { signOut } from "next-auth/react";
import {
  CalendarDays,
  Camera,
  Check,
  ClipboardList,
  Clock,
  GraduationCap,
  Home,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Send,
  Settings,
  Sparkles,
  User,
} from "lucide-react";

import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { useLiveSync } from "@/lib/use-live";
import { SettingsModal } from "@/components/dashboard/SettingsModal";
import { NotificationsBell } from "@/components/dashboard/NotificationsBell";
import {
  EnrollmentCard,
  Bookshelf,
  ContactCard,
} from "@/components/dashboard/cards";
import {
  EnrollmentModal,
  EnrolledCelebration,
  ApplicationCelebration,
} from "@/components/dashboard/modals";
import { ProgressCard } from "@/components/dashboard/ProgressCard";
import { UpcomingClassesCard } from "@/components/dashboard/UpcomingClassesCard";
import { CertificatesCard } from "@/components/dashboard/CertificatesCard";
import { AssignmentsCard } from "@/components/dashboard/AssignmentsCard";
import { ReferralCard } from "@/components/dashboard/ReferralCard";
import { Field, Chip, ErrorNote, resizeImage, type Enr } from "@/components/dashboard/ui";
import type { CourseInfo } from "@/lib/course-data";
import { FALLBACK_COURSES } from "@/lib/course-data";

type AppStatus = "PENDING" | "APPROVED" | "REJECTED";

interface App {
  id: string;
  name: string;
  email: string;
  place: string;
  bio: string;
  course: string;
  message?: string;
  status: AppStatus;
  adminMessage?: string | null;
  createdAt: string;
}

interface ProgressRecord {
  id: string;
  enrollmentId: string;
  course: string;
  chapters: Array<{ title: string; completed: boolean; completedAt?: string | null }>;
  attendance: Array<{ date: string; attended: boolean; topic?: string }>;
  lastChapter?: string | null;
  updatedAt: string;
}

interface LiveClassRecord {
  id: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingLink: string;
  platform: string;
  instructor: string;
  course: string;
  batch: string;
}

interface CertificateRecord {
  id: string;
  certificateId: string;
  studentName: string;
  course: string;
  batch: string;
  issuedAt: string;
  completionPercent: number;
  signedBy: string;
}

interface AssignmentRecord {
  id: string;
  course: string;
  title: string;
  description: string;
  studentAnswer?: string;
  status: "DRAFT" | "SUBMITTED" | "GRADED";
  grade?: string | null;
  feedbackCount: number;
  createdAt: string;
  updatedAt: string;
}

const COURSES = FALLBACK_COURSES.map((c) => c.name);

const APP_META: Record<AppStatus, { cls: string; dot: string; label: string }> = {
  PENDING: { cls: "border-amber-300 bg-amber-50 text-amber-700", dot: "bg-amber-500", label: "In review" },
  APPROVED: { cls: "border-emerald-300 bg-emerald-50 text-emerald-700", dot: "bg-emerald-500", label: "Approved" },
  REJECTED: { cls: "border-red-300 bg-red-50 text-red-600", dot: "bg-red-500", label: "Not selected" },
};

const ease = [0.16, 1, 0.3, 1] as const;

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

export function UserDashboard({ name, email, image, userId }: { name: string; email: string; image?: string | null; userId?: string }) {
  const [displayName, setDisplayName] = useState(name);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [joined, setJoined] = useState<string | null>(null);
  const [apps, setApps] = useState<App[]>([]);
  const [enrs, setEnrs] = useState<Enr[]>([]);
  const [loading, setLoading] = useState(true);

  const [avatar, setAvatar] = useState<string | null>(image ?? null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [whatsapp, setWhatsapp] = useState("");
  const [supportEmail, setSupportEmail] = useState<string | null>(null);
  const [supportWhatsapp, setSupportWhatsapp] = useState<string | null>(null);

  const [catalog, setCatalog] = useState<CourseInfo[]>(FALLBACK_COURSES);
  const [onlinePayment, setOnlinePayment] = useState(false);
  const [konnectPayment, setKonnectPayment] = useState(false);

  const [form, setForm] = useState({ name: name ?? "", place: "", bio: "", course: COURSES[0], message: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string[]> | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [celebrated, setCelebrated] = useState(false);

  const [enrOpen, setEnrOpen] = useState(false);
  const [enrSubjects, setEnrSubjects] = useState<string[]>([]);
  const [enrBatch, setEnrBatch] = useState("Evening");
  const [enrPlan, setEnrPlan] = useState("");
  const [enrErrors, setEnrErrors] = useState<Record<string, string[]> | null>(null);
  const [enrError, setEnrError] = useState<string | null>(null);
  const [enrSubmitting, setEnrSubmitting] = useState(false);
  const [enrSent, setEnrSent] = useState(false);

  const [enrolledCelebrated, setEnrolledCelebrated] = useState(false);
  const celebratedRef = useRef(false);

  // Feature 5–8: progress, classes, certificates, assignments
  const [progressData, setProgressData] = useState<ProgressRecord | null>(null);
  const [upcomingClasses, setUpcomingClasses] = useState<LiveClassRecord[]>([]);
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);

  const load = () => {
    fetch("/api/dashboard")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const data = d as {
          onlinePayment?: boolean;
          konnectPayment?: boolean;
          user?: { createdAt?: string | null; image?: string | null; whatsapp?: string };
          support?: { email?: string | null; whatsapp?: string | null };
          applications?: App[];
          enrollments?: Enr[];
          courses?: Array<CourseInfo & { id: string }>;
          progress?: ProgressRecord[];
          upcomingClasses?: LiveClassRecord[];
          certificates?: CertificateRecord[];
          assignments?: AssignmentRecord[];
        } | null;
        if (!data) return;
        if (typeof data.onlinePayment === "boolean") setOnlinePayment(data.onlinePayment);
        if (typeof data.konnectPayment === "boolean") setKonnectPayment(data.konnectPayment);
        if (data.user) {
          setJoined(data.user.createdAt ?? null);
          if (data.user.image !== undefined) setAvatar(data.user.image);
          if (data.user.whatsapp !== undefined) setWhatsapp(data.user.whatsapp);
        }
        if (data.support) {
          setSupportEmail(data.support.email ?? null);
          setSupportWhatsapp(data.support.whatsapp ?? null);
        }
        const list = data.applications ?? [];
        const enrList = data.enrollments ?? [];
        setApps(list);
        setEnrs(enrList);
        if (data.progress) setProgressData(data.progress[0] ?? null);
        if (data.upcomingClasses) setUpcomingClasses(data.upcomingClasses);
        if (data.certificates) setCertificates(data.certificates);
        if (data.assignments) setAssignments(data.assignments);
        const firstEnr = enrList[0];
        if (firstEnr?.status === "ENROLLED" && firstEnr?.id) {
          // Celebrate only once per enrollment (persisted), so the "Enrollment
          // successful" moment does not replay on every visit/reload. A brand
          // new enrollment (new id) gets its own celebration.
          const celebrationKey = `lh:celebrated:${firstEnr.id}`;
          let alreadyCelebrated = false;
          try {
            alreadyCelebrated = localStorage.getItem(celebrationKey) === "1";
          } catch {
            // ignore storage errors
          }
          if (!alreadyCelebrated && !celebratedRef.current) {
            try {
              localStorage.setItem(celebrationKey, "1");
            } catch {
              // storage unavailable — rely on the in-session ref guard
            }
            celebratedRef.current = true;
            setEnrolledCelebrated(true);
            setTimeout(() => setEnrolledCelebrated(false), 5200);
          }
        }
        const courses = data.courses;
        if (courses?.length) {
          setCatalog(courses);
          setEnrBatch((prev) => {
            const names = new Set(
              courses.flatMap((c) => c.batches.map((b) => b.name))
            );
            return names.has(prev) ? prev : (courses[0].batches[0]?.name ?? prev);
          });
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  // Live: when the admin approves/rejects our application or enrollment
  // while this dashboard is open, refetch instantly — no manual refresh.
  useLiveSync((ev) => {
    if (ev.userId && ev.userId !== userId) return;
    load();
  });

  const approvedApp = apps.find((a) => a.status === "APPROVED");
  const activeEnr = enrs[0];

  const submitApp = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormErrors(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setFormErrors(data.errors);
        setFormError(data.message ?? "Could not submit your application.");
        return;
      }
      setCelebrated(true);
      setForm((f) => ({ ...f, place: "", bio: "", message: "" }));
      setTimeout(() => {
        setCelebrated(false);
        load();
      }, 3200);
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSubject = (c: string) => {
    setEnrErrors(null);
    setEnrSubjects((prev) => {
      if (prev.includes(c)) return prev.filter((s) => s !== c);
      if (prev.length >= 4) return prev;
      return [...prev, c];
    });
  };

  const submitEnr = async () => {
    setEnrError(null);
    setEnrErrors(null);
    setEnrSubmitting(true);
    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjects: enrSubjects, batch: enrBatch, plan: enrPlan }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setEnrErrors(data.errors);
        setEnrError(data.message ?? "Could not submit your enrollment.");
        return;
      }
      setEnrOpen(false);
      setEnrSent(true);
      setEnrSubjects([]);
      setEnrBatch("Evening");
      setEnrPlan("");
      load();
      setTimeout(() => setEnrSent(false), 3000);
    } catch {
      setEnrError("Network error. Please try again.");
    } finally {
      setEnrSubmitting(false);
    }
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

  // Feature 5: Toggle chapter completion
  const handleToggleChapter = async (enrollmentId: string, chapterTitle: string) => {
    try {
      const res = await fetch("/api/dashboard/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId, action: "toggle_chapter", chapterTitle }),
      });
      const data = await res.json();
      if (data.progress) setProgressData(data.progress);
    } catch {}
  };

  // Feature 7: Claim certificate
  const handleIssueCert = async () => {
    if (!activeEnr) return;
    try {
      const res = await fetch("/api/dashboard/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId: activeEnr.id }),
      });
      const data = await res.json();
      if (data.ok) {
        // Refresh certificates
        const certRes = await fetch("/api/dashboard/certificates");
        const certData = await certRes.json();
        if (certData.certificates) setCertificates(certData.certificates);
      }
    } catch {}
  };

  // Feature 8: Submit assignment
  const handleSubmitAssignment = async (title: string, description: string, answer: string) => {
    if (!activeEnr) return;
    try {
      const res = await fetch("/api/dashboard/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId: activeEnr.id, action: "submit", title, description, studentAnswer: answer }),
      });
      if (res.ok) {
        const aRes = await fetch("/api/dashboard/assignments");
        const aData = await aRes.json();
        if (aData.assignments) setAssignments(aData.assignments);
      }
    } catch {}
  };

  // Feature 8: Reply to assignment feedback
  const handleReplyAssignment = async (assignmentId: string, message: string) => {
    if (!activeEnr) return;
    try {
      const res = await fetch("/api/dashboard/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId: activeEnr.id, assignmentId, action: "reply", message }),
      });
      if (res.ok) {
        const aRes = await fetch("/api/dashboard/assignments");
        const aData = await aRes.json();
        if (aData.assignments) setAssignments(aData.assignments);
      }
    } catch {}
  };

  return (
    <div id="lh-dashboard" className="relative min-h-screen overflow-hidden bg-[#eef1f9] text-slate-900">
      <div
        aria-hidden="true"
        className="bg-grid pointer-events-none absolute inset-0"
        style={{
          maskImage: "radial-gradient(ellipse at center, black 14%, transparent 68%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 14%, transparent 68%)",
        }}
      />
      <div aria-hidden className="orb left-[-8%] top-[-6%] h-[44vh] w-[44vh] bg-indigo-400/30" />
      <div aria-hidden className="orb right-[-10%] top-[8%] h-[40vh] w-[40vh] bg-violet-400/30" style={{ animationDelay: "-6s", animationDuration: "22s" }} />
      <div aria-hidden className="orb bottom-[-14%] left-[14%] h-[46vh] w-[46vh] bg-fuchsia-400/25" style={{ animationDelay: "-12s", animationDuration: "26s" }} />
      <div aria-hidden className="orb left-[42%] top-[40%] h-[30vh] w-[30vh] bg-sky-400/25" style={{ animationDelay: "-3s", animationDuration: "20s" }} />

      <motion.header
        initial={{ y: -56, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease }}
        className="sticky top-0 z-30 border-b border-white/60 bg-white/55 backdrop-blur-2xl"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="glass-dash flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-300/80 hover:shadow-[0_14px_30px_-10px_rgb(99_102_241/0.45)]"
              aria-label="Language Hub home"
            >
              <Logo size="xs" eager />
            </Link>
            <div className="leading-tight">
              <p className="font-display text-[0.58rem] font-bold uppercase tracking-[0.32em] text-indigo-600">My Account</p>
              <p className="truncate font-display text-[0.95rem] font-extrabold tracking-[-0.01em]">{displayName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden items-center gap-1.5 rounded-full border border-white/70 bg-white/60 px-4 py-2 font-display text-[0.75rem] font-bold text-slate-600 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-300/80 hover:text-indigo-600 sm:inline-flex"
            >
              <Home className="h-3.5 w-3.5" strokeWidth={2} />
              Home
            </Link>
            <NotificationsBell userId={userId} />
            <button
              onClick={() => setSettingsOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 py-2 font-display text-[0.75rem] font-bold text-slate-600 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-300/80 hover:text-indigo-600"
            >
              <Settings className="h-3.5 w-3.5" strokeWidth={2} />
              <span className="hidden sm:inline">Settings</span>
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="inline-flex items-center gap-2 rounded-full border border-rose-200/80 bg-white/70 px-4 py-2 font-display text-[0.75rem] font-bold text-rose-600 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
              Sign out
            </button>
          </div>
        </div>
      </motion.header>

      <main className="relative z-10 mx-auto max-w-6xl px-5 py-10 sm:px-8">
        {/* Journey timeline */}
        <Rise>
          <JourneyTimeline
            hasApp={apps.length > 0}
            approved={!!approvedApp}
            enrolled={activeEnr?.status === "ENROLLED"}
            pendingEnr={activeEnr?.status === "PENDING"}
            joinedAt={joined}
            appliedAt={apps[0]?.createdAt}
            approvedAt={approvedApp?.createdAt}
            enrolledAt={activeEnr?.createdAt}
          />
        </Rise>

        {/* Profile card */}
        <Rise delay={0.08}>
<section className="glass-dash glow-breathe relative mb-8 flex flex-col gap-6 overflow-hidden rounded-[2rem] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div aria-hidden className="pointer-events-none absolute -right-24 -top-28 h-60 w-60 rounded-full bg-violet-400/20 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-20 h-60 w-60 rounded-full bg-indigo-400/15 blur-3xl" />
            <div className="relative flex items-center gap-5">
              <div className="relative shrink-0">
                <span aria-hidden className="absolute -inset-2 rounded-full opacity-80 blur-lg" style={{ background: "conic-gradient(from 0deg,#6366f1,#8b5cf6,#d946ef,#6366f1)", animation: "ring-spin 8s linear infinite" }} />
                <span aria-hidden className="absolute -inset-3.5 rounded-full bg-indigo-400/25 blur-md" style={{ animation: "ring-spin 9s linear infinite reverse" }} />
                <span className="relative grid h-20 w-20 overflow-hidden rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 ring-4 ring-white shadow-[0_10px_28px_-8px_rgb(99_102_241/0.5)] sm:h-24 sm:w-24">
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatar} alt={`Profile photo of ${displayName}`} className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full w-full place-items-center font-display text-3xl font-black text-white">
                      {(displayName || name || "L").slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={avatarBusy}
                  aria-label="Upload profile photo"
                  className="absolute -bottom-0.5 -right-0.5 grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-slate-900 text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-slate-700 disabled:opacity-60"
                >
                  <Camera className="h-4 w-4" strokeWidth={2} />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
              </div>
              <div className="min-w-0">
                <h1 className="truncate font-display text-2xl font-extrabold tracking-[-0.02em] sm:text-[1.7rem]">{displayName}</h1>
                <p className="mt-1 flex items-center gap-1.5 truncate font-mono text-[0.82rem] text-slate-500">
                  <Mail className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
                  {email}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-[0.88rem] text-slate-400">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
                  {joined
                    ? `Member since ${new Date(joined).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`
                    : "Member"}
                </p>
                {avatarBusy ? (
                  <p className="mt-1.5 inline-flex items-center gap-2 font-mono text-[0.62rem] font-bold uppercase tracking-widest text-indigo-600">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-500" />
                    Uploading photo…
                  </p>
                ) : avatarError ? (
                  <p className="mt-1.5 font-mono text-[0.62rem] font-bold uppercase tracking-widest text-rose-600">
                    ! {avatarError}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="relative flex gap-3 sm:gap-4">
              <div className="glass-dash flex-1 rounded-2xl border-indigo-200/60 px-5 py-4 text-center sm:flex-none">
                <p className="font-display text-[1.9rem] font-black leading-none text-indigo-600">{String(apps.length).padStart(2, "0")}</p>
                <p className="mt-1 font-display text-[0.6rem] font-bold uppercase tracking-[0.24em] text-slate-500">Applications</p>
              </div>
              <div className="glass-dash flex-1 rounded-2xl border-violet-200/60 px-5 py-4 text-center sm:flex-none">
                <p className="font-display text-[1.9rem] font-black leading-none text-violet-600">{String(enrs.length).padStart(2, "0")}</p>
                <p className="mt-1 font-display text-[0.6rem] font-bold uppercase tracking-[0.24em] text-slate-500">Enrollments</p>
              </div>
            </div>
          </section>
        </Rise>

        {/* Approved → enroll CTA */}
        {approvedApp && !activeEnr ? (
          <Rise delay={0.1}>
            <section className="glass-dash relative mb-8 flex flex-col items-start justify-between gap-4 overflow-hidden rounded-[2rem] border-indigo-200/60 p-6 sm:flex-row sm:items-center sm:p-7">
              <div aria-hidden className="pointer-events-none absolute -left-16 -top-24 h-52 w-52 rounded-full bg-fuchsia-400/20 blur-3xl" />
              <div className="relative flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-indigo-100 text-indigo-600">
                  <GraduationCap className="h-6 w-6" strokeWidth={1.8} />
                </span>
                <div>
                  <p className="font-display text-[1.15rem] font-extrabold tracking-[-0.01em]">
                    Application <span className="text-emerald-600">approved.</span> Secure your seat.
                  </p>
                  <p className="mt-1.5 max-w-xl text-[0.92rem] leading-relaxed text-slate-500">
                    Choose your subjects and batch, then confirm your enrollment to start classes with the books assigned to you.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEnrOpen(true)}
                className="group inline-flex h-[3.1rem] shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-7 font-display text-[0.85rem] font-bold text-white shadow-[0_16px_36px_-14px_rgb(99_102_241/0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_-14px_rgb(99_102_241/0.8)]"
              >
                Proceed to Enrollment
                <span className="inline-block transition-transform duration-500 group-hover:translate-x-1">→</span>
              </button>
            </section>
          </Rise>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Left column */}
          <section className="flex flex-col gap-8">
            {activeEnr?.status === "ENROLLED" ? (
              <Rise>
                <Bookshelf subjects={activeEnr.subjects} />
              </Rise>
            ) : null}

            {activeEnr?.status === "ENROLLED" ? (
              <Rise delay={0.04}>
                <ProgressCard
                  progress={progressData}
                  onToggleChapter={handleToggleChapter}
                />
              </Rise>
            ) : null}

            {!activeEnr ? (
              <Rise delay={0.06}>
                <section className="glass-dash relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
                  <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-violet-400/20 blur-3xl" />
                  <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-20 h-52 w-52 rounded-full bg-sky-400/15 blur-3xl" />
                  <p className="relative flex items-center gap-3 font-display text-[0.6rem] font-bold uppercase tracking-[0.36em] text-indigo-600">
                    <span aria-hidden className="h-px w-7 bg-indigo-500/40" /> Apply for a course
                  </p>
                  <h2 className="relative mt-2 font-display text-[1.7rem] font-extrabold tracking-[-0.02em]">
                    START YOUR <span className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">JOURNEY.</span>
                  </h2>
                  <p className="relative mt-2 text-[0.92rem] text-slate-500">
                    Our team reviews every application within 12 hours. Fill the form once — track it live below.
                  </p>

                  <form onSubmit={submitApp} className="relative mt-7 flex flex-col gap-4">
                    <Field
                      label="Full name"
                      id="f-name"
                      value={form.name}
                      onChange={(v) => setForm({ ...form, name: v })}
                      icon={<User className="h-4.5 w-4.5" strokeWidth={1.8} />}
                      error={formErrors?.name?.[0]}
                      required
                    />
                    <Field
                      label="City / country"
                      id="f-place"
                      value={form.place}
                      onChange={(v) => setForm({ ...form, place: v })}
                      placeholder="e.g. Lahore, Pakistan"
                      icon={<MapPin className="h-4.5 w-4.5" strokeWidth={1.8} />}
                      error={formErrors?.place?.[0]}
                      required
                    />
                    <div>
                      <label htmlFor="f-bio" className="mb-1.5 block font-display text-[0.66rem] font-bold uppercase tracking-[0.2em] text-slate-600">
                        About you
                      </label>
                      <textarea
                        id="f-bio"
                        value={form.bio}
                        onChange={(e) => setForm({ ...form, bio: e.target.value })}
                        rows={4}
                        placeholder="Why do you want to learn this language? Your current level and goals."
                        required
                        className={cn(
                          "w-full resize-none rounded-xl border bg-white px-4 py-3 text-[0.95rem] text-slate-900 shadow-[0_1px_2px_rgb(15_23_42/0.04)] outline-none transition-all duration-300 placeholder:text-slate-400",
                          formErrors?.bio
                            ? "border-rose-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10"
                            : "border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/12"
                        )}
                      />
                      {formErrors?.bio ? <p className="mt-1.5 text-[0.78rem] font-medium text-rose-600">{formErrors.bio[0]}</p> : null}
                    </div>
                    <div>
                      <label htmlFor="f-course" className="mb-1.5 block font-display text-[0.66rem] font-bold uppercase tracking-[0.2em] text-slate-600">
                        Course
                      </label>
                      <select
                        id="f-course"
                        value={form.course}
                        onChange={(e) => setForm({ ...form, course: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[0.95rem] text-slate-900 shadow-[0_1px_2px_rgb(15_23_42/0.04)] outline-none transition-all duration-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/12"
                      >
                        {catalog.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Field
                      label="Message (optional)"
                      id="f-message"
                      value={form.message}
                      onChange={(v) => setForm({ ...form, message: v })}
                      placeholder="Anything else we should know?"
                      icon={<MessageSquare className="h-4.5 w-4.5" strokeWidth={1.8} />}
                      error={formErrors?.message?.[0]}
                    />

                    <span className="ml-auto font-mono text-[0.7rem] text-slate-400">{form.bio.length}/600</span>

                    {formError ? <ErrorNote>{formError}</ErrorNote> : null}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="group mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 font-display text-[0.95rem] font-bold text-white shadow-[0_14px_30px_-12px_rgb(99_102_241/0.75)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-12px_rgb(99_102_241/0.85)] hover:brightness-[1.05] disabled:opacity-60"
                    >
                      {submitting ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : (
                        <>
                          <Send className="h-4 w-4" strokeWidth={2} />
                          Submit Application
                          <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                        </>
                      )}
                    </button>
                  </form>
                </section>
              </Rise>
            ) : (
              <Rise delay={0.06}>
                <EnrollmentCard enr={activeEnr} onlinePayment={onlinePayment} konnectPayment={konnectPayment} onRetry={approvedApp ? () => setEnrOpen(true) : undefined} />
              </Rise>
            )}
          </section>

          {/* Right column — status list */}
          <section className="flex flex-col gap-8">
          <Rise delay={0.12}>
            <section className="glass-dash relative flex flex-col overflow-hidden rounded-[2rem] p-6 sm:p-8">
              <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-52 w-52 rounded-full bg-fuchsia-400/15 blur-3xl" />
              <p className="relative flex items-center gap-3 font-display text-[0.6rem] font-bold uppercase tracking-[0.36em] text-indigo-600">
                <span aria-hidden className="h-px w-7 bg-indigo-500/40" /> Track your journey
              </p>
              <h2 className="relative mt-2 font-display text-[1.7rem] font-extrabold tracking-[-0.02em]">
                YOUR <span className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">STATUS.</span>
              </h2>

              <div className="relative mt-6 flex flex-1 flex-col gap-4">
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
                ) : apps.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease }}
                    className="grid flex-1 place-items-center rounded-2xl border border-dashed border-slate-300/80 bg-white/40 px-6 py-14 text-center backdrop-blur-md"
                  >
                    <div>
                      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-600">
                        <ClipboardList className="h-7 w-7" strokeWidth={1.6} />
                      </span>
                      <p className="mt-4 font-display text-[0.95rem] font-bold text-slate-700">No applications yet</p>
                      <p className="mx-auto mt-1 max-w-[20rem] text-[0.88rem] text-slate-400">
                        Submit the form and your application will appear here with a live status.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  apps.map((a, i) => (
                    <motion.article
                      key={a.id}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.1, duration: 0.6, ease }}
                      className="rounded-2xl border border-white/80 bg-white/70 p-5 shadow-[0_10px_28px_-16px_rgb(15_23_42/0.2)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-white/90 hover:shadow-[0_16px_36px_-18px_rgb(99_102_241/0.5)]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-display text-[0.98rem] font-extrabold tracking-[-0.01em]">{a.course}</h3>
                          <p className="mt-0.5 font-mono text-[0.72rem] text-slate-400">
                            {new Date(a.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[0.62rem] font-bold tracking-widest", APP_META[a.status].cls)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", APP_META[a.status].dot)} />
                          {APP_META[a.status].label}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Chip icon={<MapPin className="h-3 w-3" strokeWidth={2} />}>{a.place}</Chip>
                        <Chip icon={<Mail className="h-3 w-3" strokeWidth={2} />}>{a.email}</Chip>
                      </div>
                      <p className="mt-3 text-[0.9rem] leading-relaxed text-slate-500">{a.bio}</p>
                      {a.adminMessage ? (
                        <div className="mt-4 rounded-xl border border-indigo-200/70 bg-indigo-50/70 px-4 py-3">
                          <p className="font-display text-[0.58rem] font-bold uppercase tracking-[0.26em] text-indigo-600">From the admin</p>
                          <p className="mt-1 text-[0.88rem] text-slate-700">{a.adminMessage}</p>
                        </div>
                      ) : null}
                    </motion.article>
                  ))
                )}
              </div>
            </section>
          </Rise>

          {/* Contact tile */}
          <Rise delay={0.14}>
            <UpcomingClassesCard classes={upcomingClasses} />
          </Rise>

          <Rise delay={0.16}>
            <CertificatesCard
              certificates={certificates}
              enrollmentStatus={activeEnr?.status}
              progressPercent={progressData?.chapters?.length
                ? Math.round((progressData.chapters.filter((c) => c.completed).length / progressData.chapters.length) * 100)
                : 0
              }
              onIssueCert={handleIssueCert}
            />
          </Rise>

          <Rise delay={0.18}>
            <AssignmentsCard
              assignments={assignments}
              onSubmit={handleSubmitAssignment}
              onReply={handleReplyAssignment}
            />
          </Rise>

          <Rise delay={0.19}>
            <ReferralCard />
          </Rise>

          <Rise delay={0.2}>
            <ContactCard
              myWhatsapp={whatsapp}
              supportEmail={supportEmail}
              supportWhatsapp={supportWhatsapp}
            />
          </Rise>
          </section>
        </div>
      </main>

      {enrOpen ? (
        <EnrollmentModal
          catalog={catalog}
          selected={enrSubjects}
          batch={enrBatch}
          plan={enrPlan}
          errors={enrErrors}
          error={enrError}
          busy={enrSubmitting}
          onToggle={toggleSubject}
          onBatch={setEnrBatch}
          onPlan={setEnrPlan}
          onClose={() => setEnrOpen(false)}
          onSubmit={submitEnr}
        />
      ) : null}

      {enrSent ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-5 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease }}
            className="flex flex-col items-center gap-4 rounded-[2rem] border border-white/70 bg-white/95 px-10 py-9 text-center shadow-2xl backdrop-blur-2xl"
          >
            <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="h-7 w-7" strokeWidth={2.5} />
            </span>
            <p className="font-display text-[1.2rem] font-extrabold tracking-[-0.01em]">
              ENROLLMENT <span className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">SENT.</span>
            </p>
            <p className="max-w-[20rem] text-[0.9rem] text-slate-500">
              The admin will confirm your seat — watch this space for the celebration.
            </p>
          </motion.div>
        </div>
      ) : null}

      {celebrated ? <ApplicationCelebration /> : null}
      {enrolledCelebrated ? <EnrolledCelebration name={name} subjects={activeEnr?.subjects ?? []} onDone={() => setEnrolledCelebrated(false)} /> : null}

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

/* ------------------------------ sections ------------------------------ */

function JourneyTimeline({
  hasApp,
  approved,
  enrolled,
  pendingEnr,
  joinedAt,
  appliedAt,
  approvedAt,
  enrolledAt,
}: {
  hasApp: boolean;
  approved: boolean;
  enrolled: boolean;
  pendingEnr: boolean;
  joinedAt?: string | null;
  appliedAt?: string | null;
  approvedAt?: string | null;
  enrolledAt?: string | null;
}) {
  const fmt = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : null;

  const steps: { key: string; label: string; state: "done" | "wait" | "todo"; hint: string }[] = [
    { key: "acct", label: "Account", state: "done", hint: fmt(joinedAt) ?? "Your home base" },
    {
      key: "applied",
      label: "Applied",
      state: hasApp ? "done" : "todo",
      hint: hasApp ? (fmt(appliedAt) ?? "Submitted") : "Not started yet",
    },
    {
      key: "approved",
      label: "Approved",
      state: approved ? "done" : hasApp ? "wait" : "todo",
      hint: approved ? (fmt(approvedAt) ?? "Approved") : hasApp ? "In review" : "Waiting your move",
    },
    {
      key: "enrolled",
      label: "Enrolled",
      state: enrolled ? "done" : approved || pendingEnr ? "wait" : "todo",
      hint: enrolled
        ? (fmt(enrolledAt) ?? "Seat locked")
        : approved
          ? "Ready to enroll"
          : pendingEnr
            ? "Awaiting admin"
            : "Locked out",
    },
  ];

  const doneCount = steps.filter((s) => s.state === "done").length;

  return (
    <section className="glass-dash relative mb-8 overflow-hidden rounded-[2rem] p-5 sm:p-7">
      <div aria-hidden className="pointer-events-none absolute -right-28 -top-28 h-60 w-60 rounded-full bg-indigo-400/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-24 h-60 w-60 rounded-full bg-fuchsia-400/20 blur-3xl" />

      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2.5 font-display text-[0.62rem] font-bold uppercase tracking-[0.32em] text-indigo-600">
          <Sparkles className="h-4 w-4" strokeWidth={2} />
          Your journey
        </p>
        <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-white/70 px-3.5 py-1.5 font-mono text-[0.62rem] font-bold uppercase tracking-[0.18em] text-indigo-700 backdrop-blur-md">
          {doneCount === 4 ? (
            <>FULLY ONBOARDED</>
          ) : (
            <>
              {doneCount} / 4 steps complete
            </>
          )}
        </span>
      </div>

      <div className="relative mt-9 flex items-start">
        {steps.map((s, i) => (
          <Fragment key={s.key}>
            {i > 0 ? <TimelineConnector prev={steps[i - 1].state} next={s.state} /> : null}
            <TimelineNode state={s.state} label={s.label} hint={s.hint} />
          </Fragment>
        ))}
      </div>
    </section>
  );
}

function TimelineConnector({
  prev,
  next,
}: {
  prev: "done" | "wait" | "todo";
  next: "done" | "wait" | "todo";
}) {
  const lit = next === "done";
  const partial = !lit && prev === "done";
  return (
    <div className="relative mt-[1.3rem] h-1.5 min-w-2 flex-1 rounded-full">
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 rounded-full transition-colors duration-700",
          lit ? "timeline-gradient opacity-90" : partial ? "bg-indigo-200" : "bg-slate-200/80"
        )}
      />
      {lit ? <span aria-hidden className="comet" /> : null}
    </div>
  );
}

function TimelineNode({
  state,
  label,
  hint,
}: {
  state: "done" | "wait" | "todo";
  label: string;
  hint: string;
}) {
  return (
    <div className="w-16 shrink-0 px-0.5 sm:w-24">
      <div className="relative flex justify-center">
        <span
          aria-hidden
          className={cn(
            "absolute -inset-2 rounded-2xl blur-lg",
            state === "done" && "bg-indigo-500/40",
            state === "wait" && "bg-amber-400/40",
            state === "todo" && "bg-slate-400/25"
          )}
        />
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease, delay: 0.1 }}
          className={cn(
            "relative grid h-12 w-12 place-items-center rounded-2xl border backdrop-blur-md",
            state === "done" &&
              "border-transparent bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-[0_10px_28px_-8px_rgb(99_102_241/0.85)]",
            state === "wait" &&
              "border-amber-300/80 bg-white/80 text-amber-600 shadow-[0_8px_24px_-10px_rgb(245_158_11/0.7)]",
            state === "todo" &&
              "border-white/80 bg-white/60 text-slate-400 shadow-[0_6px_18px_-10px_rgb(15_23_42/0.25)]"
          )}
        >
          {state === "done" ? (
            <Check className="h-5 w-5" strokeWidth={3} />
          ) : state === "wait" ? (
            <Clock className="h-5 w-5" strokeWidth={2} />
          ) : (
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400/70" />
          )}
        </motion.span>
        {state === "wait" ? (
          <span aria-hidden className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-70" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-amber-500" />
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          "mt-3 text-center font-display text-[0.58rem] font-extrabold uppercase tracking-[0.16em] sm:text-[0.64rem]",
          state === "done" ? "text-indigo-600" : state === "wait" ? "text-amber-600" : "text-slate-400"
        )}
      >
        {label}
      </p>
      <p className="mt-1 px-0.5 text-center font-mono text-[0.56rem] leading-tight text-slate-400 sm:text-[0.6rem]">
        {hint}
      </p>
    </div>
  );
}
