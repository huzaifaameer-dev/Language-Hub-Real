"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Archive,
  Check,
  ChevronDown,
  Download,
  Eye,
  Mail,
  MessageSquareQuote,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLiveSync } from "@/lib/use-live";
import {
  FEEDBACK_CATEGORIES,
} from "@/lib/validate";
import { AvatarInitial, FilterChips, Pager, SearchBox, SectionTitle, downloadCsv } from "./ui";
import type { FeedbackStatus } from "@/lib/db";

type Filter = "ALL" | FeedbackStatus;

interface FeedbackRow {
  id: string;
  name: string;
  email: string | null;
  userId: string | null;
  category: (typeof FEEDBACK_CATEGORIES)[number];
  rating: number;
  subject: string;
  message: string;
  contactOk: boolean;
  status: FeedbackStatus;
  adminNote: string | null;
  createdAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  courses: "Courses",
  teaching: "Teaching",
  website: "Website",
  billing: "Fees",
  suggestion: "Suggestion",
  general: "General",
};

const ease = [0.16, 1, 0.3, 1] as const;
const PAGE_SIZE = 12;

export function AdminFeedback() {
  const [items, setItems] = useState<FeedbackRow[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const lastRefresh = useRef(0);
  const inflight = useRef(false);

  const fetchAll = useCallback(() => {
    const now = Date.now();
    if (inflight.current || now - lastRefresh.current < 2000) return;
    inflight.current = true;
    lastRefresh.current = now;
    fetch("/api/admin/feedback", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.items)) {
          setItems(data.items as FeedbackRow[]);
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

  const setStatus = async (row: FeedbackRow, status: FeedbackStatus) => {
    setBusy(row.id);
    try {
      const res = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, status, adminNote: notes[row.id] ?? null }),
      });
      if (res.ok) {
        setItems((prev) => prev.map((f) => (f.id === row.id ? { ...f, status, adminNote: notes[row.id] ?? f.adminNote } : f)));
        void fetchAll();
      }
    } finally {
      setBusy(null);
    }
  };

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((f) => {
      if (filter !== "ALL" && f.status !== filter) return false;
      if (!q) return true;
      const hay = `${f.name} ${f.email ?? ""} ${f.subject} ${f.message} ${f.category} ${CATEGORY_LABELS[f.category]}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, filter, query]);

  const totalPages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const pageIdx = Math.min(page, totalPages);
  const visible = matches.slice((pageIdx - 1) * PAGE_SIZE, pageIdx * PAGE_SIZE);
  const newCount = items.filter((f) => f.status === "NEW").length;
  const avg = items.length ? (items.reduce((s, f) => s + f.rating, 0) / items.length).toFixed(1) : "—";

  const exportCsv = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(
      `lh-feedback-${stamp}.csv`,
      ["Name", "Email", "Category", "Rating", "Subject", "Message", "Status", "Reply note", "Contact ok", "Created at"],
      matches.map((f) => [
        f.name,
        f.email ?? "",
        f.category,
        f.rating,
        f.subject,
        f.message,
        f.status,
        f.adminNote ?? "",
        f.contactOk ? "yes" : "no",
        new Date(f.createdAt).toISOString(),
      ])
    );
  };

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionTitle kicker="Voices · listening" title="Feedback Inbox" />
        <div className="flex items-center gap-2 rounded-2xl border border-ink/12 bg-white/70 px-4 py-2 backdrop-blur-md">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-amber-500/15 text-amber-600">
            <Star className="h-4 w-4 fill-current" />
          </span>
          <div className="leading-tight">
            <p className="font-display text-[0.8rem] font-extrabold text-ink">{avg} avg</p>
            <p className="font-mono text-[0.52rem] uppercase tracking-widest text-ink-3">rating</p>
          </div>
        </div>
        <FilterChips<Filter>
          options={[
            { key: "ALL", label: "ALL", count: items.length },
            { key: "NEW", label: "NEW", count: items.filter((f) => f.status === "NEW").length },
            { key: "REVIEWED", label: "REVIEWED", count: items.filter((f) => f.status === "REVIEWED").length },
            { key: "ARCHIVED", label: "ARCHIVED", count: items.filter((f) => f.status === "ARCHIVED").length },
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
          placeholder="Search name, email, subject, message…"
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
          <p className="mt-4 font-mono text-[0.72rem] text-ink-3">Loading feedback…</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="glass-dash grid place-items-center overflow-hidden rounded-[1.75rem] px-6 py-16 text-center">
          <p className="font-display text-4xl font-extrabold text-slate-200">∅</p>
          <p className="mt-3 font-display text-[0.95rem] font-bold text-ink-2">No feedback here</p>
          <p className="font-mono text-[0.7rem] text-ink-3">Incoming notes from /feedback and the dashboard will appear live.</p>
        </div>
      ) : (
        visible.map((f, i) => {
          const open = expanded === f.id;
          const isNew = f.status === "NEW";
          return (
            <motion.article
              key={f.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, ease, delay: Math.min(0.12, i * 0.03) }}
              className={cn(
                "glass-dash relative overflow-hidden rounded-[1.4rem] transition-all duration-300",
                open ? "ring-2 ring-brand/60" : "hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-20px_rgb(110_90_224/0.4)]",
                f.status === "ARCHIVED" && "opacity-60"
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute left-0 top-0 h-full w-1 bg-gradient-to-b transition-opacity",
                  isNew ? "from-amber-500/90 to-brand opacity-100" : "opacity-0"
                )}
              />
              <button
                type="button"
                onClick={() => setExpanded(open ? null : f.id)}
                className="flex w-full flex-wrap items-center gap-4 px-5 py-4 text-start"
              >
                <AvatarInitial name={f.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 pr-8">
                    <h3 className="font-display text-[1rem] font-extrabold text-ink">{f.subject}</h3>
                    <span className="rounded-full border border-brand/20 bg-brand/8 px-2.5 py-0.5 font-mono text-[0.6rem] font-bold text-brand-deep">
                      {CATEGORY_LABELS[f.category] ?? f.category}
                    </span>
                    <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className={cn("h-3 w-3", n <= f.rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200")} />
                      ))}
                    </span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[0.66rem] text-ink-3">
                    <span>{f.name}</span>
                    {f.email ? <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{f.email}</span> : null}
                    <span>{new Date(f.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
                <span className="ml-auto flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[0.58rem] font-bold tracking-widest",
                      f.status === "NEW"
                        ? "border-amber-300 bg-amber-50 text-amber-700"
                        : f.status === "REVIEWED"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "border-slate-300 bg-slate-100 text-slate-500"
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", f.status === "NEW" ? "bg-amber-500" : f.status === "REVIEWED" ? "bg-emerald-500" : "bg-slate-400")} />
                    {f.status}
                  </span>
                  <ChevronDown className={cn("h-4 w-4 text-ink-3 transition-transform", open && "rotate-180")} />
                </span>
              </button>

              {open ? (
                <div className="relative border-t border-white/70 px-5 py-4">
                  <div className="flex flex-wrap items-start gap-3 rounded-xl border border-brand/12 bg-brand/8/60 p-3.5">
                    <MessageSquareQuote className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-[0.55rem] font-bold uppercase tracking-[0.24em] text-brand/80">Feedback</p>
                      <p className="mt-1 text-[0.9rem] leading-relaxed text-ink-2">{f.message}</p>
                    </div>
                  </div>

                  {f.adminNote ? (
                    <p className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5 font-display text-[0.88rem] text-emerald-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span>
                        <span className="mr-2 font-display text-[0.55rem] font-bold uppercase tracking-[0.24em] text-emerald-500">Reply note</span>
                        {f.adminNote}
                      </span>
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-col gap-3 border-t border-white/70 pt-4 sm:flex-row sm:items-center">
                    <input
                      value={notes[f.id] ?? ""}
                      onChange={(e) => setNotes((n) => ({ ...n, [f.id]: e.target.value }))}
                      placeholder="Reply note (kept for your records)…"
                      className="flex-1 rounded-xl border border-ink/12 bg-white/70 px-4 py-2.5 font-display text-[0.85rem] text-ink outline-none transition-all backdrop-blur-md placeholder:text-ink-3/70 focus:border-brand focus:ring-4 focus:ring-brand/80/15"
                    />
                    <div className="flex flex-wrap gap-2">
                      {f.contactOk && f.email ? (
                        <a
                          href={`mailto:${f.email}?subject=${encodeURIComponent(`Re your feedback: ${f.subject}`)}`}
                          className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/70 px-4 py-2.5 font-display text-[0.72rem] font-bold text-indigo-700 transition-all hover:-translate-y-0.5 hover:bg-indigo-50"
                        >
                          <Mail className="h-3.5 w-3.5" /> Reply
                        </a>
                      ) : null}
                      <button
                        type="button"
                        disabled={busy === f.id || f.status === "REVIEWED"}
                        onClick={() => setStatus(f, "REVIEWED")}
                        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 font-display text-[0.72rem] font-bold text-white shadow-[0_10px_24px_-12px_rgb(16_185_129/0.7)] transition-all hover:brightness-110 disabled:opacity-50"
                      >
                        {busy === f.id ? <Spin /> : <Eye className="h-3.5 w-3.5" />} Mark reviewed
                      </button>
                      <button
                        type="button"
                        disabled={busy === f.id || f.status === "ARCHIVED"}
                        onClick={() => setStatus(f, "ARCHIVED")}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2.5 font-display text-[0.72rem] font-bold text-slate-600 transition-all hover:-translate-y-0.5 hover:bg-slate-50 disabled:opacity-50"
                      >
                        {busy === f.id ? <Spin dark /> : <Archive className="h-3.5 w-3.5" />} Archive
                      </button>
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
          {newCount} new feedback item{newCount === 1 ? "" : "s"} awaiting review — aim to reply within 24h
        </p>
      ) : null}

      {matches.length > 0 ? (
        <Pager page={pageIdx} pageSize={PAGE_SIZE} total={matches.length} onPage={setPage} />
      ) : null}
    </section>
  );
}

function Spin({ dark }: { dark?: boolean }) {
  return (
    <span
      className={cn(
        "h-3.5 w-3.5 animate-spin rounded-full border-2",
        dark ? "border-slate-300 border-t-slate-500" : "border-white/30 border-t-white"
      )}
      aria-hidden
    />
  );
}