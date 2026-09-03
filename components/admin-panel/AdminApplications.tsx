"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronDown, Circle, Download, MapPin, MessageSquareQuote, UserRound, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminApplication } from "./types";
import { AvatarInitial, FilterChips, Pager, SearchBox, SectionTitle, StatusPill, downloadCsv, DateFilter, BulkActionsBar, type BulkActionDef } from "./ui";

type Filter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

const ease = [0.16, 1, 0.3, 1] as const;
const PAGE_SIZE = 15;

export function AdminApplications({
  items, onDecide, freshIds,
}: {
  items: AdminApplication[];
  onDecide: (id: string, action: "APPROVE" | "REJECT", message: string) => Promise<void>;
  freshIds: Set<string>;
}) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const setFilterPageReset = (f: Filter) => {
    setFilter(f);
    setPage(1);
  };
  const setQueryPageReset = (q: string) => {
    setQuery(q);
    setPage(1);
  };

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((a) => {
      if (filter !== "ALL" && a.status !== filter) return false;
      const t = new Date(a.createdAt).getTime();
      if (from && t < new Date(from).getTime()) return false;
      if (to && t > new Date(to).getTime() + 86400000) return false;
      if (!q) return true;
      const hay = `${a.name} ${a.email} ${a.place} ${a.course} ${a.bio} ${a.message ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, filter, query, from, to]);

  const totalPages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const pageIdx = Math.min(page, totalPages);
  const visible = matches.slice((pageIdx - 1) * PAGE_SIZE, pageIdx * PAGE_SIZE);

  const decide = async (id: string, action: "APPROVE" | "REJECT") => {
    setBusy(id);
    try {
      await onDecide(id, action, replies[id] ?? "");
    } finally {
      setBusy(null);
    }
  };

  const exportCsv = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(
      `lh-applications-${stamp}.csv`,
      ["Name", "Email", "Place", "Course", "Bio", "Message", "Status", "Admin reply", "Created at"],
      matches.map((a) => [
        a.name,
        a.email,
        a.place,
        a.course,
        a.bio,
        a.message ?? "",
        a.status,
        a.adminMessage ?? "",
        new Date(a.createdAt).toISOString(),
      ])
    );
  };

  // Bulk selection helpers
  const thisPageIds = visible.map((a) => a.id);
  const allPageSelected = thisPageIds.every((id) => selected.has(id));

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleSelectPage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) thisPageIds.forEach((id) => next.delete(id));
      else thisPageIds.forEach((id) => next.add(id));
      return next;
    });
  };
  const clearSelected = () => setSelected(new Set());

  const bulkAction = async (action: string) => {
    const ids = [...selected];
    if (ids.length === 0) return;
    setBulkBusy(true);
    try {
      await Promise.all(
        ids.map((id) => onDecide(id, action === "REJECT" ? "REJECT" : "APPROVE", replies[id] ?? ""))
      );
      clearSelected();
    } finally {
      setBulkBusy(false);
    }
  };

  const bulkActions: BulkActionDef[] = [
    {
      label: "Approve",
      action: "APPROVE",
      tone: "emerald",
      confirm: `Approve ${selected.size} application${selected.size !== 1 ? "s" : ""}?`,
    },
    {
      label: "Reject",
      action: "REJECT",
      tone: "rose",
      confirm: `Reject ${selected.size} application${selected.size !== 1 ? "s" : ""}?`,
    },
  ];

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionTitle kicker="Queue 01 · live" title="Course Applications" />
        <FilterChips<Filter>
          options={[
            { key: "ALL", label: "ALL", count: items.length },
            { key: "PENDING", label: "PENDING", count: items.filter((a) => a.status === "PENDING").length },
            { key: "APPROVED", label: "APPROVED", count: items.filter((a) => a.status === "APPROVED").length },
            { key: "REJECTED", label: "REJECTED", count: items.filter((a) => a.status === "REJECTED").length },
          ]}
          value={filter}
          onChange={setFilterPageReset}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchBox
            value={query}
            onChange={setQueryPageReset}
            placeholder="Search name, email, place, course, bio…"
          />
          <DateFilter from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); setPage(1); }} />
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={matches.length === 0}
          className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/8 px-4 py-2.5 font-display text-[0.72rem] font-bold text-brand-deep transition-all hover:-translate-y-0.5 hover:bg-brand/12 disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>

      {/* Bulk actions (sticky, only when rows selected) */}
      <BulkActionsBar
        selectedCount={selected.size}
        actions={bulkActions}
        busy={bulkBusy}
        onAction={bulkAction}
        onClear={clearSelected}
      />

      {visible.length === 0 ? (
        <div className="glass-dash grid place-items-center overflow-hidden rounded-[1.75rem] px-6 py-16 text-center">
          <p className="font-display text-4xl font-extrabold text-slate-200">∅</p>
          <p className="mt-3 font-display text-[0.95rem] font-bold text-ink-2">No applications here</p>
          <p className="font-mono text-[0.7rem] text-ink-3">Incoming requests will stream in live.</p>
        </div>
      ) : (
        <>
          {/* Column select-all */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={toggleSelectPage}
              className="inline-flex items-center gap-2 rounded-full border border-ink/12 bg-white/70 px-3.5 py-1.5 font-display text-[0.72rem] font-bold text-ink-2 transition-all hover:border-brand/45 hover:text-brand-deep"
            >
              <Circle className={cn("h-3.5 w-3.5", allPageSelected && "text-brand-deep")} />
              Select this page ({thisPageIds.length})
            </button>
            <span className="font-mono text-[0.6rem] text-ink-3">{selected.size} selected total</span>
          </div>
          {visible.map((a, i) => {
          const open = expanded === a.id;
          const isPending = a.status === "PENDING";
          const isFresh = freshIds.has(a.id);
          const isSelected = selected.has(a.id);
          return (
            <motion.article
              key={a.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease, delay: Math.min(0.12, i * 0.03) }}
              className={cn(
                "glass-dash relative overflow-hidden rounded-[1.5rem] transition-all duration-300",
                open ? "ring-2 ring-brand/60" : "hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-20px_rgb(110_90_224/0.4)]",
                isFresh && isPending && "animate-[glow-breathe_6s_ease-in-out_infinite]",
                isSelected && "ring-2 ring-brand/70"
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute left-0 top-0 h-full w-1 bg-gradient-to-b transition-opacity",
                  isPending ? "from-brand/80 to-brand-deep opacity-100" : "opacity-0"
                )}
              />
              {isFresh && isPending ? (
                <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-brand-deep to-brand-magenta px-2.5 py-0.5 font-mono text-[0.55rem] font-black uppercase tracking-widest text-white shadow-lg">
                  <span className="h-1 w-1 animate-pulse rounded-full bg-white" /> New
                </span>
              ) : null}

              <div className="flex items-stretch">
                <button
                  type="button"
                  onClick={() => toggleSelect(a.id)}
                  className="flex w-11 shrink-0 items-center justify-center border-r border-white/60 text-ink-3 transition-colors hover:bg-white/40"
                  aria-label={isSelected ? "Deselect" : "Select"}
                >
                  <span className={cn(
                    "grid h-5 w-5 place-items-center rounded-md border-2",
                    isSelected ? "border-brand-deep bg-brand-deep text-white" : "border-ink/20 bg-white text-transparent"
                  )}>
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : a.id)}
                  className="flex w-full flex-wrap items-center gap-4 px-5 py-4 text-start"
                >
                  <AvatarInitial name={a.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 pr-10 sm:pr-16">
                      <h3 className="font-display text-[1.02rem] font-extrabold text-ink">{a.name}</h3>
                      <span className={cn(
                        "rounded-full border px-2.5 py-0.5 font-mono text-[0.6rem] font-bold",
                        isPending ? "border-brand/20 bg-brand/8 text-brand-deep" : "border-ink/12 bg-white/70 text-ink-2"
                      )}>
                        {a.course}
                      </span>
                    </div>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[0.68rem] text-ink-3">
                      <span className="inline-flex items-center gap-1">{a.email}</span>
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{a.place}</span>
                      <span>
                        {new Date(a.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </p>
                  </div>
                  <span className="ml-auto flex items-center gap-2">
                    <StatusPill status={a.status} />
                    <ChevronDown className={cn("h-4 w-4 text-ink-3 transition-transform", open && "rotate-180")} />
                  </span>
                </button>
              </div>

              {open ? (
                <div className="relative border-t border-white/70 px-5 py-4">
                  <p className="flex items-start gap-2 font-display text-[0.92rem] leading-relaxed text-ink">
                    <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    {a.bio}
                  </p>
                  {a.message ? (
                    <p className="mt-3 flex items-start gap-2 rounded-xl border border-brand/12 bg-brand/8/60 p-3 font-display text-[0.88rem] text-ink-2">
                      <MessageSquareQuote className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                      <span>
                        <span className="mr-2 font-display text-[0.55rem] font-bold uppercase tracking-[0.24em] text-brand/80">Note</span>
                        {a.message}
                      </span>
                    </p>
                  ) : null}
                  {a.adminMessage ? (
                    <p className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 font-display text-[0.88rem] text-emerald-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span>
                        <span className="mr-2 font-display text-[0.55rem] font-bold uppercase tracking-[0.24em] text-emerald-500">Reply</span>
                        {a.adminMessage}
                      </span>
                    </p>
                  ) : null}

                  {isPending ? (
                    <div className="mt-4 flex flex-col gap-3 border-t border-white/70 pt-4 sm:flex-row sm:items-center">
                      <input
                        value={replies[a.id] ?? ""}
                        onChange={(e) => setReplies((r) => ({ ...r, [a.id]: e.target.value }))}
                        placeholder="Approve message (student sees this live)…"
                        className="flex-1 rounded-xl border border-ink/12 bg-white/70 px-4 py-2.5 font-display text-[0.85rem] text-ink outline-none transition-all backdrop-blur-md placeholder:text-ink-3/70 focus:border-brand focus:ring-4 focus:ring-brand/80/15"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => decide(a.id, "APPROVE")}
                          disabled={busy === a.id}
                          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-deep to-brand-deep px-5 py-2.5 font-display text-[0.78rem] font-extrabold text-white shadow-[0_14px_30px_-12px_rgb(110_90_224/0.8)] transition-all hover:brightness-110 disabled:opacity-50"
                        >
                          {busy === a.id ? <Spin /> : <Check className="h-4 w-4" />} Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => decide(a.id, "REJECT")}
                          disabled={busy === a.id}
                          className="inline-flex items-center gap-2 rounded-full border border-rose-300 bg-white/60 px-5 py-2.5 font-display text-[0.78rem] font-bold text-rose-600 transition-all hover:bg-rose-50 disabled:opacity-50"
                        >
                          {busy === a.id ? <Spin /> : <X className="h-4 w-4" />} Reject
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </motion.article>
          );
        })
        }
        </>
      )}

      {matches.length > 0 ? (
        <Pager page={pageIdx} pageSize={PAGE_SIZE} total={matches.length} onPage={setPage} />
      ) : null}
    </section>
  );
}

function Spin() {
  return <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand/20/50 border-t-brand-deep" />;
}