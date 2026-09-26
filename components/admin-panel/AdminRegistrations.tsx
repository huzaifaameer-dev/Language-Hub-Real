"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  ChevronDown,
  Download,
  Eye,
  FileText,
  GraduationCap,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLiveSync } from "@/lib/use-live";
import { REGISTRATION_COURSES_BY_KEY, PAYMENT_ACCOUNTS, type RegistrationOption } from "@/lib/registration-config";
import { AvatarInitial, FilterChips, Pager, SearchBox, SectionTitle, StatusPill, downloadCsv } from "./ui";
import type { AdminRegistration, AdminRegistrationStatus } from "./types";

type Filter = "ALL" | AdminRegistrationStatus;

const ease = [0.16, 1, 0.3, 1] as const;
const PAGE_SIZE = 15;

function label(options: RegistrationOption[] | undefined, value: string | undefined): string {
  if (!value) return "—";
  return options?.find((o) => o.value === value)?.label ?? value;
}

/** Media URL for a registration's photo / receipt / pdf (auth-guarded). */
function mediaUrl(reg: AdminRegistration, field: "photo" | "receipt" | "pdf"): string {
  return `/api/registrations/media/${reg.id}?field=${field}`;
}

export function AdminRegistrations({ initial }: { initial?: AdminRegistration[] }) {
  const [items, setItems] = useState<AdminRegistration[]>(initial ?? []);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
const [loaded, setLoaded] = useState((initial?.length ?? 0) > 0);

  // Throttle live refreshes — a burst of events shouldn't spam the queue API.
  const lastRefresh = useRef(0);
  const inflight = useRef(false);

  const fetchAll = useCallback(() => {
    const now = Date.now();
    if (inflight.current || now - lastRefresh.current < 2000) return;
    inflight.current = true;
    lastRefresh.current = now;
    fetch("/api/admin/registrations", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.registrations)) {
          setItems(data.registrations as AdminRegistration[]);
          setLoaded(true);
        }
      })
      .catch(() => {})
      .finally(() => {
        inflight.current = false;
      });
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useLiveSync(() => fetchAll());

  const updateStatus = async (reg: AdminRegistration, status: AdminRegistrationStatus) => {
    setBusy(reg.id);
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reg.id, status, message: replies[reg.id] ?? "" }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((r) =>
            r.id === reg.id ? { ...r, status, adminMessage: (replies[reg.id] || r.adminMessage) ?? null } : r
          )
        );
        void fetchAll();
      }
    } finally {
      setBusy(null);
    }
  };

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((r) => {
      if (filter !== "ALL" && r.status !== filter) return false;
      if (!q) return true;
      const cfg = REGISTRATION_COURSES_BY_KEY[r.courseKey];
      const focus = (r.study.focusModules ?? [])
        .map((v) => label(cfg?.focusOptions, v))
        .join(" ");
      const hay = `${r.name} ${r.email} ${r.ref} ${r.course} ${r.phone} ${r.address} ${focus} ${r.study.preferredTime} ${r.study.level} ${r.payment.method} ${r.status}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, filter, query]);

  const totalPages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const pageIdx = Math.min(page, totalPages);
  const visible = matches.slice((pageIdx - 1) * PAGE_SIZE, pageIdx * PAGE_SIZE);
  const newCount = items.filter((r) => r.status === "NEW").length;

  const exportCsv = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(
      `lh-registrations-${stamp}.csv`,
      ["Ref", "Name", "Email", "Course", "Phone", "Address", "DOB", "Qualification", "Institution", "Year", "Study time", "Modules", "Level", "Hours/week", "Heard via", "Payment method", "Status", "PDF", "Created at"],
      matches.map((r) => [
        r.ref,
        r.name,
        r.email,
        r.course,
        r.phone,
        r.address,
        r.dob,
        r.education.qualification,
        r.education.institution,
        r.education.yearOfPassing,
        r.study.preferredTime,
        r.study.focusModules.join("; "),
        r.study.level,
        r.study.hoursPerWeek,
        r.study.heardAbout,
        r.payment.method,
        r.status,
        r.pdfAttached ? "yes" : "no",
        new Date(r.createdAt).toISOString(),
      ])
    );
  };

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionTitle kicker="Intake · registration desk" title="Course Registrations" />
        <FilterChips<Filter>
          options={[
            { key: "ALL", label: "ALL", count: items.length },
            { key: "NEW", label: "NEW", count: items.filter((r) => r.status === "NEW").length },
            { key: "CONTACTED", label: "CONTACTED", count: items.filter((r) => r.status === "CONTACTED").length },
            { key: "ENROLLED", label: "ENROLLED", count: items.filter((r) => r.status === "ENROLLED").length },
          ]}
          value={filter}
          onChange={(f) => {
            setFilter(f);
            setPage(1);
          }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchBox
          value={query}
          onChange={(q) => {
            setQuery(q);
            setPage(1);
          }}
          placeholder="Search name, email, ref, course, phone, module…"
        />
        <button
          type="button"
          onClick={exportCsv}
          disabled={matches.length === 0}
          className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/8 px-4 py-2.5 font-display text-[0.72rem] font-bold text-brand-deep transition-all hover:-translate-y-0.5 hover:bg-brand/12 disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>

      {!loaded ? (
        <div className="glass-dash grid place-items-center overflow-hidden rounded-[1.75rem] px-6 py-20 text-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand/25 border-t-brand-deep" />
          <p className="mt-4 font-mono text-[0.72rem] text-ink-3">Loading registrations…</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="glass-dash grid place-items-center overflow-hidden rounded-[1.75rem] px-6 py-16 text-center">
          <p className="font-display text-4xl font-extrabold text-slate-200">∅</p>
          <p className="mt-3 font-display text-[0.95rem] font-bold text-ink-2">No registrations here</p>
          <p className="font-mono text-[0.7rem] text-ink-3">New course registrations will stream in live.</p>
        </div>
      ) : (
        visible.map((r, i) => {
          const open = expanded === r.id;
          const isNew = r.status === "NEW";
          const next: AdminRegistrationStatus | null =
            r.status === "NEW" ? "CONTACTED" : r.status === "CONTACTED" ? "ENROLLED" : null;
          const cfg = REGISTRATION_COURSES_BY_KEY[r.courseKey];
          return (
            <motion.article
              key={r.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease, delay: Math.min(0.12, i * 0.03) }}
              className={cn(
                "glass-dash relative overflow-hidden rounded-[1.5rem] transition-all duration-300",
                open ? "ring-2 ring-brand/60" : "hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-20px_rgb(110_90_224/0.4)]"
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute left-0 top-0 h-full w-1 bg-gradient-to-b transition-opacity",
                  isNew ? "from-brand/80 to-brand-deep opacity-100" : "opacity-0"
                )}
              />
              {isNew ? (
                <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-brand-deep to-brand-magenta px-2.5 py-0.5 font-mono text-[0.55rem] font-black uppercase tracking-widest text-white shadow-lg">
                  <span className="h-1 w-1 animate-pulse rounded-full bg-white" /> New
                </span>
              ) : null}

              <button
                type="button"
                onClick={() => setExpanded(open ? null : r.id)}
                className="flex w-full flex-wrap items-center gap-4 px-5 py-4 text-start"
              >
                <AvatarInitial name={r.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 pr-10 sm:pr-16">
                    <h3 className="font-display text-[1.02rem] font-extrabold text-ink">{r.name}</h3>
                    <span className="rounded-full border border-brand/20 bg-brand/8 px-2.5 py-0.5 font-mono text-[0.6rem] font-bold text-brand-deep">
                      {r.course}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white/70 px-2.5 py-0.5 font-mono text-[0.6rem] font-bold text-ink-3">
                      {r.ref}
                    </span>
                  </div>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[0.68rem] text-ink-3">
                    <span className="inline-flex items-center gap-1">{r.email}</span>
                    <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{r.phone}</span>
                    <span className="inline-flex items-center gap-1">
                      {new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </p>
                </div>
                <span className="ml-auto flex items-center gap-2">
                  <StatusPill status={r.status} />
                  <ChevronDown className={cn("h-4 w-4 text-ink-3 transition-transform", open && "rotate-180")} />
                </span>
              </button>

              {open ? (
                <div className="relative border-t border-white/70 px-5 py-5">
                  <div className="grid gap-5 lg:grid-cols-[9rem_1fr]">
                    {/* Photo + proof column */}
                    <div className="flex flex-col gap-3">
                      <button
                        type="button"
                        onClick={() => window.open(mediaUrl(r, "photo"), "_blank")}
                        className="group relative block overflow-hidden rounded-2xl border border-ink/10 bg-white/60 shadow-inner"
                        title="Open student photo"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={mediaUrl(r, "photo")} alt={`${r.name}`} className="aspect-[3/4] w-full object-cover" />
                        <span className="absolute inset-0 grid place-items-center bg-slate-900/0 text-white opacity-0 transition-all group-hover:bg-slate-900/40 group-hover:opacity-100">
                          <Eye className="h-5 w-5" />
                        </span>
                      </button>
                      {r.pdfAttached ? (
                        <a
                          href={mediaUrl(r, "pdf")}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand/25 bg-brand/8 px-3 py-2 font-display text-[0.7rem] font-bold text-brand-deep transition-all hover:-translate-y-0.5 hover:bg-brand/12"
                        >
                          <FileText className="h-4 w-4" /> PDF summary
                        </a>
                      ) : null}
                      <a
                        href={`mailto:${r.email}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 font-display text-[0.7rem] font-bold text-ink-2 transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-600"
                      >
                        <Mail className="h-4 w-4" /> Email
                      </a>
                      <a
                        href={`https://wa.me/${r.phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(`Assalam o alaikum ${r.name}! We received your ${r.course} registration (${r.ref}) on Language Hub.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50/70 px-3 py-2 font-display text-[0.7rem] font-bold text-emerald-700 transition-all hover:-translate-y-0.5 hover:bg-emerald-100"
                      >
                        <MessageCircle className="h-4 w-4" /> WhatsApp
                      </a>
                    </div>

                    {/* Details column */}
                    <div className="min-w-0 space-y-5">
                      <InfoGrid
                        title="Student details"
                        fields={[
                          ["Email", r.email],
                          ["Date of birth", r.dob],
                          ["Phone", r.phone],
                          ["Address", r.address],
                        ]}
                      />
                      <InfoGrid
                        title="Academic background"
                        fields={[
                          ["Highest qualification", r.education.qualification],
                          ["Institution", r.education.institution],
                          ["Year of passing", r.education.yearOfPassing],
                        ]}
                      />
                      <InfoGrid
                        title="Study preferences"
                        fields={[
                          ["Preferred study time", label(cfg?.preferredTimeOptions, r.study.preferredTime)],
                          ["Modules to enhance", (r.study.focusModules ?? []).map((v) => label(cfg?.focusOptions, v)).join(", ") || "—"],
                          ["Current level", label(cfg?.levelOptions, r.study.level)],
                          ["Hours per week", label(cfg?.hoursOptions, r.study.hoursPerWeek)],
                          ["Heard about via", label(cfg?.heardOptions, r.study.heardAbout)],
                          ...(r.study.extras ? [["Extra", r.study.extras] as [string, string]] : []),
                        ]}
                      />
                      <InfoGrid
                        title="Fee & payment"
                        fields={[
                          ["Method", r.payment.method],
                          ...(r.payment.receiptName ? [["Receipt uploaded", r.payment.receiptName] as [string, string]] : []),
                          ...(r.payment.note ? [["Payment note", r.payment.note] as [string, string]] : []),
                        ]}
                      />

                      {/* Payment accounts callout */}
                      <div className="grid gap-3 sm:grid-cols-2">
                        {Object.values(PAYMENT_ACCOUNTS).map((acct) => (
                          <div key={acct.label} className="rounded-2xl border border-brand/12 bg-brand/8/40 p-4">
                            <p className="font-display text-[0.58rem] font-black uppercase tracking-[0.24em] text-brand-deep">
                              {acct.label}
                            </p>
                            <div className="mt-2 space-y-1">
                              {acct.rows.map((row) => (
                                <p key={row.label} className="font-mono text-[0.72rem] text-ink-2">
                                  <span className="text-ink-3">{row.label}:</span> <b>{row.value}</b>
                                </p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Receipt preview */}
                      {r.payment.receiptName ? (
                        <div className="rounded-2xl border border-slate-200 bg-white/60 p-4">
                          <p className="font-display text-[0.58rem] font-black uppercase tracking-[0.24em] text-ink-3">
                            Payment receipt
                          </p>
                          {r.payment.receiptName?.toLowerCase().endsWith(".pdf") ? (
                            <a
                              href={mediaUrl(r, "receipt")}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50/70 px-3 py-2 font-display text-[0.72rem] font-bold text-rose-700 transition-all hover:-translate-y-0.5 hover:bg-rose-100"
                            >
                              <FileText className="h-4 w-4" /> Open receipt PDF
                            </a>
                          ) : (
                            <a href={mediaUrl(r, "receipt")} target="_blank" rel="noopener noreferrer" className="mt-2 block overflow-hidden rounded-xl border border-ink/10">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={mediaUrl(r, "receipt")} alt="Payment receipt" className="max-h-40 w-full object-contain bg-white" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/40 p-4">
                          <p className="font-display text-[0.58rem] font-black uppercase tracking-[0.24em] text-amber-600">
                            No receipt uploaded
                          </p>
                          <p className="mt-1 font-mono text-[0.7rem] text-amber-700/80">
                            Follow up with {r.name} for the payment proof.
                          </p>
                        </div>
                      )}

                      {r.adminMessage ? (
                        <p className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 font-display text-[0.88rem] text-emerald-700">
                          <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          <span>
                            <span className="mr-2 font-display text-[0.55rem] font-bold uppercase tracking-[0.24em] text-emerald-500">Admin note</span>
                            {r.adminMessage}
                          </span>
                        </p>
                      ) : null}

                      {next ? (
                        <div className="flex flex-col gap-3 border-t border-white/70 pt-4 sm:flex-row sm:items-center">
                          <input
                            value={replies[r.id] ?? ""}
                            onChange={(e) => setReplies((x) => ({ ...x, [r.id]: e.target.value }))}
                            placeholder={
                              next === "ENROLLED"
                                ? "Enrollment confirmation message (student sees it)…"
                                : "Contact message (student sees it)…"
                            }
                            className="flex-1 rounded-xl border border-ink/12 bg-white/70 px-4 py-2.5 font-display text-[0.85rem] text-ink outline-none transition-all backdrop-blur-md placeholder:text-ink-3/70 focus:border-brand focus:ring-4 focus:ring-brand/80/15"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => updateStatus(r, "CONTACTED")}
                              disabled={busy === r.id || r.status === "ENROLLED"}
                              className="inline-flex items-center gap-2 rounded-full border border-sky-300 bg-white/70 px-5 py-2.5 font-display text-[0.76rem] font-bold text-sky-700 transition-all hover:-translate-y-0.5 hover:bg-sky-50 disabled:opacity-40"
                            >
                              {busy === r.id && r.status !== "ENROLLED" ? <Spin /> : <MessageCircle className="h-4 w-4" />} Mark contacted
                            </button>
                            <button
                              type="button"
                              onClick={() => updateStatus(r, "ENROLLED")}
                              disabled={busy === r.id || r.status === "ENROLLED"}
                              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-deep to-brand-deep px-5 py-2.5 font-display text-[0.78rem] font-extrabold text-white shadow-[0_14px_30px_-12px_rgb(110_90_224/0.8)] transition-all hover:brightness-110 disabled:opacity-50"
                            >
                              {busy === r.id && r.status !== "ENROLLED" ? <Spin dark /> : <GraduationCap className="h-4 w-4" />}
                              {r.status === "CONTACTED" ? "Confirm enrollment" : "Enroll now"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="flex items-center gap-2 border-t border-white/70 pt-4 font-mono text-[0.7rem] uppercase tracking-widest text-emerald-600">
                          <ShieldCheck className="h-4 w-4" /> Enrollment confirmed — follow your normal onboarding.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </motion.article>
          );
        })
      )}

      {newCount > 0 ? (
        <p className="font-mono text-[0.62rem] uppercase tracking-widest text-amber-600">
          {newCount} new registration{newCount === 1 ? "" : "s"} awaiting review — reply within 24h
        </p>
      ) : null}

      {matches.length > 0 ? (
        <Pager page={pageIdx} pageSize={PAGE_SIZE} total={matches.length} onPage={setPage} />
      ) : null}
    </section>
  );
}

function InfoGrid({ title, fields }: { title: string; fields: Array<[string, string]> }) {
  return (
    <div>
      <p className="flex items-center gap-2 font-display text-[0.58rem] font-black uppercase tracking-[0.26em] text-ink-3">
        {title}
      </p>
      <dl className="mt-2 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {fields.map(([k, v]) => (
          <div key={k} className="min-w-0 border-b border-white/60 pb-1.5">
            <dt className="font-mono text-[0.58rem] uppercase tracking-widest text-ink-3">{k}</dt>
            <dd className="truncate font-display text-[0.86rem] font-bold text-ink" title={v}>
              {v || "—"}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Spin({ dark }: { dark?: boolean }) {
  return (
    <span
      className={cn(
        "h-3.5 w-3.5 animate-spin rounded-full border-2",
        dark ? "border-white/30 border-t-white" : "border-brand/20/50 border-t-brand-deep"
      )}
      aria-hidden
    />
  );
}