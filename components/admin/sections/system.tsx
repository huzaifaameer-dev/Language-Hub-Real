"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Award,
  BookOpen,
  CalendarClock,
  ChevronDown,
  ClipboardList,
  Eye,
  Plus,
  Settings2,
  Shield,
  ShieldAlert,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

import {
  api,
  Badge,
  Card,
  Empty,
  ErrorNote,
  fmtDate,
  fmtDateTime,
  Input,
  Label,
  Loading,
  PrimaryButton,
  SectionHead,
  useApi,
} from "@/components/admin/ui";

/* ──────────────────────────────── overview ─────────────────────────────── */

interface OverviewPayload {
  admin: { email: string | null; name: string };
  overview: {
    users: number;
    newUsers7d: number;
    registrations: number;
    newRegistrations: number;
    demoBookings: number;
    newDemoBookings: number;
    feedback: number;
    newFeedback: number;
    enrollments: number;
    certificates: number;
    courses: number;
    testimonials: number;
    securityEvents: number;
    leads: number;
  };
  registrations: Array<{
    id: string;
    ref: string;
    name: string;
    course: string;
    status: string;
    createdAt: string;
  }>;
  demoBookings: Array<{
    id: string;
    name: string;
    course: string;
    date: string | null;
    status: string;
    createdAt: string;
  }>;
  feedback: Array<{
    id: string;
    name: string;
    subject: string;
    rating: number;
    status: string;
    createdAt: string;
  }>;
  users: Array<{ id: string; name: string; email: string; role: string; createdAt: string }>;
  audit: Array<{
    id: string;
    actor: string | null;
    action: string;
    target: string | null;
    createdAt: string;
  }>;
  courses: Array<{
    slug: string;
    name: string;
    icon: string;
    duration: string;
    fee: number;
    enrolled: number;
  }>;
  testimonials: Array<{
    id: string;
    name: string;
    role: string;
    course: string;
    quote: string;
    rating: number;
  }>;
}

const CHANNEL_COLORS = ["#0d6a58", "#f26a4a", "#f5c542", "#6bd3c3", "#f4a78f", "#8fb9ab"];

