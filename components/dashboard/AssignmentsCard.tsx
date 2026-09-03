"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, CheckCircle, ChevronDown, ChevronUp, FileText, MessageSquare, Send, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

interface Assignment {
  id: string;
  course: string;
  title: string;
  description: string;
  studentAnswer?: string;
  status: "DRAFT" | "SUBMITTED" | "GRADED";
  grade?: string | null;
  feedbackCount: number;
  createdAt: string;
  updatedAt: string;
}

const STATUS_META: Record<string, { cls: string; label: string }> = {
  DRAFT: { cls: "border-slate-200 bg-slate-50 text-slate-600", label: "Draft" },
  SUBMITTED: { cls: "border-sky-200 bg-sky-50 text-sky-600", label: "Submitted" },
  GRADED: { cls: "border-emerald-200 bg-emerald-50 text-emerald-600", label: "Graded" },
};

export function AssignmentsCard({
  assignments,
  onSubmit,
  onReply,
}: {
  assignments: Assignment[];
  onSubmit?: (title: string, description: string, answer: string) => void;
  onReply?: (assignmentId: string, message: string) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [answer, setAnswer] = useState("");
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !answer.trim()) return;
    setSubmitting(true);
    onSubmit?.(title, description, answer);
    setTitle("");
    setDescription("");
    setAnswer("");
    setShowForm(false);
    setSubmitting(false);
  };

  const handleReply = async (assignmentId: string) => {
    if (!replyText.trim()) return;
    onReply?.(assignmentId, replyText);
    setReplyText("");
  };

  return (
    <section className="glass-dash relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-violet-400/20 blur-3xl" />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-violet-500/10 text-violet-600">
            <BookOpen className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div>
            <p className="font-display text-[0.6rem] font-bold uppercase tracking-[0.36em] text-violet-600">Assignments</p>
            <p className="font-display text-[1rem] font-extrabold">{assignments.length} assignment{assignments.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-violet-600 px-3 font-display text-[0.72rem] font-bold text-white transition-all hover:bg-violet-700"
        >
          <FileText className="h-3 w-3" /> New
        </button>
      </div>

      {/* New assignment form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease }}
            className="overflow-hidden"
          >
            <div className="relative mt-5 rounded-xl border border-violet-200 bg-violet-50/60 p-4">
              <p className="font-display text-[0.6rem] font-bold uppercase tracking-[0.26em] text-violet-600">Submit Assignment</p>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Assignment title"
                className="mt-3 w-full rounded-lg border border-violet-200 bg-white px-3 py-2.5 text-[0.85rem] text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Assignment description / instructions (optional)"
                rows={2}
                className="mt-2 w-full resize-none rounded-lg border border-violet-200 bg-white px-3 py-2.5 text-[0.85rem] text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10"
              />
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Your answer..."
                rows={4}
                className="mt-2 w-full resize-none rounded-lg border border-violet-200 bg-white px-3 py-2.5 text-[0.85rem] text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10"
              />
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!title.trim() || !answer.trim() || submitting}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-violet-600 px-4 font-display text-[0.78rem] font-bold text-white transition-all hover:bg-violet-700 disabled:opacity-50"
                >
                  <Send className="h-3 w-3" /> Submit
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-4 font-display text-[0.78rem] font-bold text-slate-600 transition-all hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assignment list */}
      <div className="relative mt-5 flex flex-col gap-3">
        {assignments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white/40 px-6 py-10 text-center">
            <FileText className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 font-display text-[0.88rem] font-bold text-slate-500">No assignments yet</p>
            <p className="mt-1 text-[0.78rem] text-slate-400">Submit your first assignment using the button above</p>
          </div>
        ) : (
          assignments.map((a, i) => {
            const meta = STATUS_META[a.status] ?? STATUS_META.DRAFT;
            const isExpanded = expandedId === a.id;

            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4, ease }}
                className="overflow-hidden rounded-xl border border-white/80 bg-white/60 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : a.id)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/80"
                >
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[0.58rem] font-bold", meta.cls)}>
                    {a.status === "GRADED" ? <CheckCircle className="h-2.5 w-2.5" /> : null}
                    {meta.label}
                  </span>
                  <span className="flex-1 truncate font-display text-[0.88rem] font-bold">{a.title}</span>
                  {a.grade ? (
                    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-display text-[0.65rem] font-bold text-amber-600">
                      <Star className="h-2.5 w-2.5" /> {a.grade}
                    </span>
                  ) : null}
                  {a.feedbackCount > 0 ? (
                    <span className="flex items-center gap-1 text-[0.65rem] text-slate-400">
                      <MessageSquare className="h-2.5 w-2.5" /> {a.feedbackCount}
                    </span>
                  ) : null}
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-slate-100 px-4 py-4">
                        {a.description ? (
                          <p className="mb-3 text-[0.82rem] text-slate-500">{a.description}</p>
                        ) : null}
                        {a.studentAnswer ? (
                          <div className="rounded-lg bg-slate-50 px-3 py-2.5">
                            <p className="font-display text-[0.55rem] font-bold uppercase tracking-[0.2em] text-slate-400">Your answer</p>
                            <p className="mt-1 whitespace-pre-wrap text-[0.85rem] text-slate-700">{a.studentAnswer}</p>
                          </div>
                        ) : null}

                        {/* Feedback thread */}
                        {a.feedbackCount > 0 && (
                          <div className="mt-4">
                            <p className="font-display text-[0.55rem] font-bold uppercase tracking-[0.2em] text-slate-400">Feedback</p>
                            <p className="mt-2 text-[0.78rem] text-slate-500 italic">
                              Feedback thread available — {a.feedbackCount} message{a.feedbackCount !== 1 ? "s" : ""}
                            </p>
                          </div>
                        )}

                        {/* Reply form */}
                        <div className="mt-4 flex items-center gap-2">
                          <input
                            value={expandedId === a.id ? replyText : ""}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Reply to teacher feedback..."
                            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.82rem] text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleReply(a.id);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleReply(a.id)}
                            disabled={!replyText.trim()}
                            className="inline-flex h-9 items-center rounded-lg bg-violet-600 px-3 text-white transition-all hover:bg-violet-700 disabled:opacity-40"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <p className="mt-2 font-mono text-[0.55rem] text-slate-400">
                          Submitted {new Date(a.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </section>
  );
}
