"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Eye, EyeOff, ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionTitle } from "./ui";

interface TeamRow {
  id: string;
  name: string;
  role: string;
  headline: string | null;
  credentials: string[];
  bio: string;
  focus: string[];
  image: string | null;
  order: number;
  active: boolean;
  ceo: boolean;
  createdAt: string;
}

const ease = [0.16, 1, 0.3, 1] as const;

/** Split a comma-separated editor string into trimmed tags. */
const splitList = (s: string): string[] =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

export function AdminTeam() {
  const [items, setItems] = useState<TeamRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<TeamRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchAll = useCallback(() => {
    fetch("/api/admin/team", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.members)) {
          setItems(data.members as TeamRow[]);
          setLoaded(true);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const liveCount = useMemo(() => items.filter((t) => t.active).length, [items]);
  const ceoCount = useMemo(() => items.filter((t) => t.ceo).length, [items]);

  const patch = async (row: TeamRow, payload: Record<string, unknown>) => {
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, payload }),
      });
      if (res.ok) fetchAll();
      else {
        const d = (await res.json().catch(() => ({}))) as { message?: string };
        setActionError(d.message ?? "Update failed.");
      }
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = (row: TeamRow) => void patch(row, { active: !row.active });
  const toggleCeo = (row: TeamRow) => void patch(row, { ceo: !row.ceo });

  const changeOrder = (row: TeamRow, raw: string) => {
    const n = Math.max(0, Math.round(Number(raw)));
    if (Number.isNaN(n)) return;
    setItems((prev) =>
      prev.map((t) => (t.id === row.id ? { ...t, order: n } : t))
    );
    void patch(row, { order: n });
  };

  const remove = async (row: TeamRow) => {
    if (!window.confirm(`Delete team profile "${row.name}"?`)) return;
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/team?id=${row.id}`, { method: "DELETE" });
      if (res.ok) fetchAll();
      else setActionError("Delete failed.");
    } catch {
      setActionError("Network error — could not delete.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionTitle kicker="People · faculty" title="Team Members" />
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setEditing(null);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-deep to-brand-deep px-4 py-2.5 font-display text-[0.72rem] font-bold text-white shadow-[0_14px_30px_-12px_rgb(110_90_224/0.8)] hover:brightness-110"
        >
          <Plus className="h-3.5 w-3.5" /> New member
        </button>
      </div>

      <p className="font-mono text-[0.62rem] uppercase tracking-widest text-ink-3">
        {liveCount} of {items.length} shown on /team · {ceoCount} CEO profile{ceoCount === 1 ? "" : "s"} (featured block) · edits publish instantly
      </p>

      {actionError ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 font-mono text-[0.72rem] font-bold text-rose-600">
          ! {actionError}
        </p>
      ) : null}

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
          <p className="mt-4 font-mono text-[0.72rem] text-ink-3">Loading team members…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="glass-dash grid place-items-center overflow-hidden rounded-[1.75rem] px-6 py-16 text-center">
          <p className="font-display text-4xl font-extrabold text-slate-200">∅</p>
          <p className="mt-3 font-display text-[0.95rem] font-bold text-ink-2">No team members yet</p>
          <p className="font-mono text-[0.7rem] text-ink-3">Add your teachers and the CEO — they&apos;ll appear on the team page.</p>
        </div>
      ) : (
        [...items].sort((a, b) => Number(b.ceo) - Number(a.ceo) || a.order - b.order).map((t, i) => (
          <motion.article
            key={t.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease, delay: Math.min(0.12, i * 0.03) }}
            className={cn(
              "glass-dash flex flex-wrap items-center gap-4 rounded-[1.25rem] p-5 transition-all",
              t.active ? "" : "opacity-55",
              t.ceo && "ring-2 ring-gold/60"
            )}
          >
            <div className="flex flex-col items-center gap-1">
              <input
                type="number"
                defaultValue={t.order}
                min={0}
                onBlur={(e) => changeOrder(t, e.target.value)}
                title="Display order"
                className="grid w-12 place-items-center rounded-lg border border-ink/12 bg-white px-1 py-1 text-center font-display text-[0.85rem] font-bold text-ink outline-none focus:border-brand"
              />
              <span className="font-mono text-[0.5rem] uppercase tracking-wider text-ink-3">#order</span>
            </div>
            <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-brand/20 to-brand-magenta/20 font-display text-sm font-extrabold text-brand-deep">
              {t.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.image} alt={`${t.name} portrait`} className="h-full w-full object-cover" />
              ) : (
                t.name.split(" ").map((w) => w[0] ?? "").slice(0, 2).join("")
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-[0.98rem] font-extrabold text-ink">{t.name}</h3>
                {t.ceo ? (
                  <span className="rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 font-mono text-[0.58rem] font-black uppercase tracking-widest text-gold-deep">
                    CEO
                  </span>
                ) : null}
                <span className="rounded-full border border-ink/12 px-2 py-0.5 font-mono text-[0.6rem] text-ink-2">
                  {t.role}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-[0.86rem] text-ink-2">{t.bio}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                title={t.ceo ? "Remove CEO status" : "Mark as CEO (featured block)"}
                onClick={() => toggleCeo(t)}
                disabled={busy}
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-full border p-0.5 transition-all disabled:opacity-50",
                  t.ceo
                    ? "border-gold/50 bg-gold/15 text-gold-deep"
                    : "border-ink/12 text-ink-2 hover:border-gold/40 hover:text-gold-deep"
                )}
                aria-label={t.ceo ? "Remove CEO status" : "Mark as CEO"}
              >
                <span className="font-display text-[0.7rem] font-black">CEO</span>
              </button>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[0.58rem] font-bold tracking-widest",
                  t.active
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-slate-300 bg-slate-100 text-slate-500"
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", t.active ? "bg-emerald-500" : "bg-slate-400")} />
                {t.active ? "LIVE" : "HIDDEN"}
              </span>
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

function Editor({ existing, onDone }: { existing: TeamRow | null; onDone: () => void }) {
  const [name, setName] = useState(existing?.name ?? "");
  const [role, setRole] = useState(existing?.role ?? "");
  const [headline, setHeadline] = useState(existing?.headline ?? "");
  const [bio, setBio] = useState(existing?.bio ?? "");
  const [credentials, setCredentials] = useState(existing?.credentials.join(", ") ?? "");
  const [focus, setFocus] = useState(existing?.focus.join(", ") ?? "");
  const [image, setImage] = useState<string | null>(existing?.image ?? null);
  const [order, setOrder] = useState<number>(existing?.order ?? 0);
  const [active, setActive] = useState<boolean>(existing ? existing.active : true);
  const [ceo, setCeo] = useState<boolean>(!!existing?.ceo);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const resizeImage = (file: File, max: number): Promise<string> =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error("Canvas unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL(file.type === "image/png" ? "image/png" : "image/webp", 0.85));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Bad image"));
      };
      img.src = url;
    });

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setImage(await resizeImage(file, 320));
    } catch {
      // ignore bad pick
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name,
        role,
        headline: headline.trim() || null,
        bio,
        credentials: splitList(credentials),
        focus: splitList(focus),
        image,
        order,
        active,
        ceo,
      };
      const url = "/api/admin/team";
      const opts: RequestInit = { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) };
      if (existing) {
        opts.method = "PATCH";
        opts.body = JSON.stringify({ id: existing.id, payload });
      }
      const res = await fetch(url, opts);
      if (res.ok) onDone();
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-ink/12 bg-white/70 px-4 py-2.5 text-[0.85rem] outline-none focus:border-brand";

  return (
    <form onSubmit={save} className="rounded-2xl border border-brand/20 bg-white/70 p-5 backdrop-blur-md">
      <p className="font-display text-[0.85rem] font-extrabold text-ink">
        {existing ? `Edit ${existing.name}` : "New team member"}
      </p>

      <div className="mt-4 flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-dashed border-brand/40 bg-brand/[0.05] text-brand-deep transition-colors hover:border-brand hover:bg-brand/[0.1]"
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={`${name || "Member"} portrait`} className="h-full w-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-1 text-[0.55rem] font-bold uppercase tracking-widest">
              <ImagePlus className="h-5 w-5" />
              Photo
            </span>
          )}
        </button>
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-1.5 font-display text-[0.7rem] font-bold text-ink-2 transition-all hover:border-brand/50 hover:text-brand-deep"
          >
            <ImagePlus className="h-3.5 w-3.5" />
            {image ? "Change photo" : "Upload portrait"}
          </button>
          {image ? (
            <button
              type="button"
              onClick={() => setImage(null)}
              className="inline-flex items-center gap-1.5 font-mono text-[0.6rem] font-bold uppercase tracking-widest text-rose-500 hover:text-rose-600"
            >
              <X className="h-3 w-3" /> Remove photo
            </button>
          ) : null}
          <p className="font-mono text-[0.58rem] text-ink-3">Auto-resized · used on the /team page</p>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Full name" className={inputCls} />
        <input value={role} onChange={(e) => setRole(e.target.value)} required placeholder="Role (e.g. IELTS & PTE Trainer)" className={inputCls} />
        <input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="CEO headline (e.g. MS. JAVARIA MALIK)" maxLength={90} className={inputCls} />
        <input value={credentials} onChange={(e) => setCredentials(e.target.value)} placeholder="Credentials, comma separated (IELTS Band 8.0, 5+ yrs)" className={inputCls} />
      </div>
      <textarea value={bio} onChange={(e) => setBio(e.target.value)} required placeholder="Short bio…" rows={3} maxLength={1400} className={cn(inputCls, "mt-3 resize-none")} />
      <input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="Focus areas, comma separated (IELTS Writing, Pronunciation)" className={cn(inputCls, "mt-3")} />

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <label className="inline-flex items-center gap-2 rounded-full border border-ink/12 bg-white/70 px-4 py-2 font-display text-[0.72rem] font-bold text-ink-2">
          Order #
          <input
            type="number"
            value={order}
            min={0}
            onChange={(e) => setOrder(Math.max(0, Math.round(Number(e.target.value) || 0)))}
            className="w-16 rounded-lg border border-ink/12 px-2 py-1 text-center text-[0.8rem] outline-none focus:border-brand"
          />
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-2 font-display text-[0.72rem] font-bold text-gold-deep transition-all hover:bg-gold/15">
          <input type="checkbox" checked={ceo} onChange={(e) => setCeo(e.target.checked)} className="accent-gold-deep" />
          CEO — featured flagship block
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 font-display text-[0.72rem] font-bold text-emerald-700 transition-all hover:bg-emerald-100">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="accent-emerald-600" />
          Show on /team
        </label>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className="inline-flex items-center gap-2 rounded-full border border-ink/12 px-5 py-2.5 font-display text-[0.72rem] font-bold text-ink-2 hover:bg-white"
        >
          <X className="h-4 w-4" /> Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-deep to-brand-deep px-5 py-2.5 font-display text-[0.72rem] font-bold text-white hover:brightness-110 disabled:opacity-50"
        >
          {saving ? <Spin /> : <Check className="h-4 w-4" />} {existing ? "Save changes" : "Add member"}
        </button>
      </div>
    </form>
  );
}

function Spin() {
  return <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />;
}