"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { History, RefreshCw, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionTitle } from "./ui";

interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  targetType: string;
  targetLabel: string | null;
  detail: string | null;
  createdAt: string;
}

const ease = [0.16, 1, 0.3, 1] as const;

const ACTION_META: Record<string, { cls: string; label: string }> = {
  APPROVE: { cls: "border-emerald-300 bg-emerald-50 text-emerald-700", label: "APPROVE" },
  REJECT: { cls: "border-rose-300 bg-rose-50 text-rose-600", label: "REJECT" },
  CONFIRM: { cls: "border-emerald-300 bg-emerald-50 text-emerald-700", label: "CONFIRM" },
  REQUEST_PAYMENT: { cls: "border-amber-300 bg-amber-50 text-amber-700", label: "REQ PAYMENT" },
  REFUND: { cls: "border-sky-300 bg-sky-50 text-sky-700", label: "REFUND" },
  CREATE: { cls: "border-emerald-300 bg-emerald-50 text-emerald-700", label: "CREATE" },
  UPDATE: { cls: "border-violet-300 bg-violet-50 text-violet-700", label: "UPDATE" },
  DELETE: { cls: "border-slate-300 bg-slate-50 text-slate-600", label: "DELETE" },
};

export function AdminAuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  const fetchAll = useCallback(() => {
    fetch("/api/admin/audit-log")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.entries)) {
          setEntries(data.entries);
          setLoaded(true);
        }
      })
      .catch(() => {})
      .finally(() => setBusy(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const refresh = () => {
    setBusy(true);
    fetchAll();
  };

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionTitle kicker="Security · audit" title="Activity Log" />
        <button
          type="button"
          onClick={refresh}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full border border-ink/12 bg-white/70 px-4 py-2.5 font-display text-[0.72rem] font-bold text-ink-2 transition-all hover:border-brand/45 hover:text-brand-deep disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", busy && "animate-spin")} /> Refresh
        </button>
      </div>

      <p className="flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-widest text-ink-3">
        <ShieldCheck className="h-4 w-4 text-emerald-500" />
        Immutable record of admin decisions — approvals, refunds, content changes
      </p>

      {!loaded ? (
        <div className="glass-dash grid place-items-center overflow-hidden rounded-[1.75rem] px-6 py-20 text-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand/25 border-t-brand-deep" />
          <p className="mt-4 font-mono text-[0.72rem] text-ink-3">Loading activity…</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="glass-dash grid place-items-center overflow-hidden rounded-[1.75rem] px-6 py-16 text-center">
          <History className="h-10 w-10 text-ink-3/40" />
          <p className="mt-4 font-display text-[0.95rem] font-bold text-ink-2">No activity yet</p>
          <p className="font-mono text-[0.7rem] text-ink-3">Admin actions will be logged here automatically.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {entries.map((e, i) => {
            const m = ACTION_META[e.action] ?? { cls: "border-ink/12 bg-white/70 text-ink-2", label: e.action };
            return (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease, delay: Math.min(0.15, i * 0.02) }}
                className="glass-dash flex flex-wrap items-center gap-3 rounded-[1.25rem] px-5 py-4"
              >
                <span className={cn("shrink-0 rounded-full border px-3 py-1 font-mono text-[0.6rem] font-bold tracking-wider", m.cls)}>
                  {m.label}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-[0.84rem] font-bold text-ink">
                    {e.targetType} {e.targetLabel ? `· ${e.targetLabel}` : ""}
                  </p>
                  {e.detail ? (
                    <p className="truncate font-mono text-[0.66rem] text-ink-3">{e.detail}</p>
                  ) : null}
                </div>
                <div className="shrink-0 text-end">
                  <p className="font-mono text-[0.66rem] font-bold text-ink-2">{e.actor}</p>
                  <p className="font-mono text-[0.6rem] text-ink-3">
                    {new Date(e.createdAt).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}