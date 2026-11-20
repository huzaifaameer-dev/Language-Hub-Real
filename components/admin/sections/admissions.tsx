"use client";

import { useState } from "react";
import {
  CalendarClock,
  ClipboardList,
  ExternalLink,
  FileText,
  GraduationCap,
  Mail,
  Phone,
  Target,
} from "lucide-react";

import {
  api,
  Badge,
  Card,
  Empty,
  ErrorNote,
  FilterChips,
  fmtDate,
  fmtDateTime,
  GhostButton,
  Label,
  Loading,
  Modal,
  Pager,
  PrimaryButton,
  SectionHead,
  Textarea,
  Input,
  useApi,
} from "@/components/admin/ui";
import { ExportCsvButton } from "@/components/admin/ExportCsvButton";

const REG_STATUS: Record<string, { tone: "neutral" | "green" | "amber" | "red" | "brand"; next: string[] }> = {
  NEW: { tone: "amber", next: ["CONTACTED", "ENROLLED", "REJECTED"] },
  CONTACTED: { tone: "brand", next: ["ENROLLED", "REJECTED"] },
  ENROLLED: { tone: "green", next: [] },
  REJECTED: { tone: "red", next: ["NEW"] },
};

/* ────────────────────────────── registrations ──────────────────────────── */

interface AdminRegistration {
  id: string;
  ref: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string;
  course: string;
  courseKey: string;
  dob: string | null;
  address: string | null;
  details: Record<string, unknown> | string;
  status: string;
  adminNote: string | null;
  hasPhoto: boolean;
  hasReceipt: boolean;
  hasPdf: boolean;
  createdAt: string;
}