export function OverviewSection({ onOpen }: { onOpen: (tab: string) => void }) {
  const { data, loading, error } = useApi<OverviewPayload>("/api/admin/overview");

  if (loading) return <Loading label="Loading the control board…" />;
  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (!data) return null;

  const o = data.overview;
  const firstName = data.admin.name.split(" ")[0] || data.admin.name;

  const pending = o.newRegistrations + o.newDemoBookings + o.newFeedback;

  const cards = [
    {
      label: "Total Courses",
      value: o.courses,
      hint: `${o.enrollments} active enrolments`,
      icon: BookOpen,
      tile: "bg-[#e4f6ee] text-[#0d6a58]",
      spark: "M0 26C12 24 18 16 30 17S48 24 62 18 80 8 96 10",
      stroke: "#0d6a58",
      tab: "courses",
    },
    {
      label: "Active Students",
      value: o.users,
      hint: `+${o.newUsers7d} this week`,
      icon: Users,
      tile: "bg-[#fdeee8] text-[#d9542f]",
      spark: "M0 24C14 26 22 14 34 15S54 12 66 16 82 20 96 6",
      stroke: "#f26a4a",
      tab: "users",
    },
    {
      label: "Certificates",
      value: o.certificates,
      hint: "Verified results",
      icon: Award,
      tile: "bg-[#fff6dc] text-[#c99414]",
      spark: "M0 22C10 18 20 22 32 18S52 9 64 12 82 15 96 12",
      stroke: "#e0a91b",
      tab: "registrations",
    },
    {
      label: "Success Rate",
      value: `${o.enrollments > 0 ? Math.min(100, Math.round((o.certificates / o.enrollments) * 100)) : 0}%`,
      hint: "Certificates vs enrolments",
      icon: TrendingUp,
      tile: "bg-[#e6f7f3] text-[#12a08c]",
      spark: "M0 20C12 22 20 12 32 14S50 20 62 11 82 8 96 4",
      stroke: "#12a08c",
      tab: "registrations",
    },
  ];

  const channels = [
    { label: "Admissions", value: o.registrations },
    { label: "Demo", value: o.demoBookings },
    { label: "Students", value: o.users },
    { label: "Feedback", value: o.feedback },
    { label: "Courses", value: o.courses },
    { label: "Leads", value: o.leads },
  ];
  const peak = Math.max(1, ...channels.map((c) => c.value));

  const quickActions = [
    { label: "Add New Course", hint: "Programmes & batches", icon: BookOpen, tab: "courses" },
    { label: "Review Admissions", hint: `${o.newRegistrations} new files`, icon: ClipboardList, tab: "registrations" },
    { label: "Schedule Demo", hint: `${o.newDemoBookings} requests`, icon: CalendarClock, tab: "demo" },
    { label: "Publish Testimonial", hint: `${o.testimonials} live stories`, icon: Sparkles, tab: "testimonials" },
  ];

  return (
    <div className="space-y-5">
      {/* ── greeting ─────────────────────────────────────────────────── */}
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-[1.5rem] font-extrabold tracking-[-0.03em] text-[#10231f]">
            Good to see you, {firstName}.
          </h2>
          <p className="mt-1 font-sans text-[0.86rem] text-[#5c706a]">
            {pending > 0
              ? `${o.newRegistrations} admissions, ${o.newDemoBookings} demo requests and ${o.newFeedback} feedback items are waiting for a reply.`
              : "The queue is clear — nothing needs attention right now."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpen("courses")}
          className="group inline-flex h-11 items-center gap-2 rounded-full bg-[#0d5c4d] px-6 font-display text-[0.82rem] font-bold text-white shadow-[0_14px_24px_-18px_rgba(13,92,77,0.9)] transition-transform duration-300 hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" />
          Add New Course
        </button>
      </section>

      {/* ── stat cards ───────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => onOpen(card.tab)}
              className="group rounded-2xl bg-white p-5 text-left shadow-[0_16px_36px_-32px_rgba(13,71,60,0.55)] ring-1 ring-[#eef5f1] transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between gap-3">
                <span className={cn("grid h-11 w-11 place-items-center rounded-xl", card.tile)}>
                  <Icon className="h-5 w-5" strokeWidth={1.9} />
                </span>
                <svg
                  aria-hidden
                  viewBox="0 0 96 32"
                  className="h-8 w-20 overflow-visible"
                  preserveAspectRatio="none"
                >
                  <path
                    d={card.spark}
                    fill="none"
                    stroke={card.stroke}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    opacity=".55"
                  />
                </svg>
              </div>
              <p className="mt-4 font-display text-[1.7rem] font-extrabold leading-none tracking-[-0.03em] text-[#10231f]">
                {card.value}
              </p>
              <p className="mt-1.5 font-sans text-[0.82rem] font-semibold text-[#44615a]">
                {card.label}
              </p>
              <p className="mt-0.5 font-sans text-[0.7rem] text-[#9aada7]">{card.hint}</p>
            </button>
          );
        })}
      </div>

      {/* ── analytics + quick actions ────────────────────────────────── */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <section className="rounded-2xl bg-white p-5 shadow-[0_16px_36px_-32px_rgba(13,71,60,0.5)] ring-1 ring-[#eef5f1] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-[1.05rem] font-bold text-[#10231f]">
                Analytics Overview
              </h3>
              <p className="mt-0.5 font-sans text-[0.74rem] text-[#8ba19b]">
                Live records across every desk
              </p>
            </div>
            <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#f1f8f4] px-3.5 font-sans text-[0.72rem] font-semibold text-[#44615a]">
              All time <ChevronDown className="h-3.5 w-3.5" />
            </span>
          </div>

          <div className="mt-6 flex items-end justify-between gap-3 sm:gap-5">
            {channels.map((c, i) => {
              const height = Math.max(6, Math.round((c.value / peak) * 132));
              return (
                <div key={c.label} className="flex flex-1 flex-col items-center gap-2">
                  <span className="font-sans text-[0.7rem] font-bold text-[#44615a]">{c.value}</span>
                  <span
                    className="w-full max-w-[2.6rem] rounded-t-lg transition-all duration-500"
                    style={{
                      height: `${height}px`,
                      backgroundColor: CHANNEL_COLORS[i % CHANNEL_COLORS.length],
                      opacity: 0.92,
                    }}
                  />
                  <span className="font-sans text-[0.66rem] text-[#8ba19b]">{c.label}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#f0f6f3] pt-4">
            {[
              { label: "Security events", value: o.securityEvents },
              { label: "Certificates", value: o.certificates },
              { label: "Testimonials", value: o.testimonials },
            ].map((item) => (
              <p key={item.label} className="font-sans text-[0.74rem] text-[#7b8f89]">
                <span className="font-display text-[0.86rem] font-bold text-[#10231f]">
                  {item.value}
                </span>{" "}
                {item.label}
              </p>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-[0_16px_36px_-32px_rgba(13,71,60,0.5)] ring-1 ring-[#eef5f1] sm:p-6">
          <h3 className="font-display text-[1.05rem] font-bold text-[#10231f]">Quick Actions</h3>
          <p className="mt-0.5 font-sans text-[0.74rem] text-[#8ba19b]">
            The four things admins do most
          </p>

          <div className="mt-4 space-y-2.5">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => onOpen(action.tab)}
                  className="group flex w-full items-center gap-3 rounded-xl border border-[#eef5f1] bg-[#fbfefd] px-3.5 py-3 text-left transition-colors duration-200 hover:border-[#cfe3da] hover:bg-[#f4fbf8]"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#e4f6ee] text-[#0d6a58]">
                    <Icon className="h-[1.05rem] w-[1.05rem]" strokeWidth={1.9} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-sans text-[0.82rem] font-semibold text-[#10231f]">
                      {action.label}
                    </span>
                    <span className="block truncate font-sans text-[0.7rem] text-[#9aada7]">
                      {action.hint}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[#b9cbc4] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[#0d6a58]" />
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* ── recent courses + activity ────────────────────────────────── */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <section className="overflow-hidden rounded-2xl bg-white shadow-[0_16px_36px_-32px_rgba(13,71,60,0.5)] ring-1 ring-[#eef5f1]">
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 pb-3 pt-5">
            <h3 className="font-display text-[1.05rem] font-bold text-[#10231f]">Recent Courses</h3>
            <button
              type="button"
              onClick={() => onOpen("courses")}
              className="inline-flex items-center gap-1 font-sans text-[0.76rem] font-semibold text-[#0d6a58] hover:text-[#0a4e43]"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {data.courses.length === 0 ? (
            <div className="px-5 pb-6">
              <Empty title="No courses yet" icon={BookOpen} />
            </div>
          ) : (
            <ul className="divide-y divide-[#f2f7f4]">
              {data.courses.map((c) => (
                <li key={c.slug} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eef8f2] text-[#0d6a58]">
                    <BookOpen className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.9} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-sans text-[0.86rem] font-semibold text-[#10231f]">
                      {c.name}
                    </p>
                    <p className="truncate font-sans text-[0.7rem] text-[#9aada7]">
                      {c.duration} · Rs {c.fee.toLocaleString()}
                    </p>
                  </div>
                  <span className="hidden shrink-0 rounded-full bg-[#f1f8f4] px-2.5 py-1 font-sans text-[0.68rem] font-semibold text-[#44615a] sm:block">
                    {c.enrolled} enrolled
                  </span>
                  <Badge tone="green">Live</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-[0_16px_36px_-32px_rgba(13,71,60,0.5)] ring-1 ring-[#eef5f1] sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[1.05rem] font-bold text-[#10231f]">Recent Activity</h3>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#f1f8f4] text-[#0d6a58]">
              <Activity className="h-4 w-4" strokeWidth={2} />
            </span>
          </div>

          {data.audit.length === 0 ? (
            <div className="mt-4">
              <Empty title="No activity recorded" icon={Activity} />
            </div>
          ) : (
            <ul className="mt-4 space-y-3.5">
              {data.audit.slice(0, 6).map((a, i) => (
                <li key={a.id} className="flex gap-3">
                  <span className="mt-1 flex flex-col items-center">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor: CHANNEL_COLORS[i % 3],
                      }}
                    />
                    {i < Math.min(5, data.audit.length - 1) && (
                      <span className="mt-1 w-px flex-1 bg-[#eef5f1]" />
                    )}
                  </span>
                  <div className="min-w-0 pb-0.5">
                    <p className="truncate font-sans text-[0.8rem] font-semibold text-[#10231f]">
                      {a.action.replace(/_/g, " ")}
                    </p>
                    <p className="truncate font-sans text-[0.7rem] text-[#9aada7]">
                      {a.actor ?? "system"} · {a.target ?? "—"}
                    </p>
                    <p className="font-sans text-[0.66rem] text-[#b9cbc4]">
                      {fmtDateTime(a.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ── latest admissions ────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-2xl bg-white shadow-[0_16px_36px_-32px_rgba(13,71,60,0.5)] ring-1 ring-[#eef5f1]">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 pb-1 pt-5">
          <h3 className="font-display text-[1.05rem] font-bold text-[#10231f]">
            Latest Admissions
          </h3>
          <button
            type="button"
            onClick={() => onOpen("registrations")}
            className="inline-flex items-center gap-1 font-sans text-[0.76rem] font-semibold text-[#0d6a58] hover:text-[#0a4e43]"
          >
            Manage <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {data.registrations.length === 0 ? (
          <div className="px-5 pb-6">
            <Empty title="No registrations yet" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-left">
              <thead>
                <tr className="font-sans text-[0.66rem] uppercase tracking-[0.12em] text-[#9aada7]">
                  <th className="px-5 py-2.5 font-semibold">Student</th>
                  <th className="px-3 py-2.5 font-semibold">Ref</th>
                  <th className="px-3 py-2.5 font-semibold">Course</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f7f4]">
                {data.registrations.map((r) => (
                  <tr key={r.id} className="font-sans text-[0.8rem]">
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e4f6ee] font-display text-[0.62rem] font-extrabold text-[#0d6a58]">
                          {r.name.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="truncate font-semibold text-[#10231f]">{r.name}</span>
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono text-[0.68rem] uppercase tracking-[0.06em] text-[#7b8f89]">
                      {r.ref}
                    </td>
                    <td className="px-3 py-3 capitalize text-[#5c706a]">
                      {r.course.replace(/-/g, " ")}
                    </td>
                    <td className="px-3 py-3">
                      <Badge
                        tone={
                          r.status === "NEW" ? "amber" : r.status === "ENROLLED" ? "green" : "neutral"
                        }
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right text-[0.72rem] text-[#9aada7]">
                      {fmtDate(r.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── recent testimonials ──────────────────────────────────────── */}
      <section className="rounded-2xl bg-white p-5 shadow-[0_16px_36px_-32px_rgba(13,71,60,0.5)] ring-1 ring-[#eef5f1] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-[1.05rem] font-bold text-[#10231f]">
            Recent Testimonials
          </h3>
          <button
            type="button"
            onClick={() => onOpen("testimonials")}
            className="inline-flex items-center gap-1 font-sans text-[0.76rem] font-semibold text-[#0d6a58] hover:text-[#0a4e43]"
          >
            Manage <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {data.testimonials.length === 0 ? (
          <div className="mt-4">
            <Empty title="No published stories yet" icon={Sparkles} />
          </div>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {data.testimonials.map((t) => (
              <figure key={t.id} className="rounded-xl bg-[#fbfefd] p-4 ring-1 ring-[#eef5f1]">
                <div className="flex items-center gap-1 text-[#f5c542]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5"
                      strokeWidth={1.6}
                      fill={i < t.rating ? "currentColor" : "none"}
                      opacity={i < t.rating ? 1 : 0.35}
                    />
                  ))}
                </div>
                <blockquote className="mt-2 line-clamp-3 font-sans text-[0.8rem] leading-relaxed text-[#48625b]">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-3 flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[#e4f6ee] font-display text-[0.6rem] font-extrabold text-[#0d6a58]">
                    {t.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-sans text-[0.78rem] font-semibold text-[#10231f]">
                      {t.name}
                    </span>
                    <span className="block truncate font-sans text-[0.68rem] text-[#9aada7]">
                      {t.course || t.role}
                    </span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ──────────────────────────────── security ─────────────────────────────── */

interface AttackEvent {
  id: string;
  key: string;
  kind: string;
  path: string;
  blockedUntil: string | null;
  createdAt: string;
}

export function SecuritySection() {
  const { data, loading, error } = useApi<{ events: AttackEvent[]; total: number }>(
    "/api/security/event"
  );
  const rows = data?.events ?? [];

  return (
    <Card>
      <SectionHead
        title="Security shield"
        hint={`Blocked probes persisted by the edge guard${data ? ` · ${data.total} total` : ""}.`}
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 font-mono text-[0.56rem] font-bold uppercase tracking-[0.12em] text-emerald-700">
            <Shield className="h-3 w-3" /> Active
          </span>
        }
      />
      {loading && <Loading />}
      {error && <div className="p-5"><ErrorNote>{error}</ErrorNote></div>}
      {!loading && rows.length === 0 && (
        <Empty
          title="No attacks recorded"
          hint="XSS, SQL injection, traversal and recon probes are blocked and counted here."
          icon={ShieldAlert}
        />
      )}
      {rows.length > 0 && (
        <ul className="divide-y divide-line">
          {rows.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-coral/[0.08] text-coral-deep">
                <ShieldAlert className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink">{e.kind}</p>
                <p className="truncate font-mono text-[0.6rem] text-ink-3">{e.path || "—"}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[0.6rem] text-ink-2">{e.key}</p>
                <p className="text-[0.58rem] text-ink-3">{fmtDateTime(e.createdAt)}</p>
              </div>
              {e.blockedUntil && <Badge tone="red">Blocked</Badge>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ──────────────────────────────── settings ─────────────────────────────── */

interface AcademySettings {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  whatsapp: string;
  city: string;
  address: string;
}

interface StatsSettings {
  learners: number;
  batches: number;
  rating: number;
  satisfaction: number;
  teachers: number;
}

const blankAcademy: AcademySettings = {
  name: "Language Hub",
  tagline: "",
  email: "",
  phone: "",
  whatsapp: "",
  city: "",
  address: "",
};

const blankStats: StatsSettings = {
  learners: 0,
  batches: 0,
  rating: 0,
  satisfaction: 0,
  teachers: 0,
};

export function SettingsSection() {
  const { data, loading, error, reload } = useApi<{
    settings: Record<string, unknown>;
  }>("/api/admin/settings");

  const system = useApi<{
    database: { remote: boolean; up: boolean };
    blog: { published: number; live: boolean };
    accessCode: boolean;
  }>("/api/admin/system");

  const database = system.data?.database ?? { remote: false, up: false };
  const blog = system.data?.blog ?? { published: 0, live: false };

  const [academy, setAcademy] = useState<AcademySettings>(blankAcademy);
  const [stats, setStats] = useState<StatsSettings>(blankStats);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const academyFromData = useMemo<AcademySettings>(() => {
    const a = data?.settings["site.academy"];
    return a && typeof a === "object"
      ? ({ ...blankAcademy, ...(a as Partial<AcademySettings>) } as AcademySettings)
      : blankAcademy;
  }, [data]);

  const statsFromData = useMemo<StatsSettings>(() => {
    const s = data?.settings["site.stats"];
    return s && typeof s === "object"
      ? ({ ...blankStats, ...(s as Partial<StatsSettings>) } as StatsSettings)
      : blankStats;
  }, [data]);

  // One-time hydration of the editable form from the API response. Runs once
  // when `data` loads, then stays stable — no cascading render.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAcademy(academyFromData);
    setStats(statsFromData);
  }, [academyFromData, statsFromData]);

  const save = async (section: "academy" | "stats") => {
    setBusy(section);
    setSaveError(null);
    setNote(null);
    try {
      await api("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(section === "academy" ? { academy } : { stats }),
      });
      setNote(section === "academy" ? "Academy profile saved." : "Public figures saved.");
      reload();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save the settings.");
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <Loading label="Loading settings…" />;
  if (error) return <ErrorNote>{error}</ErrorNote>;

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card>
        <SectionHead
          title="Academy profile"
          hint="Shown on the public Contact page and in the academy's structured data."
          action={<Settings2 className="h-4 w-4 text-ink-3" />}
        />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save("academy");
          }}
          className="space-y-3 p-5"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <Label>Academy name</Label>
              <Input
                value={academy.name}
                onChange={(e) => setAcademy({ ...academy, name: e.target.value })}
              />
            </label>
            <label className="block">
              <Label>Tagline</Label>
              <Input
                value={academy.tagline}
                onChange={(e) => setAcademy({ ...academy, tagline: e.target.value })}
              />
            </label>
            <label className="block">
              <Label>Public email</Label>
              <Input
                type="email"
                value={academy.email}
                onChange={(e) => setAcademy({ ...academy, email: e.target.value })}
              />
            </label>
            <label className="block">
              <Label>Phone</Label>
              <Input
                value={academy.phone}
                onChange={(e) => setAcademy({ ...academy, phone: e.target.value })}
              />
            </label>
            <label className="block">
              <Label>WhatsApp</Label>
              <Input
                value={academy.whatsapp}
                onChange={(e) => setAcademy({ ...academy, whatsapp: e.target.value })}
                placeholder="+92 300 0000000"
              />
            </label>
            <label className="block">
              <Label>City</Label>
              <Input
                value={academy.city}
                onChange={(e) => setAcademy({ ...academy, city: e.target.value })}
              />
            </label>
          </div>
          <label className="block">
            <Label>Address</Label>
            <Input
              value={academy.address}
              onChange={(e) => setAcademy({ ...academy, address: e.target.value })}
            />
          </label>
          <div className="flex items-center gap-3 pt-1">
            <PrimaryButton type="submit" disabled={busy !== null}>
              {busy === "academy" ? "Saving…" : "Save profile"}
            </PrimaryButton>
            {note && <span className="text-xs font-semibold text-brand-deep">{note}</span>}
          </div>
        </form>
      </Card>

      <Card>
        <SectionHead
          title="Public figures"
          hint="The headline numbers on the homepage. Keep them honest."
          action={<Eye className="h-4 w-4 text-ink-3" />}
        />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save("stats");
          }}
          className="space-y-3 p-5"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <Label>Learners taught</Label>
              <Input
                type="number"
                min={0}
                value={stats.learners}
                onChange={(e) => setStats({ ...stats, learners: Number(e.target.value) })}
              />
            </label>
            <label className="block">
              <Label>Batches run</Label>
              <Input
                type="number"
                min={0}
                value={stats.batches}
                onChange={(e) => setStats({ ...stats, batches: Number(e.target.value) })}
              />
            </label>
            <label className="block">
              <Label>Average rating</Label>
              <Input
                type="number"
                min={0}
                max={5}
                step="0.1"
                value={stats.rating}
                onChange={(e) => setStats({ ...stats, rating: Number(e.target.value) })}
              />
            </label>
            <label className="block">
              <Label>Satisfaction (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={stats.satisfaction}
                onChange={(e) => setStats({ ...stats, satisfaction: Number(e.target.value) })}
              />
            </label>
            <label className="block">
              <Label>Teachers</Label>
              <Input
                type="number"
                min={0}
                value={stats.teachers}
                onChange={(e) => setStats({ ...stats, teachers: Number(e.target.value) })}
              />
            </label>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <PrimaryButton type="submit" disabled={busy !== null}>
              {busy === "stats" ? "Saving…" : "Save figures"}
            </PrimaryButton>
            {note && <span className="text-xs font-semibold text-brand-deep">{note}</span>}
          </div>
          {saveError && <ErrorNote>{saveError}</ErrorNote>}
        </form>
      </Card>

      <Card className="xl:col-span-2">
        <SectionHead title="Environment" hint="Read-only configuration state" />
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Database",
              value: database.remote ? "PostgreSQL (Neon)" : "PostgreSQL (PGlite)",
              icon: Activity,
              ok: database.up,
            },
            {
              label: "Admin second factor",
              value: system.data?.accessCode ? "Access code configured" : "Access code missing",
              icon: Shield,
              ok: Boolean(system.data?.accessCode),
            },
            { label: "Audit trail", value: "Every mutation logged", icon: ClipboardList, ok: true },
            {
              label: "Public blog",
              value: blog.live ? `${blog.published} published` : "No published posts",
              icon: BookOpen,
              ok: blog.live,
            },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-line bg-cream/50 p-3.5">
              <p className="flex items-center gap-1.5 font-mono text-[0.55rem] font-bold uppercase tracking-[0.14em] text-ink-3">
                <item.icon className="h-3 w-3" /> {item.label}
              </p>
              <p className="mt-1.5 text-sm font-bold text-ink">{item.value}</p>
              <Badge tone={item.ok ? "green" : "neutral"}>{item.ok ? "Healthy" : "Idle"}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
