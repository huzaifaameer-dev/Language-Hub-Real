"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import {
  Banknote,
  BookOpen,
  Check,
  Clock,
  Pencil,
  Plus,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLiveSync } from "@/lib/use-live";
import { formatPKR } from "@/lib/course-data";
import type { AdminBatch, AdminCourse } from "./types";
import { GlassPanel } from "./ui";

const ease = [0.16, 1, 0.3, 1] as const;

interface BatchRow {
  name: string;
  time: string;
  seatsTotal: number;
}

interface FormState {
  name: string;
  tagline: string;
  description: string;
  fee: string;
  duration: string;
  teacher: string;
  schedule: string;
  order: string;
  active: boolean;
  batches: BatchRow[];
}

const emptyForm: FormState = {
  name: "",
  tagline: "",
  description: "",
  fee: "0",
  duration: "",
  teacher: "",
  schedule: "",
  order: "99",
  active: true,
  batches: [{ name: "Evening", time: "6:00 PM – 8:00 PM", seatsTotal: 20 }],
};

function toForm(c: AdminCourse): FormState {
  return {
    name: c.name,
    tagline: c.tagline ?? "",
    description: c.description ?? "",
    fee: String(c.fee ?? 0),
    duration: c.duration ?? "",
    teacher: c.teacher ?? "",
    schedule: c.schedule ?? "",
    order: String(c.order ?? 99),
    active: c.active,
    batches: (c.batches ?? []).map((b: AdminBatch) => ({
      name: b.name,
      time: b.time,
      seatsTotal: b.seatsTotal,
    })),
  };
}

export function AdminCourses() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminCourse | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/admin/courses");
      if (!res.ok) throw new Error("Failed to load courses.");
      const data = (await res.json()) as { courses: AdminCourse[] };
      setCourses(data.courses);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useLiveSync(() => load(true));

  const flash = useCallback((id: string) => {
    setSavedId(id);
    setTimeout(() => setSavedId((prev) => (prev === id ? null : prev)), 2600);
  }, []);

  const createOrUpdate = async (payload: unknown, id?: string) => {
    setBusy(true);
    try {
      const res = await fetch(
        id ? `/api/admin/courses/${id}` : "/api/admin/courses",
        {
          method: id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, message: data.message ?? "Save failed." };
      }
      await load(true);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: (err as Error).message };
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (c: AdminCourse) => {
    const res = await createOrUpdate({ active: !c.active }, c.id);
    if (res.ok) flash(c.id);
  };

  const remove = async (c: AdminCourse) => {
    if (!window.confirm(`Remove "${c.name}"? Enrolled ones will be hidden instead.`)) return;
    const res = await fetch(`/api/admin/courses/${c.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? "Delete failed.");
      return;
    }
    await load(true);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-3 font-display text-[0.62rem] font-bold uppercase tracking-[0.4em] text-brand-deep">
            <span aria-hidden className="h-px w-7 bg-gradient-to-r from-brand/80 to-transparent" />
            Course catalog
          </p>
          <h1 className="mt-1.5 font-display text-[clamp(1.6rem,3.6vw,2.3rem)] font-extrabold tracking-[-0.03em] text-ink">
            CLASS <span className="indigo-text-shimmer">ROSTER.</span>
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setEditing({ id: "" } as AdminCourse)}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-deep to-brand-deep px-4 py-2.5 font-display text-[0.78rem] font-bold text-white shadow-[0_14px_30px_-12px_rgb(110_90_224/0.8)] transition-all hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" strokeWidth={2.4} /> Add course
        </button>
      </div>

      {error ? (
        <GlassPanel>
          <p className="font-mono text-[0.8rem] text-rose-600">{error}</p>
        </GlassPanel>
      ) : null}

      {loading && courses.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-3xl bg-ink/8" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <GlassPanel>
          <p className="font-mono text-[0.8rem] text-ink-3">
            No courses yet — add your first one.
          </p>
        </GlassPanel>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {courses.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease, delay: Math.min(0.25, i * 0.05) }}
              className={cn(
                "relative overflow-hidden rounded-3xl border bg-white/80 p-5 backdrop-blur-md transition-all",
                savedId === c.id
                  ? "border-emerald-300 ring-4 ring-emerald-500/15"
                  : "border-white/70"
              )}
            >
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl",
                  c.active ? "bg-brand/10" : "bg-slate-400/10"
                )}
              />
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "grid h-11 w-11 shrink-0 place-items-center rounded-2xl",
                      c.active ? "bg-brand-deep/10 text-brand-deep" : "bg-ink/8 text-ink-3"
                    )}
                  >
                    <BookOpen className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <div>
                    <p className="font-display text-[0.98rem] font-extrabold text-ink">
                      {c.name}
                    </p>
                    <p className="font-mono text-[0.6rem] uppercase tracking-widest text-ink-3">
                      {c.active ? "live" : "archived"} · order {c.order}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => toggleActive(c)}
                    title={c.active ? "Archive" : "Publish"}
                    className={cn(
                      "grid h-8 w-8 place-items-center rounded-full border transition-all",
                      c.active
                        ? "border-emerald-300 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        : "border-ink/12 bg-slate-50 text-ink-3 hover:text-ink-2"
                    )}
                  >
                    <Check className="h-4 w-4" strokeWidth={2.4} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(c)}
                    title="Edit"
                    className="grid h-8 w-8 place-items-center rounded-full border border-ink/12 bg-white text-ink-2 transition-all hover:border-brand/45 hover:text-brand-deep"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(c)}
                    title="Remove"
                    className="grid h-8 w-8 place-items-center rounded-full border border-ink/12 bg-white text-rose-400 transition-all hover:border-rose-300 hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="relative mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Meta icon={<Banknote className="h-3.5 w-3.5" />} label="Fee" value={formatPKR(c.fee ?? 0)} />
                <Meta icon={<Clock className="h-3.5 w-3.5" />} label="Duration" value={c.duration || "—"} />
                <Meta icon={<UserRound className="h-3.5 w-3.5" />} label="Teacher" value={c.teacher || "—"} />
                <Meta icon={<BookOpen className="h-3.5 w-3.5" />} label="Schedule" value={c.schedule || "—"} />
              </div>

              <div className="relative mt-4 flex flex-col gap-2">
                {(c.batches ?? []).map((b, i) => (
                  <div
                    key={`${b.name}-${i}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-display text-[0.74rem] font-bold text-ink">
                        {b.name}
                      </span>
                      {b.time ? (
                        <span className="font-mono text-[0.62rem] text-ink-3">{b.time}</span>
                      ) : null}
                    </div>
                    <span
                      className={cn(
                        "font-mono text-[0.64rem] font-bold",
                        b.full ? "text-rose-600" : b.seatsLeft === 0 ? "text-rose-500" : "text-emerald-600"
                      )}
                    >
                      {b.full || b.seatsLeft === 0 ? "FULL" : `${b.seatsUsed ?? 0}/${b.seatsTotal} seats`}
                    </span>
                  </div>
                ))}
              </div>

              <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-cream">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand/80 via-brand-deep to-brand-magenta transition-all duration-700"
                  style={{
                    width: `${Math.min(100, Math.round(((c.seatsUsed ?? 0) / Math.max(1, c.seatsTotal ?? 1)) * 100))}%`,
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {editing ? (
        <CourseEditor
          course={editing}
          busy={busy}
          onClose={() => setEditing(null)}
          onSave={async (payload) => {
            const id = editing.id || undefined;
            const res = await createOrUpdate(payload, id);
            if (!res.ok) return res;
            setEditing(null);
            return { ok: true };
          }}
        />
      ) : null}
    </div>
  );
}