export function RegistrationsSection() {
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi<{
    total: number;
    page: number;
    pages: number;
    counts: Record<string, number>;
    registrations: AdminRegistration[];
  }>(`/api/admin/registrations?status=${status}&page=${page}`);

  const [open, setOpen] = useState<AdminRegistration | null>(null);
  const counts = data?.counts ?? {};
  const rows = data?.registrations ?? [];

  return (
    <Card>
      <SectionHead
        title="Admissions pipeline"
        hint="Every registration submitted from the learner dashboard, newest first."
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
                { key: "CONTACTED", label: "Contacted", count: counts.CONTACTED ?? 0 },
                { key: "ENROLLED", label: "Enrolled", count: counts.ENROLLED ?? 0 },
                { key: "REJECTED", label: "Rejected", count: counts.REJECTED ?? 0 },
              ]}
            />
            <ExportCsvButton dataset="registrations" />
          </div>
        }
      />
      {loading && <Loading />}
      {error && <div className="p-5"><ErrorNote>{error}</ErrorNote></div>}
      {!loading && rows.length === 0 && (
        <Empty
          title="No registrations"
          hint="When a learner submits an admission form it lands here instantly."
          icon={ClipboardList}
        />
      )}
      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-line bg-cream/60">
              <tr>
                {["Reference", "Applicant", "Programme", "Status", "Received", ""].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-4 py-2.5 text-left font-mono text-[0.56rem] font-bold uppercase tracking-[0.14em] text-ink-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-cream/50">
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs font-bold text-brand-deep">{r.ref}</p>
                    <p className="mt-0.5 flex gap-1.5 text-[0.6rem] text-ink-3">
                      {r.hasPhoto && "photo"}
                      {r.hasReceipt && "· receipt"}
                      {r.hasPdf && "· pdf"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold text-ink">{r.name}</p>
                    <p className="text-xs text-ink-3">{r.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="max-w-[220px] truncate text-sm capitalize text-ink-2">
                      {r.course.replace(/-/g, " ")}
                    </p>
                    <p className="text-xs text-ink-3">{r.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={REG_STATUS[r.status]?.tone ?? "neutral"}>{r.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-2">{fmtDate(r.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <GhostButton onClick={() => setOpen(r)}>Open file</GhostButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pager page={data.page} pages={data.pages} onPage={setPage} />}

      <RegistrationModal
        key={open?.id ?? "closed"}
        registration={open}
        onClose={() => setOpen(null)}
        onSaved={() => {
          setOpen(null);
          reload();
        }}
      />
    </Card>
  );
}

function RegistrationModal({
  registration,
  onClose,
  onSaved,
}: {
  registration: AdminRegistration | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [note, setNote] = useState(registration?.adminNote ?? "");
  const [batch, setBatch] = useState("");
  const [instructor, setInstructor] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!registration) return null;

  const details =
    typeof registration.details === "string"
      ? (() => {
          try {
            return JSON.parse(registration.details) as Record<string, unknown>;
          } catch {
            return {};
          }
        })()
      : registration.details ?? {};

  const study = (details.study ?? {}) as Record<string, unknown>;
  const education = (details.education ?? {}) as Record<string, unknown>;
  const payment = (details.payment ?? {}) as Record<string, unknown>;

  const update = async (body: Record<string, unknown>, label: string) => {
    setBusy(label);
    setError(null);
    try {
      await api(`/api/admin/registrations/${registration.id}`, {
        method: "PATCH",
        body: JSON.stringify({ adminNote: note, ...body }),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the registration.");
    } finally {
      setBusy(null);
    }
  };

  const media = [
    registration.hasPhoto ? ["photo", "Photo"] : null,
    registration.hasReceipt ? ["receipt", "Payment receipt"] : null,
    registration.hasPdf ? ["pdf", "PDF summary"] : null,
  ].filter(Boolean) as Array<[string, string]>;

  return (
    <Modal open title={`Registration ${registration.ref}`} onClose={onClose} wide>
      <div className="space-y-4">
        <div className="grid gap-3 rounded-xl border border-line bg-cream/60 p-4 sm:grid-cols-2">
          <p className="text-sm font-bold text-ink">{registration.name}</p>
          <p className="flex items-center gap-1.5 text-xs text-ink-2 sm:justify-end">
            <Mail className="h-3.5 w-3.5" /> {registration.email}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-ink-2">
            <Phone className="h-3.5 w-3.5" /> {registration.phone || "—"}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-ink-2 sm:justify-end">
            <CalendarClock className="h-3.5 w-3.5" /> {fmtDateTime(registration.createdAt)}
          </p>
          <p className="text-xs text-ink-2">DOB: {registration.dob || "—"}</p>
          <p className="truncate text-xs text-ink-2 sm:text-right">
            Address: {registration.address || "—"}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-line p-4">
            <p className="font-mono text-[0.56rem] font-bold uppercase tracking-[0.16em] text-ink-3">
              Study preferences
            </p>
            <dl className="mt-2 space-y-1 text-xs text-ink-2">
              <Row label="Preferred time" value={String(study.preferredTime ?? "—")} />
              <Row label="Level" value={String(study.level ?? "—")} />
              <Row label="Hours / week" value={String(study.hoursPerWeek ?? "—")} />
              <Row label="Heard via" value={String(study.heardAbout ?? "—")} />
              <Row
                label="Focus"
                value={
                  Array.isArray(study.focusModules)
                    ? study.focusModules.join(", ")
                    : String(study.focusModules ?? "—")
                }
              />
            </dl>
          </div>
          <div className="rounded-xl border border-line p-4">
            <p className="font-mono text-[0.56rem] font-bold uppercase tracking-[0.16em] text-ink-3">
              Education & payment
            </p>
            <dl className="mt-2 space-y-1 text-xs text-ink-2">
              <Row label="Qualification" value={String(education.qualification ?? "—")} />
              <Row label="Institution" value={String(education.institution ?? "—")} />
              <Row label="Passing year" value={String(education.yearOfPassing ?? "—")} />
              <Row label="Method" value={String(payment.method ?? "—")} />
              <Row label="Note" value={String(payment.note ?? "—")} />
            </dl>
          </div>
        </div>

        {media.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {media.map(([field, label]) => (
              <a
                key={field}
                href={`/api/registrations/media/${registration.id}?field=${field}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-xs font-bold text-ink-2 hover:border-brand/40"
              >
                <FileText className="h-3.5 w-3.5" /> {label}
                <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        )}

        <label className="block">
          <Label>Internal note</Label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Called on Tuesday, asked to reschedule…"
            className="min-h-20"
          />
        </label>

        <div className="flex flex-wrap gap-1.5">
          {(REG_STATUS[registration.status]?.next ?? []).map((next) => (
            <GhostButton
              key={next}
              disabled={busy !== null}
              onClick={() => update({ status: next }, `status:${next}`)}
            >
              {busy === `status:${next}` ? "Updating…" : `Mark ${next.toLowerCase()}`}
            </GhostButton>
          ))}
        </div>

        <div className="rounded-xl border border-brand/25 bg-brand/[0.04] p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-brand-deep">
            <GraduationCap className="h-4 w-4" /> Enroll this learner
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <Label>Batch</Label>
              <Input
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                placeholder="Evening A"
              />
            </label>
            <label className="block">
              <Label>Instructor</Label>
              <Input
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                placeholder="Javaria Malik"
              />
            </label>
          </div>
          <PrimaryButton
            type="button"
            className="mt-3"
            disabled={busy !== null || !registration.userId}
            onClick={() =>
              update({ enroll: true, batch: batch || undefined, instructor: instructor || undefined }, "enroll")
            }
          >
            {busy === "enroll" ? "Enrolling…" : "Create enrolment"}
          </PrimaryButton>
          {!registration.userId && (
            <p className="mt-2 text-xs text-ink-3">
              This registration is not linked to an account, so it cannot be enrolled.
            </p>
          )}
        </div>

        {error && <ErrorNote>{error}</ErrorNote>}

        <div className="flex justify-end">
          <GhostButton type="button" onClick={onClose}>
            Close
          </GhostButton>
        </div>
      </div>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-3">{label}</dt>
      <dd className="truncate text-right font-medium text-ink">{value || "—"}</dd>
    </div>
  );
}

/* ──────────────────────────────── demos ────────────────────────────────── */

interface DemoBooking {
  id: string;
  name: string;
  email: string;
  phone: string;
  course: string;
  preferredDate: string | null;
  preferredTime: string | null;
  message: string | null;
  status: string;
  createdAt: string;
}

const DEMO_TONE: Record<string, "amber" | "brand" | "green" | "red"> = {
  NEW: "amber",
  SCHEDULED: "brand",
  DONE: "green",
  CANCELLED: "red",
};

export function DemosSection() {
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi<{
    total: number;
    page: number;
    pages: number;
    counts: Record<string, number>;
    bookings: DemoBooking[];
  }>(`/api/admin/demo?status=${status}&page=${page}`);

  const patch = async (id: string, next: string) => {
    await api(`/api/admin/demo/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: next }),
    }).catch(() => null);
    reload();
  };

  const counts = data?.counts ?? {};
  const rows = data?.bookings ?? [];

  return (
    <Card>
      <SectionHead
        title="Demo class bookings"
        hint="Public booking requests, with the preferred slot the visitor picked."
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
                { key: "SCHEDULED", label: "Scheduled", count: counts.SCHEDULED ?? 0 },
                { key: "DONE", label: "Done", count: counts.DONE ?? 0 },
                { key: "CANCELLED", label: "Cancelled", count: counts.CANCELLED ?? 0 },
              ]}
            />
            <ExportCsvButton dataset="demos" />
          </div>
        }
      />
      {loading && <Loading />}
      {error && <div className="p-5"><ErrorNote>{error}</ErrorNote></div>}
      {!loading && rows.length === 0 && (
        <Empty title="No demo bookings" hint="Bookings arrive from the homepage form." icon={CalendarClock} />
      )}
      {rows.length > 0 && (
        <ul className="divide-y divide-line">
          {rows.map((b) => (
            <li key={b.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink">
                    {b.name}
                    <Badge tone={DEMO_TONE[b.status] ?? "neutral"}>{b.status}</Badge>
                  </p>
                  <p className="mt-0.5 text-xs text-ink-3">
                    {b.email} · {b.phone} · {b.course}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-ink-2">
                    Preferred: {b.preferredDate || "—"} at {b.preferredTime || "—"}
                  </p>
                  {b.message && (
                    <p className="mt-1 max-w-2xl text-xs leading-relaxed text-ink-3">{b.message}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap gap-1.5">
                  {b.status !== "SCHEDULED" && (
                    <GhostButton onClick={() => patch(b.id, "SCHEDULED")}>Schedule</GhostButton>
                  )}
                  {b.status !== "DONE" && (
                    <GhostButton onClick={() => patch(b.id, "DONE")}>Mark done</GhostButton>
                  )}
                  {b.status !== "CANCELLED" && (
                    <GhostButton
                      onClick={() => patch(b.id, "CANCELLED")}
                      className="border-coral/30 text-coral-deep"
                    >
                      Cancel
                    </GhostButton>
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

/* ──────────────────────────────── leads ────────────────────────────────── */

interface Lead {
  id: string;
  name: string;
  email: string;
  score: number | null;
  total: number | null;
  level: string | null;
  recommendedCourse: string | null;
  createdAt: string;
}

export function LeadsSection() {
  const { data, loading, error } = useApi<{ total: number; leads: Lead[] }>("/api/admin/leads");
  const rows = data?.leads ?? [];

  return (
    <Card>
      <SectionHead
        title="Placement test leads"
        hint="Every completed level test, with the recommendation the engine produced."
        action={<ExportCsvButton dataset="leads" />}
      />
      {loading && <Loading />}
      {error && <div className="p-5"><ErrorNote>{error}</ErrorNote></div>}
      {!loading && rows.length === 0 && (
        <Empty title="No leads yet" hint="Test results appear here as visitors complete the placement test." icon={Target} />
      )}
      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-line bg-cream/60">
              <tr>
                {["Lead", "Score", "Level", "Recommended", "Date"].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-4 py-2.5 text-left font-mono text-[0.56rem] font-bold uppercase tracking-[0.14em] text-ink-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((l) => (
                <tr key={l.id} className="hover:bg-cream/50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold text-ink">{l.name || "Unnamed"}</p>
                    <p className="text-xs text-ink-3">{l.email}</p>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-ink">
                    {l.score ?? "—"}
                    {l.total ? ` / ${l.total}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone="brand">{l.level ?? "—"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-2">
                    {l.recommendedCourse ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-2">{fmtDate(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
