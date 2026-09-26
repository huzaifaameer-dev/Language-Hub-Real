"use client";

import { useEffect, useState } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MgUserLite } from "./types";
import { CsvButton, EmptyState, MgButton, Modal, SkeletonRows, StatusBadge, Toasts, useToasts, fmtWhen } from "./ui";

async function j(res: Response) {
  const d = await res.json().catch(() => ({}));
  return { ok: res.ok, d };
}

interface SubView {
  assignment: { id: string; title: string; deadline: string | null; status: string } | null;
  summary: { total: number; submitted: number; late: number; reviewed: number; pending: number };
  submissions: Array<{
    id: string;
    studentId: string;
    studentName: string;
    text: string | null;
    status: string;
    feedback: string | null;
    grade: string | null;
    submittedAt: string;
  }>;
  pendingStudents: Array<{ studentId: string; name: string }>;
}

export function SubmissionsView({ user }: { user: MgUserLite }) {
  const [assignments, setAssignments] = useState<Array<{ id: string; title: string; status: string }>>([]);
  const [pick, setPick] = useState("");
  const [data, setData] = useState<SubView | null>(null);
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState<{ id: string; name: string } | null>(null);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const { items, push } = useToasts();

  useEffect(() => {
    fetch("/api/management/assignments").then((r) => (r.ok ? r.json() : null)).then((d) => setAssignments((d?.assignments ?? []).filter((a: { id: string; title: string; status: string }) => ["PUBLISHED", "OPEN", "CLOSED"].includes(a.status)) as Array<{ id: string; title: string; status: string }>));
  }, []);

  const load = (id: string) => {
    setBusy(true);
    fetch(`/api/management/submissions?assignment=${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData((d as SubView) ?? null))
      .catch(() => setData(null))
      .finally(() => setBusy(false));
  };

  const openReview = (sub: SubView["submissions"][number]) => {
    setReview({ id: sub.id, name: sub.studentName });
    setGrade(sub.grade ?? "");
    setFeedback(sub.feedback ?? "");
  };

  const submitReview = async (statusVal: string) => {
    if (!review) return;
    setSaving(true);
    const res = await fetch(`/api/management/submissions/${review.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grade: grade || null, feedback: feedback || null, status: statusVal }),
    });
    const { d } = await j(res);
    setSaving(false);
    if (res.ok) {
      push(`Reviewed ${review.name}`);
      setReview(null);
      if (pick) load(pick);
    } else push(d.message ?? "Could not save review.", "err");
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.3em] text-[#1647C7]">Teaching</p>
          <h2 className="mt-1 font-display text-[1.6rem] font-extrabold tracking-tight text-slate-900">Submissions</h2>
          <p className="mt-0.5 text-[0.82rem] text-slate-500">Reviewed by {user.name}</p>
        </div>
        <select value={pick} onChange={(e) => { setPick(e.target.value); if (e.target.value) load(e.target.value); }} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[0.82rem] outline-none focus:border-indigo-400">
          <option value="">Choose an assignment…</option>
          {assignments.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
        </select>
      </header>

      {!pick ? <EmptyState title="Pick an assignment to see submissions" hint="Track who has submitted, who is pending and review work with grades + feedback." /> : busy ? (
        <SkeletonRows rows={4} cols={3} />
      ) : data ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <MiniStat label="Total" value={data.summary.total} cls="text-slate-900" />
            <MiniStat label="Submitted" value={data.summary.submitted} cls="text-emerald-600" />
            <MiniStat label="Pending" value={data.summary.pending} cls="text-amber-600" />
            <MiniStat label="Late" value={data.summary.late} cls="text-rose-600" />
            <MiniStat label="Reviewed" value={data.summary.reviewed} cls="text-violet-600" />
          </div>

          <CsvButton
            filename={`submissions-${pick}.csv`}
            headers={["Student", "Status", "Grade", "Submitted at"]}
            rows={data.submissions.map((s) => [s.studentName, s.status, s.grade ?? "", s.submittedAt])}
            label="Export"
          />

          {data.pendingStudents.length ? (
            <div className="rounded-2xl border border-amber-200/70 bg-amber-50/50 p-4">
              <p className="text-[0.82rem] font-bold text-amber-800">⏳ Still pending ({data.pendingStudents.length})</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {data.pendingStudents.map((p) => <span key={p.studentId} className="rounded-full border border-amber-200 bg-white px-2.5 py-0.5 font-mono text-[0.62rem] font-bold text-amber-700">{p.name}</span>)}
              </div>
            </div>
          ) : null}

          {data.submissions.length === 0 ? (
            <EmptyState title="No submissions yet" hint="Pending students are listed above — maybe a WhatsApp reminder will help!" />
          ) : (
            <div className="flex flex-col gap-3">
              {data.submissions.map((s) => (
                <div key={s.id} className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 backdrop-blur transition-all hover:shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-[0.95rem] font-extrabold text-slate-900">{s.studentName}</p>
                    <StatusBadge status={s.status} />
                    {s.grade ? <span className="rounded-full bg-[#1647C7] px-2.5 py-0.5 font-mono text-[0.62rem] font-bold text-white">Grade: {s.grade}</span> : null}
                    <span className="ml-auto font-mono text-[0.6rem] text-slate-400">submitted {fmtWhen(s.submittedAt)}</span>
                  </div>
                  {s.text ? <p className="mt-2 whitespace-pre-line rounded-xl bg-slate-50 p-3 text-[0.84rem] leading-relaxed text-slate-600">{s.text}</p> : null}
                  {s.feedback ? <p className="mt-2 text-[0.84rem] italic text-violet-700">“{s.feedback}”</p> : null}
                  <div className="mt-3 flex justify-end">
                    <MgButton tone="ghost" className="h-9 px-3 text-[0.72rem]" onClick={() => openReview(s)}>
                      <Inbox className="h-3.5 w-3.5" /> {s.status === "REVIEWED" ? "Edit review" : "Review"}
                    </MgButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      <Modal open={!!review} onClose={() => setReview(null)} title={`Review — ${review?.name ?? ""}`}>
        <div className="grid gap-3">
          <label className="grid gap-1 text-[0.78rem] font-bold text-slate-600">
            Grade
            <input className={inputCls} value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g. A / 8/10 / Pass" />
          </label>
          <label className="grid gap-1 text-[0.78rem] font-bold text-slate-600">
            Feedback
            <textarea className={cn(inputCls, "resize-none")} rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="What went well, what to improve…" />
          </label>
          <div className="flex flex-wrap gap-2">
            <MgButton tone="ghost" className="flex-1" onClick={() => void submitReview("RETURNED")} disabled={saving}>Return for revision</MgButton>
            <MgButton className="flex-1" onClick={() => void submitReview("REVIEWED")} disabled={saving}>Save & mark reviewed</MgButton>
          </div>
        </div>
      </Modal>
      <Toasts items={items} onClose={() => {}} />
    </div>
  );
}

function MiniStat({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-3.5 text-center backdrop-blur">
      <p className={cn("font-display text-[1.4rem] font-extrabold leading-none", cls)}>{value}</p>
      <p className="mt-1.5 font-mono text-[0.56rem] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</p>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[0.85rem] outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100";