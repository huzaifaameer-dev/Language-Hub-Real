"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Check, Download, GraduationCap, ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminEnrollment } from "./types";
import { AvatarInitial, FilterChips, Pager, SearchBox, SectionTitle, StatusPill, downloadCsv, DateFilter, BulkActionsBar, type BulkActionDef } from "./ui";

type Filter = "ALL" | "PENDING" | "AWAITING_PAYMENT" | "PROOF_SUBMITTED" | "ENROLLED" | "REJECTED";

type Action = "REQUEST_PAYMENT" | "CONFIRM" | "REJECT";

const PAYMENT_LABELS: Record<string, string> = {
  easypaisa: "EasyPaisa",
  jazzcash: "JazzCash",
  bank: "Bank transfer",
  card: "Card (online)",
  other: "Other",
};

const ease = [0.16, 1, 0.3, 1] as const;
const PAGE_SIZE = 15;

export function AdminEnrollments({
  items, onDecide, freshIds,
}: {
  items: AdminEnrollment[];
  onDecide: (id: string, action: Action, message: string, paymentInstructions?: string) => Promise<void>;
  freshIds: Set<string>;
}) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [instructions, setInstructions] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
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
    return items.filter((e) => {
      if (filter !== "ALL" && e.status !== filter) return false;
      const t = new Date(e.createdAt).getTime();
      if (from && t < new Date(from).getTime()) return false;
      if (to && t > new Date(to).getTime() + 86400000) return false;
      if (!q) return true;
      const hay = `${e.name} ${e.email} ${(e.subjects ?? []).join(" ")} ${e.batch} ${e.plan ?? ""} ${e.paymentInstructions ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, filter, query, from, to]);

  const totalPages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const pageIdx = Math.min(page, totalPages);
  const visible = matches.slice((pageIdx - 1) * PAGE_SIZE, pageIdx * PAGE_SIZE);

  const decide = async (id: string, action: Action) => {
    setBusy(id);
    try {
      await onDecide(id, action, replies[id] ?? "", instructions[id] ?? "");
    } finally {
      setBusy(null);
    }
  };

  const exportCsv = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(
      `lh-enrollments-${stamp}.csv`,
      ["Name", "Email", "Subjects", "Batch", "Plan", "Payment method", "Instructions", "Proof", "Status", "Created at"],
      matches.map((e) => [
        e.name,
        e.email,
        (e.subjects ?? []).join("; "),
        e.batch,
        e.plan ?? "",
        e.paymentMethod ? PAYMENT_LABELS[e.paymentMethod] ?? e.paymentMethod : "",
        e.paymentInstructions ?? "",
        e.paymentProof ?? "",
        e.status,
        new Date(e.createdAt).toISOString(),
      ])
    );
  };

  // Bulk helpers
  const thisPageIds = visible.map((e) => e.id);
  const allPageSelected = thisPageIds.length > 0 && thisPageIds.every((id) => selected.has(id));

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
    const ids = [...selected].filter((id) => items.find((e) => e.id === id)?.status === "PENDING");
    if (ids.length === 0) return;
    setBulkBusy(true);
    try {
      await Promise.all(
        ids.map((id) => onDecide(id, (action === "REJECT" ? "REJECT" : "REQUEST_PAYMENT") as Action, replies[id] ?? "", instructions[id] ?? ""))
      );
      clearSelected();
    } finally {
      setBulkBusy(false);
    }
  };

  const bulkActions: BulkActionDef[] = [
    {
      label: "Request payment",
      action: "REQUEST_PAYMENT",
      tone: "brand",
      confirm: `Send a payment request to ${selected.size} pending enrollment${selected.size !== 1 ? "s" : ""}?`,
    },
    {
      label: "Reject",
      action: "REJECT",
      tone: "rose",
      confirm: `Reject ${selected.size} enrollment${selected.size !== 1 ? "s" : ""}?`,
    },
  ];

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionTitle kicker="Queue 02 · live" title="Enrollment & Payment" />
        <FilterChips<Filter>
          options={[
            { key: "ALL", label: "ALL", count: items.length },
            { key: "PENDING", label: "PENDING", count: items.filter((e) => e.status === "PENDING").length },
            { key: "AWAITING_PAYMENT", label: "AWAITING PAY", count: items.filter((e) => e.status === "AWAITING_PAYMENT").length },
            { key: "PROOF_SUBMITTED", label: "PROOF", count: items.filter((e) => e.status === "PROOF_SUBMITTED").length },
            { key: "ENROLLED", label: "ENROLLED", count: items.filter((e) => e.status === "ENROLLED").length },
            { key: "REJECTED", label: "REJECTED", count: items.filter((e) => e.status === "REJECTED").length },
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
            placeholder="Search name, email, subject, batch…"
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

      {/* Bulk actions (only enabled for PENDING rows) */}
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
          <p className="mt-3 font-display text-[0.95rem] font-bold text-ink-2">No enrollment requests here</p>
          <p className="font-mono text-[0.7rem] text-ink-3">New requests will stream in live.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={toggleSelectPage}
              className="inline-flex items-center gap-2 rounded-full border border-ink/12 bg-white/70 px-3.5 py-1.5 font-display text-[0.72rem] font-bold text-ink-2 transition-all hover:border-brand/45 hover:text-brand-deep"
            >
              <span className={cn(
                "grid h-4 w-4 place-items-center rounded border",
                allPageSelected ? "border-brand-deep bg-brand-deep text-white" : "border-ink/20 bg-white text-transparent"
              )}>
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              Select page ({thisPageIds.length})
            </button>
            <span className="font-mono text-[0.6rem] text-ink-3">{selected.size} selected</span>
          </div>
          {visible.map((e, i) => {
          const isPending = e.status === "PENDING";
          const isAwaiting = e.status === "AWAITING_PAYMENT";
          const isProof = e.status === "PROOF_SUBMITTED";
          const isEnrolled = e.status === "ENROLLED";
          const isRejected = e.status === "REJECTED";
          const isFresh = freshIds.has(e.id);
          const isSelected = selected.has(e.id);
          return (
            <motion.article
              key={e.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease, delay: Math.min(0.12, i * 0.03) }}
              className={cn(
                "glass-dash relative overflow-hidden rounded-[1.5rem] p-5 transition-all duration-300",
                isEnrolled ? "ring-1 ring-brand/35" : "hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-20px_rgb(214_58_140/0.4)]",
                isFresh && isPending && "animate-[glow-breathe_6s_ease-in-out_infinite]",
                isSelected && "ring-2 ring-brand/70"
              )}
            >
              {/* row selection checkbox */}
              <button
                type="button"
                onClick={() => toggleSelect(e.id)}
                className="absolute right-3 top-3 z-10 grid h-6 w-6 place-items-center rounded-md border-2 bg-white/80 text-transparent transition-colors hover:bg-white"
                style={{ right: isFresh ? "5.5rem" : "0.75rem" }}
                aria-label={isSelected ? "Deselect" : "Select"}
              >
                <span className={cn(
                  "grid h-6 w-6 place-items-center rounded-md border-2 border-ink/20 bg-white text-transparent",
                  isSelected ? "border-brand-deep bg-brand-deep text-white" : ""
                )}>
                  {isSelected ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                </span>
              </button>
              {isFresh && isPending ? (
                <span className="absolute right-[5rem] top-3 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-brand-magenta to-brand-deep px-2.5 py-0.5 font-mono text-[0.55rem] font-black uppercase tracking-widest text-white shadow-lg">
                  <span className="h-1 w-1 animate-pulse rounded-full bg-white" /> New
                </span>
              ) : null}

              <div className="relative flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-4 pr-16">
                  <AvatarInitial name={e.name} />
                  <div>
                    <h3 className="font-display text-[1.02rem] font-extrabold text-ink">{e.name}</h3>
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[0.68rem] text-ink-3">
                      <span>{e.email}</span>
                      {e.paymentMethod ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-ink/12 bg-white/70 px-2 py-0.5">
                        {PAYMENT_LABELS[e.paymentMethod] ?? e.paymentMethod}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(e.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </p>
                  </div>
                </div>
                <StatusPill status={e.status} />
              </div>

              <div className="relative mt-4 flex flex-wrap gap-2">
                {(e.subjects ?? []).map((s) => (
                  <span key={s} className="rounded-full border border-brand/20 bg-brand/8 px-3 py-1 font-mono text-[0.68rem] font-bold text-brand-deep">
                    {s}
                  </span>
                ))}
                <span className="rounded-full border border-ink/12 bg-white/70 px-3 py-1 font-mono text-[0.68rem] text-ink-2 backdrop-blur-md">
                  Batch · {e.batch}
                </span>
              </div>

              {e.plan ? (
                <p className="relative mt-3 font-display text-[0.9rem] leading-relaxed text-ink-2">{e.plan}</p>
              ) : null}

              {e.paymentInstructions ? (
                <div className="relative mt-3 rounded-xl border border-sky-200 bg-sky-50/70 p-3">
                  <p className="font-display text-[0.55rem] font-bold uppercase tracking-[0.24em] text-sky-600">
                    Payment instructions sent
                  </p>
                  <p className="mt-1 font-display text-[0.86rem] text-sky-800">{e.paymentInstructions}</p>
                </div>
              ) : null}

              {e.paymentProof ? (
                <div className="relative mt-3 overflow-hidden rounded-xl border border-brand/15 bg-ink/[0.03] p-3">
                  <p className="mb-2 flex items-center gap-1.5 font-display text-[0.55rem] font-bold uppercase tracking-[0.24em] text-brand-deep">
                    <ImageIcon className="h-3 w-3" /> Payment proof
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={e.paymentProof}
                    alt={`Payment proof from ${e.name}`}
                    onError={(ev) => {
                      // A proof that no longer exists (e.g. after a data reset)
                      // must not leave a broken image icon in the panel.
                      const el = ev.currentTarget;
                      el.style.display = "none";
                    }}
                    className="max-h-64 w-full rounded-lg object-contain bg-white"
                  />
                </div>
              ) : null}

              {e.adminMessage ? (
                <p className="relative mt-3 flex items-start gap-2 rounded-xl border border-brand/12 bg-brand/6 p-3 font-display text-[0.88rem] text-brand-deep">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-deep" />
                  <span>
                    <span className="mr-2 font-display text-[0.55rem] font-bold uppercase tracking-[0.24em] text-brand-deep">Reply</span>
                    {e.adminMessage}
                  </span>
                </p>
              ) : null}

              {isPending ? (
                <div className="relative mt-4 flex flex-col gap-3 border-t border-white/70 pt-4">
                  <p className="font-mono text-[0.62rem] uppercase tracking-widest text-brand-deep">
                    Step 1 · Ask the student to pay
                  </p>
                  <input
                    value={instructions[e.id] ?? ""}
                    onChange={(e2) => setInstructions((r) => ({ ...r, [e.id]: e2.target.value }))}
                    placeholder="Payment instructions — e.g. Send Rs. 12,000 to JazzCash 0300-1234567, account: Name. Provide TID."
                    className="flex-1 rounded-xl border border-ink/12 bg-white/70 px-4 py-2.5 font-display text-[0.85rem] text-ink outline-none transition-all backdrop-blur-md placeholder:text-ink-3/70 focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/15"
                  />
                  <p className="font-mono text-[0.62rem] uppercase tracking-widest text-ink-3">
                    Reply for the student (optional)
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      value={replies[e.id] ?? ""}
                      onChange={(e2) => setReplies((r) => ({ ...r, [e.id]: e2.target.value }))}
                      placeholder="Message to student…"
                      className="flex-1 rounded-xl border border-ink/12 bg-white/70 px-4 py-2.5 font-display text-[0.85rem] text-ink outline-none transition-all backdrop-blur-md placeholder:text-ink-3/70 focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/15"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => decide(e.id, "REQUEST_PAYMENT")}
                        disabled={busy === e.id}
                        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-deep to-brand-magenta px-5 py-2.5 font-display text-[0.78rem] font-extrabold text-white shadow-[0_14px_30px_-12px_rgb(81_63_196/0.8)] transition-all hover:brightness-110 disabled:opacity-50"
                      >
                        {busy === e.id ? <Spin /> : <GraduationCap className="h-4 w-4" />} Request Payment
                      </button>
                      <button
                        type="button"
                        onClick={() => decide(e.id, "REJECT")}
                        disabled={busy === e.id}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-300 bg-white/60 px-5 py-2.5 font-display text-[0.78rem] font-bold text-rose-600 transition-all hover:bg-rose-50 disabled:opacity-50"
                      >
                        {busy === e.id ? <Spin /> : <X className="h-4 w-4" />} Reject
                      </button>
                    </div>
                  </div>
                </div>
              ) : isAwaiting ? (
                <div className="relative mt-4 flex flex-col gap-2 border-t border-white/70 pt-4">
                  <p className="font-mono text-[0.62rem] uppercase tracking-widest text-sky-600">
                    Waiting for the student to upload payment proof
                  </p>
                  <p className="font-display text-[0.78rem] text-ink-2">
                    {e.paymentInstructions
                      ? "Instructions were sent. Once the screenshot arrives, it will show above and you can confirm."
                      : "This request was moved to payment awaiting without instructions. You can still wait for proof or reject."}
                  </p>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => decide(e.id, "REJECT")}
                      disabled={busy === e.id}
                      className="inline-flex items-center gap-2 rounded-full border border-rose-300 bg-white/60 px-5 py-2.5 font-display text-[0.78rem] font-bold text-rose-600 transition-all hover:bg-rose-50 disabled:opacity-50"
                    >
                      {busy === e.id ? <Spin /> : <X className="h-4 w-4" />} Reject
                    </button>
                  </div>
                </div>
              ) : isProof ? (
                <div className="relative mt-4 flex flex-col gap-2 border-t border-white/70 pt-4">
                  <p className="font-mono text-[0.62rem] uppercase tracking-widest text-violet-600">
                    Proof submitted — verify then confirm
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      value={replies[e.id] ?? ""}
                      onChange={(e2) => setReplies((r) => ({ ...r, [e.id]: e2.target.value }))}
                      placeholder="Confirmation message…"
                      className="flex-1 rounded-xl border border-ink/12 bg-white/70 px-4 py-2.5 font-display text-[0.85rem] text-ink outline-none transition-all backdrop-blur-md placeholder:text-ink-3/70 focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/15"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => decide(e.id, "CONFIRM")}
                        disabled={busy === e.id}
                        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 font-display text-[0.78rem] font-extrabold text-white shadow-[0_14px_30px_-12px_rgb(16_185_129/0.7)] transition-all hover:brightness-110 disabled:opacity-50"
                      >
                        {busy === e.id ? <SpinDark /> : <Check className="h-4 w-4" />} Confirm & Enroll
                      </button>
                      <button
                        type="button"
                        onClick={() => decide(e.id, "REJECT")}
                        disabled={busy === e.id}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-300 bg-white/60 px-5 py-2.5 font-display text-[0.78rem] font-bold text-rose-600 transition-all hover:bg-rose-50 disabled:opacity-50"
                      >
                        {busy === e.id ? <Spin /> : <X className="h-4 w-4" />} Reject
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative mt-4 flex items-center gap-2 border-t border-white/70 pt-4 font-mono text-[0.62rem] font-bold uppercase tracking-[0.24em] text-ink-3">
                  <span className={cn("h-1.5 w-1.5 rounded-full", isEnrolled ? "bg-brand-deep" : "bg-rose-400")} />
                  {isEnrolled ? "Student enrolled — books assigned" : isRejected ? "Request rejected" : "No active action"}
                </div>
              )}
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
  return <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand/15 border-t-brand-deep" />;
}

function SpinDark() {
  return <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />;
}
