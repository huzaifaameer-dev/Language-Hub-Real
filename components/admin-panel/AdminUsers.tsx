"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  CalendarDays,
  Download,
  Mail,
  Shield,
  UserRound,
} from "lucide-react";
import type { AdminUser } from "./types";
import { AvatarInitial, FilterChips, Pager, SearchBox, SectionTitle, downloadCsv } from "./ui";

type Filter = "ALL" | "VERIFIED" | "UNVERIFIED";

const ease = [0.16, 1, 0.3, 1] as const;
const PAGE_SIZE = 15;

export function AdminUsers({ items }: { items: AdminUser[] }) {
  const [rows, setRows] = useState<AdminUser[]>(items);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  // The tab is self-sufficient: if the SSR shell carried no users (the admin
  // page now derisks first paint by skipping database work), fetch them here.
  useEffect(() => {
    if (items.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRows(items);
      return;
    }
    setBusy(true);
    fetch("/api/admin/users", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && Array.isArray(d.users)) setRows(d.users as AdminUser[]);
      })
      .catch(() => {})
      .finally(() => setBusy(false));
  }, [items]);

  const setFilterPageReset = (f: Filter) => {
    setFilter(f);
    setPage(1);
  };

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((u) => {
      if (filter === "VERIFIED" && !u.emailVerified) return false;
      if (filter === "UNVERIFIED" && u.emailVerified) return false;
      if (!q) return true;
      const hay = `${u.name} ${u.email} ${u.role}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, filter, query]);

  const totalPages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const pageIdx = Math.min(page, totalPages);
  const visible = matches.slice((pageIdx - 1) * PAGE_SIZE, pageIdx * PAGE_SIZE);

  const exportCsv = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(
      `lh-students-${stamp}.csv`,
      ["Name", "Email", "Email verified", "Role", "Joined"],
      matches.map((u) => [
        u.name,
        u.email,
        u.emailVerified ? "Yes" : "No",
        u.role,
        new Date(u.createdAt).toISOString(),
      ])
    );
  };

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionTitle kicker="Directory · students" title="User Directory" />
        <FilterChips<Filter>
          options={[
            { key: "ALL", label: "ALL", count: rows.length },
            { key: "VERIFIED", label: "VERIFIED", count: rows.filter((u) => u.emailVerified).length },
            { key: "UNVERIFIED", label: "UNVERIFIED", count: rows.filter((u) => !u.emailVerified).length },
          ]}
          value={filter}
          onChange={setFilterPageReset}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchBox
          value={query}
          onChange={(q) => {
            setQuery(q);
            setPage(1);
          }}
          placeholder="Search name, email, role…"
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

      {visible.length === 0 ? (
        <div className="glass-dash grid place-items-center overflow-hidden rounded-[1.75rem] px-6 py-16 text-center">
          <p className="font-display text-4xl font-extrabold text-slate-200">∅</p>
          <p className="mt-3 font-display text-[0.95rem] font-bold text-ink-2">No users here</p>
          <p className="font-mono text-[0.7rem] text-ink-3">Accounts from the registry land in this directory.</p>
        </div>
      ) : (
        visible.map((u, i) => (
          <motion.article
            key={u.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease, delay: Math.min(0.12, i * 0.03) }}
            className="glass-dash relative overflow-hidden rounded-[1.5rem] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-20px_rgb(110_90_224/0.4)]"
          >
            <span aria-hidden className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-brand/80 to-brand-deep" />
            <div className="flex flex-wrap items-center gap-4 px-5 py-4">
              {u.image ? (
                <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl ring-1 ring-slate-200">
                  <Image
                    src={u.image}
                    alt=""
                    fill
                    sizes="44px"
                    className="object-cover"
                    unoptimized
                  />
                </span>
              ) : (
                <AvatarInitial name={u.name} />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 pr-8">
                  <h3 className="font-display text-[1.02rem] font-extrabold text-ink">{u.name}</h3>
                  {u.emailVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-mono text-[0.6rem] font-bold text-emerald-700">
                      <BadgeCheck className="h-3 w-3" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 font-mono text-[0.6rem] font-bold text-amber-700">
                      Unverified
                    </span>
                  )}
                  {u.role === "ADMIN" ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-brand/20 bg-brand/8 px-2.5 py-0.5 font-mono text-[0.6rem] font-bold text-brand-deep">
                      <Shield className="h-3 w-3" /> {u.role}
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[0.68rem] text-ink-3">
                  <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{u.email}</span>
                  <span className="inline-flex items-center gap-1"><UserRound className="h-3 w-3" />{u.role}</span>
                  <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />
                    {new Date(u.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </p>
              </div>
            </div>
          </motion.article>
        ))
      )}

      {matches.length > 0 ? (
        <Pager page={pageIdx} pageSize={PAGE_SIZE} total={matches.length} onPage={setPage} />
      ) : null}
    </section>
  );
}