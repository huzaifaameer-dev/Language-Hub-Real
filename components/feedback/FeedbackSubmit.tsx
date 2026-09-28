"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  HeartHandshake,
  Mail,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  ThumbsUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTACT, whatsappLink } from "@/lib/content";

const CATEGORIES: { key: string; label: string; emoji: string }[] = [
  { key: "courses", label: "Courses", emoji: "📚" },
  { key: "teaching", label: "Teaching quality", emoji: "🎓" },
  { key: "website", label: "Website & account", emoji: "💻" },
  { key: "billing", label: "Fees & payment", emoji: "💳" },
  { key: "suggestion", label: "Suggestion", emoji: "💡" },
  { key: "general", label: "General", emoji: "💬" },
];

const ease = [0.16, 1, 0.3, 1] as const;

export function FeedbackSubmit({
  name: initialName,
  email: initialEmail,
}: {
  name?: string;
  email?: string;
}) {
  const [name, setName] = useState(initialName ?? "");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [category, setCategory] = useState("courses");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [contactOk, setContactOk] = useState(true);
  const [website, setWebsite] = useState("");
  const [company, setCompany] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  const stars = useMemo(() => [1, 2, 3, 4, 5].map((n) => (n <= (hover || rating) ? "on" : "off")), [hover, rating]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = "Please tell us your name.";
    if (rating === 0) errs.rating = "Tap the stars to rate us.";
    if (subject.trim().length < 3) errs.subject = "Add a short subject.";
    if (message.trim().length < 10) errs.message = "Tell us a little more (10+ characters).";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setBusy(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || null,
          category,
          rating,
          subject: subject.trim(),
          message: message.trim(),
          contactOk,
          website,
          company,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setServerError(
          d?.errors?.rating?.[0] ??
            d?.errors?.subject?.[0] ??
            d?.errors?.message?.[0] ??
            d?.message ??
            "Could not send your feedback. Please try again."
        );
        return;
      }
      setDone(true);
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const wa = whatsappLink("Assalam o alaikum! I'd like to give some feedback about my experience.");
  const supportEmail = CONTACT.email || "hello@languagehub.example";

  const inputCls = (err?: string) =>
    cn(
      "w-full rounded-xl border bg-white/80 px-4 py-3 text-[0.92rem] text-slate-900 shadow-[0_1px_2px_rgb(15_23_42/0.04)] outline-none transition-all placeholder:text-slate-400 focus:ring-4",
      err
        ? "border-rose-300 focus:border-rose-400 focus:ring-rose-500/10"
        : "border-slate-200 hover:border-slate-300 focus:border-[#2563EB] focus:ring-[#2563EB]/10"
    );

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_40px_90px_-50px_rgb(11_27_58/0.4)] backdrop-blur-xl">
      <span aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-300/20 blur-3xl" />
      <span aria-hidden className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-sky-300/20 blur-3xl" />

      {!done ? (
        <form ref={formRef} onSubmit={submit} noValidate className="relative p-6 sm:p-9">
          {/* heading */}
          <p className="flex items-center gap-3 font-display text-[0.62rem] font-bold uppercase tracking-[0.32em] text-[#2563EB]">
            <span aria-hidden className="h-px w-7 bg-[#2563EB]/40" /> Your voice matters
          </p>
          <h2 className="mt-2 font-display text-[1.7rem] font-extrabold tracking-[-0.02em] text-slate-900 sm:text-[2rem]">
            Tell us how we<span className="bg-gradient-to-r from-[#2563EB] to-[#38BDF8] bg-clip-text text-transparent"> did.</span>
          </h2>
          <p className="mt-1.5 max-w-lg text-[0.9rem] leading-relaxed text-slate-500">
            Every note lands straight with the Language Hub team and genuinely shapes our courses, teaching and experience.
          </p>

          {/* rating */}
          <div className="mt-7">
            <p className="font-display text-[0.72rem] font-bold text-slate-700">
              How was your experience? <span className="text-rose-500">*</span>
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHover(n)}
                  onClick={() => {
                    setRating(n);
                    setErrors((e) => ({ ...e, rating: "" }));
                  }}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  className="group relative p-1 transition-transform duration-200 hover:scale-110 active:scale-90"
                >
                  <Star
                    className={cn(
                      "h-9 w-9 transition-colors sm:h-10 sm:w-10",
                      n <= (hover || rating)
                        ? "fill-amber-400 text-amber-400 drop-shadow-[0_6px_14px_rgb(245_158_11/0.45)]"
                        : "fill-slate-200 text-slate-300 group-hover:fill-amber-200 group-hover:text-amber-300"
                    )}
                    strokeWidth={1.4}
                  />
                </button>
              ))}
              <span className="ml-3 min-w-[6.5rem] font-display text-[0.82rem] font-bold text-slate-600">
                {rating ? (["", "Needs work", "Could be better", "Good", "Very good", "Outstanding!"][rating]) : "Tap the stars"}
              </span>
            </div>
            {errors.rating ? <p className="mt-1.5 text-[0.78rem] font-medium text-rose-600">{errors.rating}</p> : null}
          </div>

          {/* category chips */}
          <div className="mt-6">
            <p className="font-display text-[0.72rem] font-bold text-slate-700">What is it about?</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const on = category === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCategory(c.key)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 font-display text-[0.76rem] font-bold transition-all duration-200",
                      on
                        ? "border-[#2563EB] bg-[#2563EB] text-white shadow-[0_10px_24px_-12px_rgb(99_102_241/0.7)]"
                        : "border-slate-200 bg-white text-slate-600 hover:border-[#93C5FD] hover:text-[#2563EB]"
                    )}
                  >
                    <span aria-hidden>{c.emoji}</span> {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* identity */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="fb-name" className="mb-1.5 block font-display text-[0.66rem] font-bold uppercase tracking-[0.2em] text-slate-600">
                Your name <span className="text-rose-500">*</span>
              </label>
              <input id="fb-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={inputCls(errors.name)} />
              {errors.name ? <p className="mt-1.5 text-[0.78rem] font-medium text-rose-600">{errors.name}</p> : null}
            </div>
            <div>
              <label htmlFor="fb-email" className="mb-1.5 block font-display text-[0.66rem] font-bold uppercase tracking-[0.2em] text-slate-600">
                Email <span className="font-normal normal-case text-slate-400">(optional)</span>
              </label>
              <input id="fb-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputCls()} />
            </div>
          </div>

          {/* subject */}
          <div className="mt-4">
            <label htmlFor="fb-subject" className="mb-1.5 block font-display text-[0.66rem] font-bold uppercase tracking-[0.2em] text-slate-600">
              Subject <span className="text-rose-500">*</span>
            </label>
            <input id="fb-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="In one sentence — what's the feedback about?" maxLength={120} className={inputCls(errors.subject)} />
            {errors.subject ? <p className="mt-1.5 text-[0.78rem] font-medium text-rose-600">{errors.subject}</p> : null}
          </div>

          {/* message */}
          <div className="mt-4">
            <label htmlFor="fb-message" className="mb-1.5 block font-display text-[0.66rem] font-bold uppercase tracking-[0.2em] text-slate-600">
              Your feedback <span className="text-rose-500">*</span>
            </label>
            <textarea id="fb-message" value={message} onChange={(e) => setMessage(e.target.value)} rows={5} maxLength={3000} placeholder="What went well? What could be better? Be as specific as you like — we read every word." className={cn(inputCls(errors.message), "resize-none leading-relaxed")} />
            <div className="mt-1 flex justify-between gap-3">
              {errors.message ? <p className="text-[0.78rem] font-medium text-rose-600">{errors.message}</p> : <span />}
              <span className="ml-auto font-mono text-[0.64rem] text-slate-400">{message.length}/3000</span>
            </div>
          </div>

          {/* reply consent */}
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 transition-colors hover:border-[#93C5FD]">
            <input type="checkbox" checked={contactOk} onChange={(e) => setContactOk(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#2563EB]" />
            <span className="text-[0.86rem] text-slate-600">
              <b className="text-slate-800">Happy for the team to reply to me</b> — we&apos;ll use this
              {email ? " email" : " address"} only if you&apos;d like a follow-up.
            </span>
          </label>

          {/* honeypots */}
          <span className="hidden" aria-hidden="true">
            <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Website" />
            <input tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" />
          </span>

          {serverError ? (
            <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[0.85rem] font-medium text-rose-600">{serverError}</p>
          ) : null}

          {/* submit */}
          <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-widest text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Reviewed by the team · reply within 24h
            </p>
            <button
              type="submit"
              disabled={busy}
              className="group inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#38BDF8] px-8 py-3.5 font-display text-[0.92rem] font-bold text-white shadow-[0_18px_40px_-14px_rgb(99_102_241/0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-[1.06] disabled:opacity-60 sm:w-auto"
            >
              {busy ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Send className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              )}
              Send feedback
            </button>
          </div>
        </form>
      ) : (
        /* success state */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative grid min-h-[26rem] place-items-center px-6 py-16 text-center"
        >
          <div>
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 16 }}
              className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-[0_24px_50px_-16px_rgb(16_185_129/0.7)]"
            >
              <HeartHandshake className="h-9 w-9" />
            </motion.span>
            <p className="mt-5 font-mono text-[0.62rem] font-black uppercase tracking-[0.32em] text-emerald-600">Feedback received</p>
            <h3 className="mt-2 font-display text-[1.8rem] font-extrabold tracking-[-0.03em] text-slate-900">
              Thank you, <span className="bg-gradient-to-r from-[#2563EB] to-[#38BDF8] bg-clip-text text-transparent">{name.split(" ")[0]}.</span>
            </h3>
            <p className="mx-auto mt-2 max-w-md text-[0.92rem] leading-relaxed text-slate-500">
              Your feedback is now with the Language Hub team. We read every single note — it genuinely helps make things better.
            </p>
            <div className="mt-5 flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} className={cn("h-5 w-5", n <= rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200")} />
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setDone(false);
                setRating(0);
                setSubject("");
                setMessage("");
              }}
              className="mt-7 inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-6 font-display text-[0.8rem] font-bold text-slate-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#93C5FD] hover:text-[#2563EB]"
            >
              Send another note
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export function FeedbackSidebar() {
  const wa = whatsappLink();
  const supportEmail = CONTACT.email || "hello@languagehub.example";
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="rounded-3xl border border-white/70 bg-gradient-to-br from-[#0B1B3A] via-[#1647C7] to-[#6D4AFF] p-6 text-white shadow-[0_30px_70px_-40px_rgb(37_99_235/0.8)]">
        <p className="flex items-center gap-2 font-mono text-[0.6rem] font-black uppercase tracking-[0.3em] text-white/70">
          <Sparkles className="h-4 w-4" /> Why feedback matters
        </p>
        <h3 className="mt-2 font-display text-[1.3rem] font-extrabold tracking-tight">Built on what you say.</h3>
        <ul className="mt-5 space-y-3">
          {[
            ["Courses & batches", "We tune schedules and syllabus to what learners actually ask for."],
            ["Teaching", "Every teaching session is shaped by your notes."],
            ["The website", "Bugs and friction you flag get fixed fast."],
          ].map(([t, d]) => (
            <li key={t} className="flex items-start gap-3">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/15 text-white">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </span>
              <span>
                <p className="font-display text-[0.86rem] font-bold">{t}</p>
                <p className="text-[0.72rem] leading-relaxed text-white/65">{d}</p>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2.5 rounded-3xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur-xl">
        <p className="font-display text-[0.62rem] font-bold uppercase tracking-[0.26em] text-[#2563EB]">
          Prefer to talk?
        </p>
        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 font-display text-[0.82rem] font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-emerald-600"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp us
          </a>
        ) : null}
        <a
          href={`mailto:${supportEmail}`}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 font-display text-[0.82rem] font-bold text-indigo-700 transition-all hover:-translate-y-0.5 hover:border-[#93C5FD] hover:bg-[#EFF6FF]"
        >
          <Mail className="h-4 w-4" /> Email the team
        </a>
        <p className="flex items-center gap-1.5 pt-1 font-mono text-[0.6rem] uppercase tracking-widest text-slate-400">
          <ThumbsUp className="h-3.5 w-3.5" /> Every note is read in person
        </p>
      </div>
    </div>
  );
}