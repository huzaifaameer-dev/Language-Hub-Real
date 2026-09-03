"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Download, RefreshCw, RotateCcw } from "lucide-react";
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

  const totalRevenue = payments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionTitle kicker="Finance · ledger" title="Payments" />
        <div className="flex items-center gap-2">
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
          <p className="font-mono text-[0.58rem] text-ink-3">collected (PKR)</p>
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
                        <span className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[0.58rem] font-bold uppercase tracking-wider",
                          p.provider === "stripe"
                            ? "border-violet-200 bg-violet-50 text-violet-700"
                            : "border-sky-200 bg-sky-50 text-sky-700"
                        )}>
                          <CreditCard className="h-3 w-3" />
                          {p.provider}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 font-display text-[0.88rem] font-extrabold text-ink">
                        Rs. {p.amount.toLocaleString()} <span className="font-mono text-[0.6rem] text-ink-3">{p.currency}</span>
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
    </section>
  );
}
