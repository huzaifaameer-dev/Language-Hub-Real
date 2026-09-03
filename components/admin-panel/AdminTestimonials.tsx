"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Eye, EyeOff, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionTitle, StatusPill } from "./ui";

interface TestimonialRow {
  id: string;
  name: string;
  role: string;
  quote: string;
  outcome: string;
  course: string;
  active: boolean;
  order: number;
}

const ease = [0.16, 1, 0.3, 1] as const;

export function AdminTestimonials() {
  const [items, setItems] = useState<TestimonialRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<TestimonialRow | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchAll = useCallback(() => {
    fetch("/api/admin/testimonials")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.testimonials)) {
          setItems(data.testimonials as TestimonialRow[]);
          setLoaded(true);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const activeCount = useMemo(() => items.filter((t) => t.active).length, [items]);

  const toggleActive = async (row: TestimonialRow) => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/testimonials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, payload: { active: !row.active } }),
      });
      if (res.ok) fetchAll();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row: TestimonialRow) => {
    if (!window.confirm(`Delete testimonial from ${row.name}?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/testimonials?id=${row.id}`, { method: "DELETE" });
      if (res.ok) fetchAll();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionTitle kicker="Trust · social proof" title="Testimonials" />
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setEditing(null);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-deep to-brand-deep px-4 py-2.5 font-display text-[0.72rem] font-bold text-white shadow-[0_14px_30px_-12px_rgb(110_90_224/0.8)] hover:brightness-110"
        >
          <Plus className="h-3.5 w-3.5" /> New testimonial
        </button>
      </div>

      <p className="font-mono text-[0.62rem] uppercase tracking-widest text-ink-3">
        {activeCount} of {items.length} shown on the website · edits publish instantly
      </p>

      {creating || editing ? (
        <Editor
          existing={editing}
          onDone={() => {
            setCreating(false);
            setEditing(null);
            fetchAll();
          }}
        />
      ) : null}

      {!loaded ? (
        <div className="glass-dash grid place-items-center overflow-hidden rounded-[1.75rem] px-6 py-20 text-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand/25 border-t-brand-deep" />
          <p className="mt-4 font-mono text-[0.72rem] text-ink-3">Loading testimonials…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="glass-dash grid place-items-center overflow-hidden rounded-[1.75rem] px-6 py-16 text-center">
          <p className="font-display text-4xl font-extrabold text-slate-200">∅</p>
          <p className="mt-3 font-display text-[0.95rem] font-bold text-ink-2">No testimonials yet</p>
          <p className="font-mono text-[0.7rem] text-ink-3">Add your first review to build trust.</p>
        </div>
      ) : (
        items.map((t, i) => (
          <motion.article
            key={t.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease, delay: Math.min(0.12, i * 0.03) }}
            className={cn(
              "glass-dash flex flex-wrap items-center gap-4 rounded-[1.25rem] p-5 transition-all",
              t.active ? "" : "opacity-55"
            )}
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand/20 to-brand-magenta/20 font-display text-sm font-extrabold text-brand-deep">
              {t.name.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-[0.98rem] font-extrabold text-ink">{t.name}</h3>
                <span className="rounded-full border border-ink/12 px-2 py-0.5 font-mono text-[0.6rem] text-ink-2">
                  {t.course}
                </span>
                {t.outcome ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 font-mono text-[0.58rem] font-bold text-gold-deep">
                    <Star className="h-3 w-3" /> {t.outcome}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 line-clamp-2 text-[0.86rem] text-ink-2">“{t.quote}”</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill status={t.active ? "APPROVED" : "REJECTED"} />
              <button
                type="button"
                title={t.active ? "Hide from site" : "Show on site"}
                onClick={() => toggleActive(t)}
                disabled={busy}
                className="grid h-9 w-9 place-items-center rounded-full border border-ink/12 text-ink-2 transition-all hover:border-brand/40 hover:text-brand-deep disabled:opacity-50"
              >
                {t.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                type="button"
                title="Edit"
                onClick={() => {
                  setEditing(t);
                  setCreating(false);
                }}
                className="grid h-9 w-9 place-items-center rounded-full border border-ink/12 text-ink-2 transition-all hover:border-brand/40 hover:text-brand-deep"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                title="Delete"
                onClick={() => remove(t)}
                disabled={busy}
                className="grid h-9 w-9 place-items-center rounded-full border border-rose-200 text-rose-500 transition-all hover:bg-rose-50 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </motion.article>
        ))
      )}
    </section>
  );
}

function Editor({ existing, onDone }: { existing: TestimonialRow | null; onDone: () => void }) {
  const [name, setName] = useState(existing?.name ?? "");
  const [course, setCourse] = useState(existing?.course ?? "");
  const [quote, setQuote] = useState(existing?.quote ?? "");
  const [outcome, setOutcome] = useState(existing?.outcome ?? "");
  const [role, setRole] = useState(existing?.role ?? "Student");
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = "/api/admin/testimonials";
      const opts: RequestInit = { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, course, quote, outcome, role }) };
      if (existing) {
        opts.method = "PATCH";
        opts.body = JSON.stringify({ id: existing.id, payload: { name, course, quote, outcome, role } });
      }
      const res = await fetch(url, opts);
      if (res.ok) onDone();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="rounded-2xl border border-brand/20 bg-white/70 p-5 backdrop-blur-md">
      <p className="font-display text-[0.85rem] font-extrabold text-ink">
        {existing ? "Edit testimonial" : "New testimonial"}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Full name"
          className="rounded-xl border border-ink/12 bg-white/70 px-4 py-2.5 text-[0.85rem] outline-none focus:border-brand" />
        <input value={course} onChange={(e) => setCourse(e.target.value)} required placeholder="Course (e.g. IELTS)" maxLength={80}
          className="rounded-xl border border-ink/12 bg-white/70 px-4 py-2.5 text-[0.85rem] outline-none focus:border-brand" />
        <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role (e.g. Student, Working professional)"
          className="rounded-xl border border-ink/12 bg-white/70 px-4 py-2.5 text-[0.85rem] outline-none focus:border-brand" />
        <input value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder="Outcome (e.g. Band 7.5 target reached)"
          className="rounded-xl border border-ink/12 bg-white/70 px-4 py-2.5 text-[0.85rem] outline-none focus:border-brand" />
      </div>
      <textarea value={quote} onChange={(e) => setQuote(e.target.value)} required placeholder="Their quote…" rows={3} maxLength={600}
        className="mt-3 w-full resize-none rounded-xl border border-ink/12 bg-white/70 px-4 py-2.5 text-[0.85rem] outline-none focus:border-brand" />
      <div className="mt-4 flex items-center justify-end gap-2">
        <button type="button" onClick={onDone}
          className="inline-flex items-center gap-2 rounded-full border border-ink/12 px-5 py-2.5 font-display text-[0.72rem] font-bold text-ink-2 hover:bg-white">
          <X className="h-4 w-4" /> Cancel
        </button>
        <button type="submit" disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-deep to-brand-deep px-5 py-2.5 font-display text-[0.72rem] font-bold text-white hover:brightness-110 disabled:opacity-50">
          {saving ? <Spin /> : <Check className="h-4 w-4" />} {existing ? "Save changes" : "Add review"}
        </button>
      </div>
    </form>
  );
}

function Spin() {
  return <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />;
}
