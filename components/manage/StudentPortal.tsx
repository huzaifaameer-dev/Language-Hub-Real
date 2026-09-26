"use client";

import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, FileText, FolderKanban, Paperclip, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/footer/Footer";

interface MyAssignment {
  id: string;
  groupNames: string[];
  title: string;
  instructions: string | null;
  links: string[];
  hasAttachments: boolean;
  deadline: string | null;
  status: string;
  mySubmission?: { id: string; status: string; feedback: string | null; grade: string | null } | null;
}

interface MyMaterial {
  id: string;
  title: string;
  category: string | null;
  type: string;
  url: string | null;
}

interface MyAttendanceRow {
  date: string;
  status: string | null;
}

const TABS = ["assignments", "materials", "attendance"] as const;
type Tab = (typeof TABS)[number];

export function StudentPortal({ userId: _userId, name }: { userId: string; name: string }) {
  const [tab, setTab] = useState<Tab>("assignments");
  const [groups, setGroups] = useState<Array<{ id: string; name: string; courseName: string | null }>>([]);
  const [assignments, setAssignments] = useState<MyAssignment[]>([]);
  const [materials, setMaterials] = useState<MyMaterial[]>([]);
  const [attendance, setAttendance] = useState<MyAttendanceRow[]>([]);
  const [attPct, setAttPct] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string>("");
  const [link, setLink] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);

  const loadAll = () => {
    fetch("/api/management/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setGroups((d?.groups ?? []) as typeof groups));
    fetch("/api/management/assignments?mine=1")
      .then((r) => (r.ok ? r.json() : null))
      .then(loadSubs);
    fetch("/api/management/materials")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setMaterials((d?.materials ?? []) as MyMaterial[]));
    fetch("/api/management/attendance?mine=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setAttendance((d?.rows ?? []) as MyAttendanceRow[]);
        setAttPct((d?.pct as number | undefined) ?? null);
      });
  };

  const loadSubs = (d: { assignments?: Array<{ id: string }> } | null) => {
    const list = (d?.assignments ?? []) as MyAssignment[];
    Promise.all(
      list.map((a) =>
        fetch("/api/management/submissions")
          .then((r) => (r.ok ? r.json() : null))
          .then((subs) => {
            a.mySubmission = (subs?.submissions ?? []).find((s: { assignmentId: string }) => s.assignmentId === a.id) as MyAssignment["mySubmission"] | undefined ?? null;
            return a;
          })
      )
    ).then(setAssignments);
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (assignmentId: string) => {
    setToast(null);
    const res = await fetch("/api/management/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId, text: answer.trim() || null, links: link.trim() ? [link.trim()] : [], attachments: [] }),
    });
    if (res.ok) {
      setToast("Submitted successfully 🎉");
      setAnswer("");
      setLink("");
      await fetch("/api/management/assignments?mine=1").then((r) => (r.ok ? r.json() : null)).then(loadSubs);
    } else {
      const d = await res.json().catch(() => ({}));
      setToast(d.message ?? "Could not submit.");
      setSubmitting(null);
    }
  };

  const first = name.split(" ")[0];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-site pt-[4.25rem]">
        <div className="mx-auto max-w-4xl px-5 py-12 lg:px-8">
          <header>
            <p className="font-display text-[0.64rem] font-bold uppercase tracking-[0.34em] text-indigo-600">My Learning</p>
            <h1 className="mt-2 font-display text-[clamp(1.7rem,4vw,2.4rem)] font-extrabold tracking-[-0.02em] text-slate-900">
              Salam, <span className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">{first}.</span>
            </h1>
            <p className="mt-1 text-[0.92rem] text-slate-500">Assignments, materials and your attendance — all in one place.</p>
          </header>

          <div className="mt-6 flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-full border px-4 py-2 font-display text-[0.78rem] font-bold capitalize transition",
                  tab === t ? "border-indigo-500 bg-indigo-600 text-white shadow-[0_10px_24px_-12px_rgb(99_102_241/0.8)]" : "border-slate-200 bg-white text-slate-500 hover:border-indigo-300"
                )}
              >
                {t} {t === "assignments" ? `(${assignments.length})` : ""}
              </button>
            ))}
            {groups.length ? (
              <span className="ml-auto flex items-center gap-1.5 font-mono text-[0.68rem] text-slate-400">
                <FolderKanban className="h-4 w-4" /> {groups.map((g) => g.name).join(" · ")}
              </span>
            ) : null}
          </div>

          {toast ? <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[0.85rem] font-medium text-emerald-700">{toast}</p> : null}

          {tab === "assignments" ? (
            <div className="mt-6 flex flex-col gap-4">
              {assignments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400">No assignments yet — your teacher will publish them here.</div>
              ) : (
                assignments.map((a) => {
                  const my = a.mySubmission;
                  return (
                    <div key={a.id} className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-display text-[1.05rem] font-extrabold text-slate-900">{a.title}</p>
                          <p className="font-mono text-[0.6rem] text-slate-400">{a.groupNames.join(", ")}</p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-[0.6rem] font-bold tracking-widest text-slate-600">
                          <CalendarDays className="h-3 w-3" /> {a.deadline ? new Date(a.deadline).toLocaleString() : "No deadline"}
                        </span>
                      </div>
                      {a.instructions ? <p className="mt-3 whitespace-pre-line text-[0.9rem] leading-relaxed text-slate-600">{a.instructions}</p> : null}
                      {a.links?.length ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {a.links.map((l) => (
                            <a key={l} href={l} target="_blank" rel="noopener noreferrer" className="rounded-full bg-indigo-50 px-3 py-1 text-[0.72rem] font-bold text-indigo-700 underline-offset-2 hover:underline">
                              Open link
                            </a>
                          ))}
                        </div>
                      ) : null}
                      {a.hasAttachments ? (
                        <a href={`/api/management/media/${a.id}?kind=assignment&idx=0`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[0.72rem] font-bold text-slate-600 hover:bg-slate-200">
                          <Paperclip className="h-3 w-3" /> View attachment
                        </a>
                      ) : null}

                      <div className="mt-4 border-t border-slate-100 pt-3">
                        {my ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 font-mono text-[0.64rem] font-bold text-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5" /> {my.status}
                            </span>
                            {my.grade ? <span className="rounded-full bg-indigo-600 px-3 py-1 font-mono text-[0.64rem] font-bold text-white">Grade: {my.grade}</span> : null}
                            {my.feedback ? <p className="w-full text-[0.84rem] italic text-slate-500">“{my.feedback}”</p> : null}
                          </div>
                        ) : (
                          <div className="grid gap-2 sm:grid-cols-2">
                            <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={2} placeholder="Your answer / work (text)…" className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[0.9rem] outline-none focus:border-indigo-400" />
                            <div className="flex flex-col gap-2">
                              <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Optional link" className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[0.9rem] outline-none focus:border-indigo-400" />
                              <button
                                type="button"
                                onClick={() => { setSubmitting(a.id); void submit(a.id).finally(() => setSubmitting(null)); }}
                                disabled={submitting === a.id || (answer.trim().length === 0 && link.trim().length === 0)}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-5 text-sm font-bold text-white shadow-[0_14px_30px_-12px_rgb(99_102_241/0.8)] disabled:opacity-50"
                              >
                                <Send className="h-4 w-4" /> Submit
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : null}

          {tab === "materials" ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {materials.map((m) => (
                <div key={m.id} className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 backdrop-blur">
                  <span className="rounded-full bg-violet-50 px-2.5 py-0.5 font-mono text-[0.58rem] font-bold text-violet-700">{m.type}</span>
                  <p className="mt-2 font-display text-[0.95rem] font-extrabold text-slate-900">{m.title}</p>
                  <p className="font-mono text-[0.6rem] text-slate-400">{m.category ?? "General"}</p>
                  {m.url ? (
                    <a
                      href={String(m.url).startsWith("http") ? m.url : `/api/management/media/${m.id}?kind=material`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-[0.72rem] font-bold text-indigo-700 hover:bg-indigo-100"
                    >
                      <FileText className="h-3.5 w-3.5" /> Open material
                    </a>
                  ) : null}
                </div>
              ))}
              {materials.length === 0 ? <p className="col-span-full py-12 text-center font-mono text-[0.7rem] uppercase tracking-widest text-slate-400">No materials yet</p> : null}
            </div>
          ) : null}

          {tab === "attendance" ? (
            <div className="mt-6 flex flex-col gap-2">
              {attPct !== null ? (
                <div className="mb-1 flex items-center justify-between rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-4 py-3">
                  <p className="font-display text-[0.92rem] font-extrabold text-slate-800">Your attendance</p>
                  <p className="font-mono text-[1.1rem] font-black text-indigo-700">{attPct}%</p>
                </div>
              ) : null}
              {attendance.map((a) => (
                <div key={a.date} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/80 px-4 py-3">
                  <span className="font-display text-[0.88rem] font-bold text-slate-700">{new Date(`${a.date}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                  <span className={cn("rounded-full border px-3 py-1 font-mono text-[0.64rem] font-bold", a.status === "PRESENT" || a.status === "LATE" ? "border-emerald-300 bg-emerald-50 text-emerald-700" : a.status ? "border-rose-300 bg-rose-50 text-rose-600" : "border-slate-200 bg-slate-50 text-slate-400")}>
                    {a.status ?? "Not marked"}
                  </span>
                </div>
              ))}
              {attendance.length === 0 ? <p className="py-12 text-center font-mono text-[0.7rem] uppercase tracking-widest text-slate-400">No attendance records yet</p> : null}
            </div>
          ) : null}
        </div>
      </div>
      <Footer />
    </>
  );
}