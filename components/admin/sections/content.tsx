"use client";

import { useState } from "react";
import { MessageSquareQuote, Plus, Star, Trash2 } from "lucide-react";

import {
  api,
  Badge,
  Card,
  Empty,
  ErrorNote,
  FilterChips,
  fmtDate,
  GhostButton,
  Input,
  Label,
  Loading,
  Modal,
  Pager,
  PrimaryButton,
  SectionHead,
  Textarea,
  useApi,
} from "@/components/admin/ui";
import { ExportCsvButton } from "@/components/admin/ExportCsvButton";

/* ───────────────────────────── testimonials ────────────────────────────── */

interface Testimonial {
  id: string;
  name: string;
  role: string;
  course: string;
  quote: string;
  outcome: string;
  rating: number;
  featured: boolean;
  active: boolean;
}

interface NewTestimonial {
  name: string;
  role: string;
  course: string;
  outcome: string;
  quote: string;
  rating: number;
  featured: boolean;
}

const emptyTestimonial: NewTestimonial = {
  name: "",
  role: "",
  course: "",
  outcome: "",
  quote: "",
  rating: 5,
  featured: false,
};

export function TestimonialsSection() {
  const { data, loading, error, reload } = useApi<{ testimonials: Testimonial[] }>(
    "/api/admin/testimonials"
  );
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NewTestimonial>(emptyTestimonial);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      await api("/api/admin/testimonials", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          role: form.role || undefined,
          course: form.course || undefined,
          outcome: form.outcome || undefined,
          quote: form.quote,
          rating: form.rating,
          featured: form.featured,
        }),
      });
      setOpen(false);
      setForm(emptyTestimonial);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  };

  const patch = async (id: string, body: Record<string, unknown>) => {
    try {
      await api(`/api/admin/testimonials/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      reload();
    } catch {
      // The list stays as-is; the next refresh reflects the server state.
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this testimonial permanently?")) return;
    await api(`/api/admin/testimonials/${id}`, { method: "DELETE" }).catch(() => null);
    reload();
  };

  const rows = data?.testimonials ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <SectionHead
          title="Testimonials & success stories"
          hint="One pool feeds the homepage, /success-stories and the public API."
          action={
            <PrimaryButton onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Add testimonial
            </PrimaryButton>
          }
        />
        {loading && <Loading />}
        {error && <div className="p-5"><ErrorNote>{error}</ErrorNote></div>}
        {!loading && !error && rows.length === 0 && (
          <Empty
            title="No testimonials yet"
            hint="Published stories appear on the homepage and the success stories page."
            icon={MessageSquareQuote}
          />
        )}
        {rows.length > 0 && (
          <ul className="divide-y divide-line">
            {rows.map((t) => (
              <li key={t.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink">
                      {t.name}
                      {t.featured && <Badge tone="dark">Featured</Badge>}
                      {!t.active && <Badge tone="red">Hidden</Badge>}
                      <span className="flex items-center gap-0.5 text-amber">
                        {Array.from({ length: Math.max(0, Math.min(5, t.rating)) }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-current" />
                        ))}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-ink-3">
                      {[t.role, t.course].filter(Boolean).join(" · ") || "No role set"}
                    </p>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-2">“{t.quote}”</p>
                    {t.outcome && (
                      <p className="mt-1 font-mono text-[0.6rem] uppercase tracking-[0.1em] text-brand-deep">
                        {t.outcome}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    <GhostButton onClick={() => patch(t.id, { featured: !t.featured })}>
                      {t.featured ? "Unfeature" : "Feature"}
                    </GhostButton>
                    <GhostButton onClick={() => patch(t.id, { active: !t.active })}>
                      {t.active ? "Hide" : "Publish"}
                    </GhostButton>
                    <GhostButton
                      onClick={() => remove(t.id)}
                      className="border-coral/30 text-coral-deep"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </GhostButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={open} title="New testimonial" onClose={() => setOpen(false)} wide>
        <form onSubmit={create} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <Label>Student name</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label className="block">
              <Label>Role / outcome</Label>
              <Input
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="IELTS 8.0 · University of Toronto"
              />
            </label>
            <label className="block">
              <Label>Course</Label>
              <Input
                value={form.course}
                onChange={(e) => setForm({ ...form, course: e.target.value })}
                placeholder="IELTS Exam Preparation"
              />
            </label>
            <label className="block">
              <Label>Headline outcome</Label>
              <Input
                value={form.outcome}
                onChange={(e) => setForm({ ...form, outcome: e.target.value })}
                placeholder="Band 6.0 → 8.0 in ten weeks"
              />
            </label>
          </div>
          <label className="block">
            <Label>Quote</Label>
            <Textarea
              required
              minLength={10}
              value={form.quote}
              onChange={(e) => setForm({ ...form, quote: e.target.value })}
            />
          </label>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-ink-2">
              <span className="font-mono text-[0.56rem] font-bold uppercase tracking-[0.16em] text-ink-3">
                Rating
              </span>
              <Input
                type="number"
                min={1}
                max={5}
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                className="w-20"
              />
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-ink-2">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="h-4 w-4 accent-[#0a4e43]"
              />
              Feature on homepage
            </label>
          </div>
          {formError && <ErrorNote>{formError}</ErrorNote>}
          <div className="flex justify-end gap-2 pt-1">
            <GhostButton type="button" onClick={() => setOpen(false)}>
              Cancel
            </GhostButton>
            <PrimaryButton type="submit" disabled={busy}>
              {busy ? "Saving…" : "Publish testimonial"}
            </PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ─────────────────────────────── feedback ──────────────────────────────── */

interface Feedback {
  id: string;
  name: string;
  email: string;
  category: string;
  rating: number;
  subject: string;
  message: string;
  contactOk: boolean;
  status: string;
  createdAt: string;
}

export function FeedbackSection() {
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi<{
    total: number;
    page: number;
    pages: number;
    counts: Record<string, number>;
    feedback: Feedback[];
  }>(`/api/admin/feedback?status=${status}&page=${page}`);

  const patch = async (id: string, next: string) => {
    await api(`/api/admin/feedback/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: next }),
    }).catch(() => null);
    reload();
  };

  const counts = data?.counts ?? {};
  const rows = data?.feedback ?? [];

  return (
    <Card>
      <SectionHead
        title="Feedback inbox"
        hint="Submitted from the public feedback form, the dashboard and course pages."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <FilterChips
              value={status}
              onChange={(key) => {
                setStatus(key);
                setPage(1);
              }}
              options={[
                { key: "ALL", label: "All", count: counts.ALL ?? 0 },
                { key: "NEW", label: "New", count: counts.NEW ?? 0 },
                { key: "REVIEWED", label: "Reviewed", count: counts.REVIEWED ?? 0 },
                { key: "ARCHIVED", label: "Archived", count: counts.ARCHIVED ?? 0 },
              ]}
            />
            <ExportCsvButton dataset="feedback" />
          </div>
        }
      />
      {loading && <Loading />}
      {error && <div className="p-5"><ErrorNote>{error}</ErrorNote></div>}
      {!loading && rows.length === 0 && (
        <Empty title="Nothing here" hint="No feedback matches this filter yet." />
      )}
      {rows.length > 0 && (
        <ul className="divide-y divide-line">
          {rows.map((f) => (
            <li key={f.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink">
                    {f.subject}
                    <Badge
                      tone={f.status === "NEW" ? "amber" : f.status === "REVIEWED" ? "green" : "neutral"}
                    >
                      {f.status}
                    </Badge>
                    <span className="flex items-center gap-0.5 text-amber">
                      {Array.from({ length: Math.max(0, Math.min(5, f.rating)) }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-current" />
                      ))}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-ink-3">
                    {f.name} · {f.email || "no email"} · {f.category} · {fmtDate(f.createdAt)}
                  </p>
                  <p className="mt-2 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-ink-2">
                    {f.message}
                  </p>
                  {f.contactOk && (
                    <p className="mt-1 font-mono text-[0.58rem] uppercase tracking-[0.1em] text-brand-deep">
                      Happy to be contacted
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1.5">
                  {f.status !== "REVIEWED" && (
                    <GhostButton onClick={() => patch(f.id, "REVIEWED")}>Mark reviewed</GhostButton>
                  )}
                  {f.status !== "ARCHIVED" && (
                    <GhostButton onClick={() => patch(f.id, "ARCHIVED")}>Archive</GhostButton>
                  )}
                  {f.status === "ARCHIVED" && (
                    <GhostButton onClick={() => patch(f.id, "NEW")}>Restore</GhostButton>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {data && <Pager page={data.page} pages={data.pages} onPage={setPage} />}
    </Card>
  );
}
