"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Banknote, CreditCard, Download, Plus, RefreshCw, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionTitle, FilterChips, Pager, SearchBox, GlassPanel, CountUp, downloadCsv } from "./ui";

interface PaymentRow {
  id: string;
  enrollmentId: string;
  userId: string;
  amount: number;
  currency: string;
  provider: "manual" | "stripe" | "konnect";
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  type?: "DEPOSIT" | "WITHDRAWAL";
  method?: string | null;
  note?: string | null;
  studentName?: string | null;
  studentEmail?: string | null;
  createdAt: string | null;
}

interface PaymentCounts {
  total: number;
  paid: number;
  failed: number;
  refunded: number;
  pending: number;
}

type Filter = "ALL" | "PAID" | "PENDING" | "FAILED" | "REFUNDED";

const ease = [0.16, 1, 0.3, 1] as const;

const STATUS_META: Record<string, { cls: string; dot: string }> = {
  PENDING: { cls: "border-amber-300 bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  PAID: { cls: "border-emerald-300 bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  FAILED: { cls: "border-rose-300 bg-rose-50 text-rose-600", dot: "bg-rose-500" },
  REFUNDED: { cls: "border-slate-300 bg-slate-50 text-slate-600", dot: "bg-slate-400" },
};

export function AdminPayments() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [counts, setCounts] = useState<PaymentCounts>({ total: 0, paid: 0, failed: 0, refunded: 0, pending: 0 });
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [recordOpen, setRecordOpen] = useState(false);
  const PAGE_SIZE = 25;

  const fetchAll = useCallback(() => {
    fetch("/api/admin/payments")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setPayments(data.payments ?? []);
          setCounts(data.counts ?? { total: 0, paid: 0, failed: 0, refunded: 0, pending: 0 });
          setLoaded(true);
        }
      })
      .catch(() => {})
      .finally(() => setBusy(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = useMemo(() => {
    let list = payments;
    if (filter !== "ALL") list = list.filter((p) => p.status === filter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.enrollmentId.toLowerCase().includes(q) ||
          p.userId.toLowerCase().includes(q) ||
          p.provider.toLowerCase().includes(q) ||
          (p.studentName ?? "").toLowerCase().includes(q) ||
          (p.note ?? "").toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [payments, filter, search]);

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const refund = async (row: PaymentRow) => {
    if (!window.confirm(`Mark payment ${row.id.slice(-8)} as refunded?`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, action: "REFUND" }),
      });
      if (res.ok) fetchAll();
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = () => {
    const headers = ["ID", "Enrollment", "User", "Amount", "Currency", "Provider", "Status", "Date"];
    const rows = filtered.map((p) => [
      p.id,
      p.enrollmentId,
      p.userId,
      p.amount,
      p.currency,
      p.provider,
      p.status,
      p.createdAt ? new Date(p.createdAt).toLocaleString("en-GB") : "",
    ]);
    downloadCsv(`payments-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  const filterOptions: { key: Filter; label: string; count: number }[] = [
    { key: "ALL", label: "All", count: counts.total },
    { key: "PAID", label: "Paid", count: counts.paid },
    { key: "PENDING", label: "Pending", count: counts.pending },
    { key: "FAILED", label: "Failed", count: counts.failed },
    { key: "REFUNDED", label: "Refunded", count: counts.refunded },
  ];

  const totalRevenue = payments
    .filter((p) => p.status === "PAID" && (p.type ?? "DEPOSIT") === "DEPOSIT")
    .reduce((s, p) => s + p.amount, 0);
  const totalWithdrawn = payments
    .filter((p) => p.status === "PAID" && p.type === "WITHDRAWAL")
    .reduce((s, p) => s + p.amount, 0);

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionTitle kicker="Finance · ledger" title="Payments" />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRecordOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-deep to-brand-magenta px-4 py-2.5 font-display text-[0.72rem] font-bold text-white shadow-[0_12px_28px_-12px_rgb(110_90_224/0.8)] transition-all hover:-translate-y-0.5 hover:brightness-110"
          >
            <Plus className="h-3.5 w-3.5" /> Record
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-full border border-ink/12 bg-white/70 px-4 py-2.5 font-display text-[0.72rem] font-bold text-ink-2 transition-all hover:border-brand/45 hover:text-brand-deep"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
          <button
            type="button"
            onClick={() => fetchAll()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full border border-ink/12 bg-white/70 px-4 py-2.5 font-display text-[0.72rem] font-bold text-ink-2 transition-all hover:border-brand/45 hover:text-brand-deep disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", busy && "animate-spin")} /> Refresh
          </button>
        </div>
      </div>

      {/* Revenue stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <GlassPanel className="p-4!">
          <div className="flex items-center justify-between">
            <p className="font-display text-[0.62rem] font-bold uppercase tracking-[0.3em] text-ink-3">Total</p>
            <CreditCard className="h-4 w-4 text-ink-3" />
          </div>
          <p className="mt-2 font-display text-[1.6rem] font-extrabold text-ink"><CountUp to={counts.total} /></p>
          <p className="font-mono text-[0.58rem] text-ink-3">transactions</p>
        </GlassPanel>
        <GlassPanel className="p-4!">
          <p className="font-display text-[0.62rem] font-bold uppercase tracking-[0.3em] text-emerald-600">Revenue</p>
          <p className="mt-2 font-display text-[1.6rem] font-extrabold text-ink">Rs. <CountUp to={totalRevenue} /></p>
          <p className="font-mono text-[0.58rem] text-ink-3">{totalWithdrawn ? `collected · ${totalWithdrawn.toLocaleString()} withdrawn` : "collected (PKR)"}</p>
        </GlassPanel>
        <GlassPanel className="p-4!">
          <p className="font-display text-[0.62rem] font-bold uppercase tracking-[0.3em] text-amber-600">Pending</p>
          <p className="mt-2 font-display text-[1.6rem] font-extrabold text-ink"><CountUp to={counts.pending} /></p>
          <p className="font-mono text-[0.58rem] text-ink-3">awaiting</p>
        </GlassPanel>
        <GlassPanel className="p-4!">
          <p className="font-display text-[0.62rem] font-bold uppercase tracking-[0.3em] text-emerald-600">Paid</p>
          <p className="mt-2 font-display text-[1.6rem] font-extrabold text-ink"><CountUp to={counts.paid} /></p>
          <p className="font-mono text-[0.58rem] text-ink-3">confirmed</p>
        </GlassPanel>
        <GlassPanel className="p-4!">
          <p className="font-display text-[0.62rem] font-bold uppercase tracking-[0.3em] text-rose-600">Failed</p>
          <p className="mt-2 font-display text-[1.6rem] font-extrabold text-ink"><CountUp to={counts.failed + counts.refunded} /></p>
          <p className="font-mono text-[0.58rem] text-ink-3">failed + refunded</p>
        </GlassPanel>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={search} onChange={setSearch} placeholder="Search by ID, user, provider…" />
        <FilterChips options={filterOptions} value={filter} onChange={setFilter} />
      </div>

      {!loaded ? (
        <div className="glass-dash grid place-items-center overflow-hidden rounded-[1.75rem] px-6 py-20 text-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand/25 border-t-brand-deep" />
          <p className="mt-4 font-mono text-[0.72rem] text-ink-3">Loading payments…</p>
        </div>
      ) : paged.length === 0 ? (
        <div className="glass-dash grid place-items-center overflow-hidden rounded-[1.75rem] px-6 py-16 text-center">
          <p className="font-display text-4xl font-extrabold text-slate-200">∅</p>
          <p className="mt-3 font-display text-[0.95rem] font-bold text-ink-2">No payments found</p>
          <p className="font-mono text-[0.7rem] text-ink-3">
            {filter !== "ALL" ? "Try a different filter." : "Payments will appear here once students start paying."}
          </p>
        </div>
      ) : (
        <>
          <div className="glass-dash overflow-x-auto rounded-[1.75rem]">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-ink/8">
                  {["Provider", "Amount", "Status", "Enrollment", "Date", "Action"].map((h) => (
                    <th key={h} className="whitespace-nowrap px-5 py-3.5 font-mono text-[0.58rem] font-bold uppercase tracking-[0.24em] text-ink-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((p, i) => {
                  const sm = STATUS_META[p.status] ?? STATUS_META.PENDING;
                  return (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease, delay: Math.min(0.15, i * 0.02) }}
                      className="border-b border-ink/5 transition-colors hover:bg-brand/5"
                    >
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {(p.type ?? "DEPOSIT") === "WITHDRAWAL" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 font-mono text-[0.58rem] font-bold uppercase tracking-wider text-rose-600">
                              <ArrowUpRight className="h-3 w-3" /> Withdrawal
                            </span>
                          ) : p.provider === "stripe" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 font-mono text-[0.58rem] font-bold uppercase tracking-wider text-violet-700">
                              <CreditCard className="h-3 w-3" /> Card
                            </span>
                          ) : p.provider === "konnect" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 font-mono text-[0.58rem] font-bold uppercase tracking-wider text-sky-700">
                              <Banknote className="h-3 w-3" /> Konnect
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-mono text-[0.58rem] font-bold uppercase tracking-wider text-emerald-700">
                              <ArrowDownLeft className="h-3 w-3" /> {p.method ?? "Manual"}
                            </span>
                          )}
                          {p.studentName ? (
                            <span className="text-[0.7rem] font-semibold text-ink-2">{p.studentName}</span>
                          ) : null}
                        </div>
                        {p.note ? (
                          <p className="mt-0.5 max-w-[14rem] truncate text-[0.6rem] text-ink-3" title={p.note}>{p.note}</p>
                        ) : null}
                      </td>
                      <td className={cn(
                        "whitespace-nowrap px-5 py-3.5 font-display text-[0.88rem] font-extrabold",
                        (p.type ?? "DEPOSIT") === "WITHDRAWAL" ? "text-rose-600" : "text-ink"
                      )}>
                        {(p.type ?? "DEPOSIT") === "WITHDRAWAL" ? "−" : ""} Rs. {p.amount.toLocaleString()}{" "}
                        <span className="font-mono text-[0.6rem] font-normal text-ink-3">{p.currency}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[0.58rem] font-bold tracking-wider", sm.cls)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", sm.dot)} />
                          {p.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 font-mono text-[0.68rem] text-ink-3">
                        {p.enrollmentId.slice(-8)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 font-mono text-[0.68rem] text-ink-3">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        {p.status === "PAID" ? (
                          <button
                            type="button"
                            title="Mark as refunded"
                            onClick={() => refund(p)}
                            disabled={busy}
                            className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 font-mono text-[0.6rem] font-bold text-rose-600 transition-all hover:bg-rose-100 disabled:opacity-50"
                          >
                            <RotateCcw className="h-3 w-3" /> Refund
                          </button>
                        ) : (
                          <span className="font-mono text-[0.6rem] text-ink-3/60">—</span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pager page={page} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} />
        </>
      )}

      {recordOpen ? (
        <RecordPaymentModal
          busy={busy}
          onClose={() => setRecordOpen(false)}
          onSave={async (payload) => {
            setBusy(true);
            try {
              const res = await fetch("/api/admin/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
              const data = await res.json().catch(() => null);
              if (res.ok) {
                fetchAll();
                return { ok: true };
              }
              return { ok: false, message: data?.message ?? "Could not record payment." };
            } finally {
              setBusy(false);
            }
          }}
        />
      ) : null}
    </section>
  );
}

const METHODS = [
  { key: "card", label: "Card", desc: "Manual card entry" },
  { key: "easypaisa", label: "EasyPaisa" },
  { key: "jazzcash", label: "JazzCash" },
  { key: "bank", label: "Bank" },
  { key: "cash", label: "Cash" },
];

const METHOD_ICONS: Record<string, typeof CreditCard> = {
  card: CreditCard,
  easypaisa: Banknote,
  jazzcash: Banknote,
  bank: Banknote,
  cash: Banknote,
};

const inputCls =
  "w-full rounded-xl border border-ink/12 bg-white px-3.5 py-2.5 text-[0.9rem] text-ink outline-none transition-all duration-200 placeholder:text-ink-3 focus:border-brand/80 focus:ring-4 focus:ring-brand-deep/12";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-display text-[0.66rem] font-bold uppercase tracking-[0.2em] text-ink-2">
        {label}
      </span>
      {children}
    </label>
  );
}

/** Admin modal to record a manual DEPOSIT or WITHDRAWAL into the ledger. */
function RecordPaymentModal({
  busy,
  onClose,
  onSave,
}: {
  busy: boolean;
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => Promise<{ ok: boolean; message?: string }>;
}) {
  const [type, setType] = useState<"DEPOSIT" | "WITHDRAWAL">("DEPOSIT");
  const [method, setMethod] = useState("cash");
  const [amount, setAmount] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isWithdrawal = type === "WITHDRAWAL";

  const submit = async () => {
    setError(null);
    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) {
      setError("Enter a valid amount greater than zero.");
      return;
    }
    const payload = {
      type,
      method,
      amount: num,
      studentName: isWithdrawal ? "" : studentName,
      studentEmail: isWithdrawal ? "" : studentEmail,
      note,
    };
    const res = await onSave(payload);
    if (res.ok) {
      onClose();
      return;
    }
    setError(res.message ?? "Could not record payment.");
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/45 px-5 py-10 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease }}
        role="dialog"
        aria-modal="true"
        aria-label="Record manual payment"
        className="relative w-full max-w-lg rounded-[2rem] border border-white/70 bg-white/95 p-7 shadow-[0_40px_90px_-30px_rgb(15_23_42/0.55)] backdrop-blur-2xl sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          disabled={busy}
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-ink/12 text-ink-3 transition-all hover:border-ink/30 hover:text-ink disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="font-display text-[0.6rem] font-bold uppercase tracking-[0.3em] text-gold-deep">
          {isWithdrawal ? "Money out" : "Money in"}
        </p>
        <h3 className="mt-1 font-display text-[1.4rem] font-extrabold tracking-[-0.02em] text-ink">
          {isWithdrawal ? "Record withdrawal" : "Record payment"}
        </h3>
        <p className="mt-1 text-[0.82rem] text-ink-3">
          Offline ledger entry — no real gateway is charged.
        </p>

        {/* Type toggle */}
        <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-ink/[0.04] p-1">
          {(["DEPOSIT", "WITHDRAWAL"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "rounded-xl py-2.5 font-display text-[0.8rem] font-bold transition-all",
                type === t
                  ? t === "WITHDRAWAL"
                    ? "bg-white text-rose-600 shadow-sm"
                    : "bg-white text-brand-deep shadow-sm"
                  : "text-ink-3 hover:text-ink"
              )}
            >
              {t === "DEPOSIT" ? "Deposit" : "Withdrawal"}
            </button>
          ))}
        </div>

        {/* Method buttons */}
        <div className="mt-4">
          <span className="mb-1.5 block font-display text-[0.66rem] font-bold uppercase tracking-[0.2em] text-ink-2">
            Method
          </span>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {METHODS.map((m) => {
              const Icon = METHOD_ICONS[m.key] ?? Banknote;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMethod(m.key)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border px-1 py-2.5 text-[0.66rem] font-bold transition-all",
                    method === m.key
                      ? "border-brand/50 bg-brand/[0.07] text-brand-deep"
                      : "border-ink/10 bg-white text-ink-3 hover:border-brand/30 hover:text-ink"
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.9} />
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <Field label="Amount (PKR)">
            <input
              className={inputCls}
              type="number"
              min="0"
              inputMode="decimal"
              placeholder={isWithdrawal ? "e.g. 5000" : "e.g. 12000"}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
          {!isWithdrawal ? (
            <>
              <Field label="Student name (optional)">
                <input
                  className={inputCls}
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Ali Raza"
                />
              </Field>
              <Field label="Student email (optional)">
                <input
                  className={inputCls}
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="student@example.com"
                />
              </Field>
            </>
          ) : null}
          <Field label="Note (optional)">
            <textarea
              className={cn(inputCls, "min-h-[3.5rem] resize-none")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={isWithdrawal ? "e.g. Exam fee refund" : "e.g. Monthly fee via EasyPaisa"}
            />
          </Field>
        </div>

        {error ? (
          <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-[0.78rem] font-semibold text-rose-600">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="inline-flex h-11 items-center rounded-full border border-ink/12 px-5 font-display text-[0.78rem] font-bold text-ink-2 transition-all hover:border-ink/30 hover:text-ink disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className={cn(
              "inline-flex h-11 items-center gap-2 rounded-full px-6 font-display text-[0.78rem] font-bold text-white shadow-[0_12px_28px_-12px_rgb(110_90_224/0.8)] transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-60",
              isWithdrawal
                ? "bg-gradient-to-r from-rose-600 to-rose-500"
                : "bg-gradient-to-r from-brand-deep to-brand-magenta"
            )}
          >
            {busy ? "Saving…" : isWithdrawal ? "Record withdrawal" : "Record payment"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