function Meta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white/80 px-2.5 py-2">
      <p className="flex items-center gap-1 font-mono text-[0.55rem] uppercase tracking-widest text-ink-3">
        {icon} {label}
      </p>
      <p className="mt-0.5 truncate font-display text-[0.76rem] font-extrabold text-ink" title={value}>
        {value}
      </p>
    </div>
  );
}

function CourseEditor({
  course,
  busy,
  onClose,
  onSave,
}: {
  course: AdminCourse;
  busy: boolean;
  onClose: () => void;
  onSave: (form: Record<string, unknown>) => Promise<{ ok: boolean; message?: string }>;
}) {
  const isNew = !course.id;
  const [form, setForm] = useState<FormState>(() => (isNew ? emptyForm : toForm(course)));
  const [saveError, setSaveError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const setBatch = (i: number, patch: Partial<BatchRow>) =>
    setForm((f) => ({
      ...f,
      batches: f.batches.map((b, idx) => (idx === i ? { ...b, ...patch } : b)),
    }));

  const submit = async () => {
    setSaveError(null);
    const payload = {
      name: form.name,
      tagline: form.tagline,
      description: form.description,
      fee: Number(form.fee) || 0,
      duration: form.duration,
      teacher: form.teacher,
      schedule: form.schedule,
      order: Number(form.order) || 99,
      active: form.active,
      batches: form.batches.map((b) => ({
        name: b.name,
        time: b.time,
        seatsTotal: Number(b.seatsTotal) || 1,
      })),
    };
    const res = await onSave(payload);
    if (!res.ok) setSaveError(res.message ?? "Save failed.");
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/45 px-5 py-10 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease }}
        className="relative w-full max-w-xl rounded-[2rem] border border-white/70 bg-white/95 p-7 shadow-[0_40px_90px_-30px_rgb(15_23_42/0.55)] backdrop-blur-2xl sm:p-9"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-ink/12 text-ink-3 transition-all duration-300 hover:rotate-90 hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="font-display text-[0.58rem] font-bold uppercase tracking-[0.36em] text-brand-deep">
          {isNew ? "New course" : "Edit course"}
        </p>
        <h3 className="mt-1.5 font-display text-[1.4rem] font-extrabold tracking-[-0.02em]">
          {isNew ? "ADD A" : "EDIT"} <span className="bg-gradient-to-r from-brand-deep to-brand-magenta bg-clip-text text-transparent">COURSE.</span>
        </h3>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Labelled label="Name">
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Spoken English"
              className={inputCls}
              required
            />
          </Labelled>
          <Labelled label="Fee (PKR / month)">
            <input
              type="number"
              min={0}
              value={form.fee}
              onChange={(e) => set("fee", e.target.value)}
              className={inputCls}
            />
          </Labelled>
          <Labelled label="Duration">
            <input
              value={form.duration}
              onChange={(e) => set("duration", e.target.value)}
              placeholder="e.g. 3 months"
              className={inputCls}
            />
          </Labelled>
          <Labelled label="Teacher">
            <input
              value={form.teacher}
              onChange={(e) => set("teacher", e.target.value)}
              placeholder="e.g. Javaria Malik"
              className={inputCls}
            />
          </Labelled>
          <Labelled label="Schedule">
            <input
              value={form.schedule}
              onChange={(e) => set("schedule", e.target.value)}
              placeholder="e.g. Mon · Wed · Fri"
              className={inputCls}
            />
          </Labelled>
          <Labelled label="Display order">
            <input
              type="number"
              value={form.order}
              onChange={(e) => set("order", e.target.value)}
              className={inputCls}
            />
          </Labelled>
          <Labelled label="Tagline">
            <input
              value={form.tagline}
              onChange={(e) => set("tagline", e.target.value)}
              placeholder="One line — sells the course"
              className={inputCls}
            />
          </Labelled>
          <div className="flex items-end pb-1.5">
            <label className="inline-flex cursor-pointer items-center gap-2.5 rounded-xl border border-ink/12 bg-slate-50 px-4 py-3">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => set("active", e.target.checked)}
                className="h-4 w-4 rounded accent-brand-deep"
              />
              <span className="font-display text-[0.78rem] font-bold text-ink">Published</span>
            </label>
          </div>
          <div className="sm:col-span-2">
            <Labelled label="Description">
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
                className={inputCls}
              />
            </Labelled>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <label className="font-display text-[0.66rem] font-bold uppercase tracking-[0.2em] text-ink-2">
              Batches
            </label>
            <button
              type="button"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  batches: [...f.batches, { name: "Evening", time: "", seatsTotal: 20 }],
                }))
              }
              className="inline-flex items-center gap-1 rounded-full border border-brand/20 bg-brand/8 px-3 py-1 font-display text-[0.68rem] font-bold text-brand-deep transition-colors hover:bg-brand/12"
            >
              <Plus className="h-3.5 w-3.5" /> Add batch
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {form.batches.map((b, i) => (
              <div key={i} className="grid grid-cols-[1fr_1.4fr_0.7fr_auto] items-center gap-2">
                <input
                  value={b.name}
                  onChange={(e) => setBatch(i, { name: e.target.value })}
                  placeholder="Batch name"
                  className={inputCls}
                />
                <input
                  value={b.time}
                  onChange={(e) => setBatch(i, { time: e.target.value })}
                  placeholder="e.g. 6:00 PM – 8:00 PM"
                  className={inputCls}
                />
                <input
                  type="number"
                  min={1}
                  value={b.seatsTotal}
                  onChange={(e) => setBatch(i, { seatsTotal: Number(e.target.value) || 0 })}
                  placeholder="Seats"
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      batches: f.batches.filter((_, idx) => idx !== i),
                    }))
                  }
                  className="grid h-10 w-10 place-items-center rounded-xl border border-rose-200 bg-rose-50 text-rose-500 transition-colors hover:bg-rose-100"
                  aria-label="Remove batch"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {saveError ? (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[0.78rem] font-medium text-rose-600">
            {saveError}
          </p>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center rounded-full border border-ink/12 bg-white px-5 font-display text-[0.8rem] font-bold text-ink-2 transition-colors hover:border-slate-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy || form.name.trim().length < 2}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-deep to-brand-deep px-6 font-display text-[0.8rem] font-bold text-white shadow-[0_14px_30px_-12px_rgb(110_90_224/0.8)] transition-all hover:-translate-y-0.5 disabled:opacity-50"
          >
            {busy ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Check className="h-4 w-4" strokeWidth={2.6} />
            )}
            {isNew ? "Create course" : "Save changes"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-ink/12 bg-white px-3.5 py-2.5 text-[0.9rem] text-ink outline-none transition-all duration-200 placeholder:text-ink-3 focus:border-brand/80 focus:ring-4 focus:ring-brand-deep/12";

function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-display text-[0.66rem] font-bold uppercase tracking-[0.2em] text-ink-2">
        {label}
      </span>
      {children}
    </label>
  );
}