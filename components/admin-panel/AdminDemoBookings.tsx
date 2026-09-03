"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  Download,
  MessageSquareQuote,
  Phone,
  UserRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLiveSync } from "@/lib/use-live";
import { AvatarInitial, FilterChips, Pager, SearchBox, SectionTitle, StatusPill, downloadCsv } from "./ui";

type Filter = "ALL" | "PENDING" | "CONFIRMED" | "REJECTED";

interface BookingRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  course: string;
  message: string | null;
  status: "PENDING" | "CONFIRMED" | "REJECTED";
  adminMessage: string | null;
  createdAt: string;
}

const ease = [0.16, 1, 0.3, 1] as const;
const PAGE_SIZE = 15;

export function AdminDemoBookings() {
  const [items, setItems] = useState<BookingRow[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const fetchAll = useCallback<() => void>(() => {
    fetch("/api/admin/demo-bookings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.bookings)) {
          setItems(data.bookings as BookingRow[]);
          setLoaded(true);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useLiveSync(() => fetchAll());

  const decide = async (id: string, action: "CONFIRM" | "REJECT") => {
    setBusy(id);
    try {
      const res = await fetch("/api/admin/demo-bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, message: replies[id] ?? "" }),
      });
      if (res.ok) {
        const next = action === "CONFIRM" ? "CONFIRMED" : "REJECTED";
        setItems((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: next, adminMessage: replies[id] || b.adminMessage } : b))
        );
        void fetchAll();
      }
    } finally {
      setBusy(null);
    }
  };

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((b) => {
      if (filter !== "ALL" && b.status !== filter) return false;
      if (!q) return true;
      const hay = `${b.name} ${b.email} ${b.phone} ${b.course} ${b.preferredDate} ${b.preferredTime} ${b.message ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, filter, query]);

  const totalPages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const pageIdx = Math.min(page, totalPages);
  const visible = matches.slice((pageIdx - 1) * PAGE_SIZE, pageIdx * PAGE_SIZE);
  const pendingCount = items.filter((b) => b.status === "PENDING").length;

  const exportCsv = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(
      `lh-demo-bookings-${stamp}.csv`,
      ["Name", "Email", "Phone", "Course", "Date", "Time", "Message", "Status", "Admin reply", "Created at"],
      matches.map((b) => [
        b.name,
        b.email,
        b.phone,
        b.course,
        b.preferredDate,
        b.preferredTime,
        b.message ?? "",
        b.status,
        b.adminMessage ?? "",
        new Date(b.createdAt).toISOString(),
      ])
    );
  };

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionTitle kicker="Queue·demand" title="Demo Class Bookings" />
        <FilterChips<Filter>
          options={[
            { key: "ALL", label: "ALL", count: items.length },
            { key: "PENDING", label: "PENDING", count: items.filter((b) => b.status === "PENDING").length },
            { key: "CONFIRMED", label: "CONFIRMED", count: items.filter((b) => b.status === "CONFIRMED").length },
            { key: "REJECTED", label: "REJECTED", count: items.filter((b) => b.status === "REJECTED").length },
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
          placeholder="Search name, email, phone, course, date…"
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
          <p className="mt-4 font-mono text-[0.72rem] text-ink-3">Loading demo bookings…</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="glass-dash grid place-items-center overflow-hidden rounded-[1.75rem] px-6 py-16 text-center">
          <p className="font-display text-4xl font-extrabold text-slate-200">∅</p>
          <p className="mt-3 font-display text-[0.95rem] font-bold text-ink-2">No demo bookings here</p>
          <p className="font-mono text-[0.7rem] text-ink-3">Incoming requests will stream in live.</p>
        </div>
      ) : (
        visible.map((b, i) => {
          const open = expanded === b.id;
          const isPending = b.status === "PENDING";
          return (
            <motion.article
              key={b.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease, delay: Math.min(0.12, i * 0.03) }}
              className={cn(
                "glass-dash relative overflow-hidden rounded-[1.5rem] transition-all duration-300",
                open ? "ring-2 ring-brand/60" : "hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-20px_rgb(110_90_224/0.4)]",
                isPending && "animate-[glow-breathe_6s_ease-in-out_infinite]"
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute left-0 top-0 h-full w-1 bg-gradient-to-b transition-opacity",
                  isPending ? "from-brand/80 to-brand-deep opacity-100" : "opacity-0"
                )}
              />
              {isPending ? (
                <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-brand-deep to-brand-magenta px-2.5 py-0.5 font-mono text-[0.55rem] font-black uppercase tracking-widest text-white shadow-lg">
                  <span className="h-1 w-1 animate-pulse rounded-full bg-white" /> New
                </span>
              ) : null}

              <button
                type="button"
                onClick={() => setExpanded(open ? null : b.id)}
                className="flex w-full flex-wrap items-center gap-4 px-5 py-4 text-start"
              >
                <AvatarInitial name={b.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 pr-10 sm:pr-16">
                    <h3 className="font-display text-[1.02rem] font-extrabold text-ink">{b.name}</h3>
                    <span className="rounded-full border border-brand/20 bg-brand/8 px-2.5 py-0.5 font-mono text-[0.6rem] font-bold text-brand-deep">
                      {b.course}
                    </span>
                  </div>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[0.68rem] text-ink-3">
                    <span className="inline-flex items-center gap-1">{b.email}</span>
                    <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{b.phone}</span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />{b.preferredDate} · <Clock className="h-3 w-3" />{b.preferredTime}
                    </span>
                  </p>
                </div>
                <span className="ml-auto flex items-center gap-2">
                  <StatusPill status={b.status} />
                  <ChevronDown className={cn("h-4 w-4 text-ink-3 transition-transform", open && "rotate-180")} />
                </span>
              </button>

              {open ? (
                <div className="relative border-t border-white/70 px-5 py-4">
                  {b.message ? (
                    <p className="flex items-start gap-2 rounded-xl border border-brand/12 bg-brand/8/60 p-3 font-display text-[0.88rem] text-ink-2">
                      <MessageSquareQuote className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                      <span>
                        <span className="mr-2 font-display text-[0.55rem] font-bold uppercase tracking-[0.24em] text-brand/80">Note</span>
                        {b.message}
                      </span>
                    </p>
                  ) : (
                    <p className="flex items-center gap-2 font-mono text-[0.72rem] text-ink-3">
                      <UserRound className="h-4 w-4" />
                      No extra note — contact the student directly at {b.phone}.
                    </p>
                  )}
                  {b.adminMessage ? (
                    <p className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 font-display text-[0.88rem] text-emerald-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span>
                        <span className="mr-2 font-display text-[0.55rem] font-bold uppercase tracking-[0.24em] text-emerald-500">Reply</span>
                        {b.adminMessage}
                      </span>
                    </p>
                  ) : null}

                  {isPending ? (
                    <div className="mt-4 flex flex-col gap-3 border-t border-white/70 pt-4 sm:flex-row sm:items-center">
                      <input
                        value={replies[b.id] ?? ""}
                        onChange={(e) => setReplies((r) => ({ ...r, [b.id]: e.target.value }))}
                        placeholder="Confirm message (student sees this by email)…"
                        className="flex-1 rounded-xl border border-ink/12 bg-white/70 px-4 py-2.5 font-display text-[0.85rem] text-ink outline-none transition-all backdrop-blur-md placeholder:text-ink-3/70 focus:border-brand focus:ring-4 focus:ring-brand/80/15"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => decide(b.id, "CONFIRM")}
                          disabled={busy === b.id}
                          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-deep to-brand-deep px-5 py-2.5 font-display text-[0.78rem] font-extrabold text-white shadow-[0_14px_30px_-12px_rgb(110_90_224/0.8)] transition-all hover:brightness-110 disabled:opacity-50"
                        >
                          {busy === b.id ? <Spin /> : <Check className="h-4 w-4" />} Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => decide(b.id, "REJECT")}
                          disabled={busy === b.id}
                          className="inline-flex items-center gap-2 rounded-full border border-rose-300 bg-white/60 px-5 py-2.5 font-display text-[0.78rem] font-bold text-rose-600 transition-all hover:bg-rose-50 disabled:opacity-50"
                        >
                          {busy === b.id ? <Spin /> : <X className="h-4 w-4" />} Reject
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </motion.article>
          );
        })
      )}

      {pendingCount > 0 ? (
        <p className="font-mono text-[0.62rem] uppercase tracking-widest text-amber-600">
          {pendingCount} demo booking{pendingCount === 1 ? "" : "s"} awaiting review
        </p>
      ) : null}

      {matches.length > 0 ? (
        <Pager page={pageIdx} pageSize={PAGE_SIZE} total={matches.length} onPage={setPage} />
      ) : null}
    </section>
  );
}

function Spin() {
  return <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand/20/50 border-t-brand-deep" />;
}
