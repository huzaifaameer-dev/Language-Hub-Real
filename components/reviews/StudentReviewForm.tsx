"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Camera,
  Check,
  Globe2,
  ImagePlus,
  Loader2,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { FALLBACK_BATCHES, FALLBACK_COURSE_NAMES } from "@/lib/course-data";

interface Submitted {
  name: string;
  course: string;
  batch: string;
  headline: string;
  body: string;
  outcome: string;
  rating: number;
  photo: string;
}

const RATING_LABELS = ["", "Not great", "Okay", "Good", "Really good", "Life-changing"];

const MAX_BODY = 2000;

/** Centre-crops any image to a square JPEG that is small enough to store. */
async function preparePhoto(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const out = Math.min(720, side);
  const canvas = document.createElement("canvas");
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read that image.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, out, out);
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    out,
    out
  );
  bitmap.close?.();
  return canvas.toDataURL("image/jpeg", 0.82);
}

function Stars({ value, onChange, size = "h-8 w-8" }: { value: number; onChange?: (n: number) => void; size?: string }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          onMouseEnter={() => onChange && setHover(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className={cn("p-0.5 transition-transform", onChange && "hover:scale-110 active:scale-90")}
        >
          <Star
            className={cn(
              size,
              n <= (hover || value)
                ? "fill-[#f5b93c] text-[#f5b93c] drop-shadow-[0_5px_12px_rgba(245,185,60,0.35)]"
                : "fill-[#e9f1ee] text-[#e9f1ee]"
            )}
            strokeWidth={0}
          />
        </button>
      ))}
    </div>
  );
}

function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return <p className="mt-1.5 font-sans text-[0.76rem] font-medium text-[#d0452b]">{children}</p>;
}

const labelCls =
  "block font-sans text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#44615a]";

function inputCls(error?: string) {
  return cn(
    "mt-1.5 w-full rounded-xl border bg-white px-4 py-3 font-sans text-[0.9rem] text-[#10231f] outline-none transition placeholder:text-[#9aada7] focus:ring-4",
    error
      ? "border-[#f3b6a7] focus:border-[#e2694b] focus:ring-[#e2694b]/10"
      : "border-[#e3ede9] hover:border-[#cfe3da] focus:border-[#0d6a58] focus:ring-[#0d6a58]/10"
  );
}

export function StudentReviewForm() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [course, setCourse] = useState("");
  const [batch, setBatch] = useState("");
  const [teacher, setTeacher] = useState("");
  const [rating, setRating] = useState(0);
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [outcome, setOutcome] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [company, setCompany] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState<Submitted | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    setErrors((e) => ({ ...e, photo: "" }));
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) {
      setErrors((e) => ({ ...e, photo: "Use a JPG, PNG or WebP photo." }));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setErrors((e) => ({ ...e, photo: "That photo is over 8 MB — pick a smaller one." }));
      return;
    }
    setPhotoBusy(true);
    try {
      setPhoto(await preparePhoto(file));
    } catch {
      setErrors((e) => ({ ...e, photo: "We couldn't read that image. Try another photo." }));
    } finally {
      setPhotoBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = "Please tell us your name.";
    if (!photo) errs.photo = "Add a profile photo so your review feels personal.";
    if (!course) errs.course = "Choose the course you studied.";
    if (rating === 0) errs.rating = "Tap the stars to rate your experience.";
    if (headline.trim().length < 8) errs.headline = "Add a short headline (8+ characters).";
    if (body.trim().length < 40) errs.body = "Tell us a little more — at least 40 characters.";
    if (!consent) errs.consent = "Please confirm we may publish your review.";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Enter a valid email address.";
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setBusy(true);
    try {
      const res = await fetch("/api/student-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          course,
          batch: batch.trim() || null,
          teacher: teacher.trim() || null,
          rating,
          headline: headline.trim(),
          body: body.trim(),
          outcome: outcome.trim() || null,
          photo,
          consent: true,
          website,
          company,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const firstError = data?.errors ? (Object.values(data.errors)[0] as string[])?.[0] : null;
        setServerError(firstError ?? data?.message ?? "Could not send your review. Please try again.");
        return;
      }
      setSubmitted({
        name: name.trim(),
        course,
        batch: batch.trim(),
        headline: headline.trim(),
        body: body.trim(),
        outcome: outcome.trim(),
        rating,
        photo: photo as string,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  /* ── success ─────────────────────────────────────────────────────────── */
  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-6"
      >
        <div className="relative overflow-hidden rounded-[2rem] border border-[#d7f0e9] bg-white p-6 text-center shadow-[0_30px_70px_-50px_rgba(10,78,67,0.5)] sm:p-9">
          <span aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-[#9fe3d3]/25 blur-3xl" />
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 16 }}
            className="relative mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-[#0f6b5c] to-[#14a08c] text-white shadow-[0_20px_40px_-16px_rgba(10,78,67,0.7)]"
          >
            <Check className="h-8 w-8" strokeWidth={3} />
          </motion.span>
          <p className="relative mt-5 font-sans text-[0.62rem] font-black uppercase tracking-[0.32em] text-[#0d6a58]">
            Review received
          </p>
          <h2 className="relative mt-2 font-display text-[clamp(1.6rem,4vw,2.1rem)] font-extrabold tracking-[-0.03em] text-[#10231f]">
            Thank you, {submitted.name.split(" ")[0]}.
          </h2>
          <p className="relative mx-auto mt-2 max-w-lg font-sans text-[0.92rem] leading-relaxed text-[#44615a]">
            Your story is safely with our team. We give every review a quick check, then
            publish it on the website — usually within 1–2 working days.
          </p>

          {/* preview of what will go live */}
          <div className="relative mx-auto mt-6 max-w-xl text-left">
            <p className="mb-2 text-center font-sans text-[0.6rem] font-bold uppercase tracking-[0.24em] text-[#8ba19b]">
              Your review preview
            </p>
            <div className="rounded-[1.6rem] border border-[#e6f2ee] bg-[#f3fbf8] p-5 sm:p-6">
              <div className="flex items-center gap-3.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={submitted.photo}
                  alt={`${submitted.name} profile`}
                  className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-white shadow-[0_8px_18px_-10px_rgba(10,78,67,0.6)]"
                />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-display text-[1rem] font-bold text-[#10231f]">
                    {submitted.name}
                    <BadgeCheck className="h-4 w-4 text-[#14a08c]" strokeWidth={2.4} />
                  </p>
                  <p className="mt-0.5 font-sans text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#d9532f]">
                    {submitted.course}
                    {submitted.batch ? ` · ${submitted.batch}` : ""}
                  </p>
                </div>
                <div className="ml-auto">
                  <Stars value={submitted.rating} size="h-3.5 w-3.5" />
                </div>
              </div>
              <span aria-hidden className="mt-4 block h-px w-full bg-[#dcefe9]" />
              <h3 className="mt-4 font-serif text-[1.2rem] font-semibold italic leading-[1.5] text-[#10231f]">
                &ldquo;{submitted.headline}&rdquo;
              </h3>
              <p className="mt-2 whitespace-pre-line font-sans text-[0.9rem] leading-[1.75] text-[#315a50]">
                {submitted.body}
              </p>
              {submitted.outcome ? (
                <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-sans text-[0.58rem] font-bold uppercase tracking-[0.1em] text-[#0a4e43] ring-1 ring-inset ring-[#d7f0e9]">
                  <Sparkles className="h-3 w-3 text-[#fb6a47]" /> {submitted.outcome}
                </span>
              ) : null}
            </div>
          </div>

          <div className="relative mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/#reviews"
              className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0f6b5c] to-[#14a08c] px-7 font-display text-[0.86rem] font-bold text-white shadow-[0_18px_40px_-16px_rgba(10,78,67,0.8)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-16px_rgba(10,78,67,0.95)] sm:w-auto"
            >
              <Globe2 className="h-4 w-4" /> Visit the website
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/success-stories"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#d7e7e1] bg-white px-7 font-display text-[0.84rem] font-bold text-[#315a50] transition hover:border-[#9fd8cb] hover:text-[#0d6a58] sm:w-auto"
            >
              Read student stories
            </Link>
          </div>
          <p className="relative mt-4 font-sans text-[0.72rem] text-[#8ba19b]">
            Want to send another?{" "}
            <button
              type="button"
              onClick={() => {
                setSubmitted(null);
                setPhoto(null);
                setRating(0);
                setHeadline("");
                setBody("");
                setOutcome("");
                setConsent(false);
              }}
              className="font-bold text-[#0d6a58] underline decoration-[#9fd8cb] underline-offset-2"
            >
              Start a new review
            </button>
          </p>
        </div>
      </motion.div>
    );
  }

  /* ── form ────────────────────────────────────────────────────────────── */
  return (
    <form
      onSubmit={submit}
      noValidate
      className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-[0_40px_90px_-55px_rgba(6,46,40,0.45)] backdrop-blur-xl sm:p-8"
    >
      <span aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-60 w-60 rounded-full bg-[#9fe3d3]/20 blur-3xl" />
      <span aria-hidden className="pointer-events-none absolute -bottom-24 -left-24 h-60 w-60 rounded-full bg-[#fb6a47]/10 blur-3xl" />

      <div className="relative">
        <p className="flex items-center gap-3 font-sans text-[0.6rem] font-black uppercase tracking-[0.32em] text-[#0f6b5c]">
          <span aria-hidden className="h-px w-7 bg-[#0f6b5c]/40" /> Your story
        </p>
        <h2 className="mt-2 font-display text-[1.6rem] font-extrabold tracking-[-0.02em] text-[#10231f] sm:text-[1.85rem]">
          Write your review
        </h2>
        <p className="mt-1 font-sans text-[0.88rem] leading-relaxed text-[#5b746d]">
          Takes about two minutes. Fields marked <span className="text-[#d0452b]">*</span> are required.
        </p>

        {/* photo */}
        <div className="mt-6 rounded-2xl border border-[#e6f2ee] bg-[#f7fcfa] p-4">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={cn(
                "group relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-dashed bg-white transition",
                photo
                  ? "border-[#9fd8cb]"
                  : errors.photo
                    ? "border-[#f3b6a7]"
                    : "border-[#cfe3da] hover:border-[#0d8a72]"
              )}
              aria-label="Upload your profile photo"
            >
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="Your profile preview" className="h-full w-full object-cover" />
              ) : photoBusy ? (
                <Loader2 className="h-6 w-6 animate-spin text-[#0d6a58]" />
              ) : (
                <span className="flex flex-col items-center gap-1 text-[#0d6a58]">
                  <Camera className="h-6 w-6" strokeWidth={1.9} />
                  <span className="font-sans text-[0.58rem] font-bold uppercase tracking-[0.1em]">
                    Add photo
                  </span>
                </span>
              )}
            </button>
            <div className="min-w-0 flex-1">
              <p className={labelCls}>
                Profile photo <span className="text-[#d0452b]">*</span>
              </p>
              <p className="mt-1 font-sans text-[0.8rem] leading-relaxed text-[#7b8f89]">
                A clear, friendly headshot. We crop it to a square for you.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#d7e7e1] bg-white px-3 py-1.5 font-sans text-[0.72rem] font-bold text-[#315a50] transition hover:border-[#9fd8cb] hover:text-[#0d6a58]"
                >
                  <ImagePlus className="h-3.5 w-3.5" /> {photo ? "Replace" : "Choose photo"}
                </button>
                {photo ? (
                  <button
                    type="button"
                    onClick={() => setPhoto(null)}
                    className="inline-flex items-center gap-1 rounded-full border border-[#f3d3c9] bg-white px-3 py-1.5 font-sans text-[0.72rem] font-bold text-[#b2432c] transition hover:bg-[#fdf2ed]"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                ) : null}
              </div>
              <FieldError>{errors.photo}</FieldError>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(e) => {
              void pickPhoto(e.target.files?.[0]);
              e.currentTarget.value = "";
            }}
          />
        </div>

        {/* identity */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelCls}>
              Full name <span className="text-[#d0452b]">*</span>
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className={inputCls(errors.name)}
              maxLength={80}
            />
            <FieldError>{errors.name}</FieldError>
          </label>
          <label className="block">
            <span className={labelCls}>
              Email <span className="font-medium normal-case tracking-normal text-[#9aada7]">(optional)</span>
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputCls(errors.email)}
              maxLength={120}
            />
            <FieldError>{errors.email}</FieldError>
          </label>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelCls}>Course <span className="text-[#d0452b]">*</span></span>
            <select
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className={inputCls(errors.course)}
            >
              <option value="">Choose your course</option>
              {FALLBACK_COURSE_NAMES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <FieldError>{errors.course}</FieldError>
          </label>
          <label className="block">
            <span className={labelCls}>
              Batch <span className="font-medium normal-case tracking-normal text-[#9aada7]">(optional)</span>
            </span>
            <select value={batch} onChange={(e) => setBatch(e.target.value)} className={inputCls()}>
              <option value="">Choose your batch</option>
              {FALLBACK_BATCHES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelCls}>
              Teacher <span className="font-medium normal-case tracking-normal text-[#9aada7]">(optional)</span>
            </span>
            <input
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              placeholder="Who taught you?"
              className={inputCls()}
              maxLength={80}
            />
          </label>
          <label className="block">
            <span className={labelCls}>
              Phone <span className="font-medium normal-case tracking-normal text-[#9aada7]">(optional, kept private)</span>
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+92 3xx xxxxxxx"
              className={inputCls()}
              maxLength={24}
            />
          </label>
        </div>

        {/* rating */}
        <div className="mt-6">
          <span className={labelCls}>
            Your rating <span className="text-[#d0452b]">*</span>
          </span>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Stars
              value={rating}
              onChange={(n) => {
                setRating(n);
                setErrors((e) => ({ ...e, rating: "" }));
              }}
            />
            <span className="font-sans text-[0.8rem] font-semibold text-[#5b746d]">
              {rating ? RATING_LABELS[rating] : "Tap to rate"}
            </span>
          </div>
          <FieldError>{errors.rating}</FieldError>
        </div>

        {/* headline + body */}
        <label className="mt-5 block">
          <span className={labelCls}>
            Headline <span className="text-[#d0452b]">*</span>
          </span>
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g. From 5.5 to 7.0 in nine weeks"
            className={inputCls(errors.headline)}
            maxLength={120}
          />
          <FieldError>{errors.headline}</FieldError>
        </label>

        <label className="mt-4 block">
          <span className={labelCls}>
            Your review <span className="text-[#d0452b]">*</span>
          </span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, MAX_BODY))}
            rows={6}
            placeholder="What was the course like? What changed for you? A specific moment or result makes your review powerful."
            className={cn(inputCls(errors.body), "resize-y leading-relaxed")}
          />
          <div className="mt-1 flex items-start justify-between gap-3">
            <FieldError>{errors.body}</FieldError>
            <span
              className={cn(
                "ml-auto shrink-0 font-mono text-[0.64rem]",
                body.length < 40 ? "text-[#b2432c]" : "text-[#9aada7]"
              )}
            >
              {body.length}/{MAX_BODY}
            </span>
          </div>
        </label>

        <label className="mt-4 block">
          <span className={labelCls}>
            Outcome{" "}
            <span className="font-medium normal-case tracking-normal text-[#9aada7]">(optional)</span>
          </span>
          <input
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            placeholder="e.g. Band 7.5 · new job · confidence in meetings"
            className={inputCls()}
            maxLength={120}
          />
        </label>

        {/* consent */}
        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-[#e6f2ee] bg-[#f7fcfa] px-4 py-3.5 transition-colors hover:border-[#9fd8cb]">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              setErrors((e2) => ({ ...e2, consent: "" }));
            }}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[#0f6b5c]"
          />
          <span className="font-sans text-[0.84rem] leading-relaxed text-[#5b746d]">
            <b className="text-[#10231f]">I&apos;m happy for Language Hub to publish this review</b>{" "}
            with my name, photo and course on the website and social channels. I confirm the
            review is my own honest experience.
          </span>
        </label>
        <FieldError>{errors.consent}</FieldError>

        {/* honeypots */}
        <span className="hidden" aria-hidden="true">
          <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Website" />
          <input tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" />
        </span>

        {serverError ? (
          <p className="mt-4 rounded-xl border border-[#f3d3c9] bg-[#fdf2ed] px-4 py-3 font-sans text-[0.84rem] font-medium text-[#b2432c]">
            {serverError}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="flex items-center gap-2 font-sans text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-[#8ba19b]">
            <ShieldCheck className="h-4 w-4 text-[#14a08c]" /> Reviewed by our team · private details stay private
          </p>
          <button
            type="submit"
            disabled={busy || photoBusy}
            className="group inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0f6b5c] to-[#14a08c] px-8 py-3.5 font-display text-[0.9rem] font-bold text-white shadow-[0_18px_40px_-14px_rgba(10,78,67,0.8)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-14px_rgba(10,78,67,0.95)] disabled:opacity-60 sm:w-auto"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Quote className="h-4 w-4" />
            )}
            {busy ? "Sending…" : "Submit my review"}
          </button>
        </div>
      </div>
    </form>
  );
}

/* ───────────────────────────── side guidance ───────────────────────────── */

export function ReviewGuidance() {
  const steps = [
    ["Write it", "Share your honest experience with the course, the teaching and the result."],
    ["We check it", "Our team reads every review and confirms it comes from a real student."],
    ["It goes live", "Your photo, stars and words appear on the homepage and student stories."],
  ] as const;

  return (
    <div className="space-y-4">
      <div className="rounded-[1.75rem] border border-[#d7f0e9] bg-white p-5 shadow-[0_24px_50px_-45px_rgba(10,78,67,0.5)]">
        <p className="flex items-center gap-2 font-sans text-[0.6rem] font-black uppercase tracking-[0.28em] text-[#0d6a58]">
          <Sparkles className="h-4 w-4" /> What happens next
        </p>
        <ol className="mt-4 space-y-3.5">
          {steps.map(([title, copy], i) => (
            <li key={title} className="flex items-start gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#eaf7f3] font-display text-[0.66rem] font-extrabold text-[#0d6a58]">
                {i + 1}
              </span>
              <span>
                <p className="font-display text-[0.86rem] font-bold text-[#10231f]">{title}</p>
                <p className="mt-0.5 font-sans text-[0.76rem] leading-relaxed text-[#7b8f89]">{copy}</p>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-[1.75rem] border border-[#e6f2ee] bg-[#f7fcfa] p-5">
        <p className="flex items-center gap-2 font-sans text-[0.6rem] font-black uppercase tracking-[0.28em] text-[#d9532f]">
          <Camera className="h-4 w-4" /> A photo that looks great
        </p>
        <ul className="mt-3.5 space-y-2.5">
          {[
            "Face the camera, smile naturally — shoulders up.",
            "Plain background, soft daylight, no heavy filters.",
            "No sunglasses, hats or group photos.",
            "At least 400 × 400 px. We crop it to a square.",
          ].map((tip) => (
            <li key={tip} className="flex items-start gap-2 font-sans text-[0.78rem] leading-relaxed text-[#5b746d]">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#14a08c]" strokeWidth={2.6} />
              {tip}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-[1.75rem] border border-[#e6f2ee] bg-[#f7fcfa] p-5">
        <p className="flex items-center gap-2 font-sans text-[0.6rem] font-black uppercase tracking-[0.28em] text-[#0d6a58]">
          <BookOpen className="h-4 w-4" /> The right length
        </p>
        <p className="mt-2 font-sans text-[0.8rem] leading-relaxed text-[#5b746d]">
          <b className="text-[#10231f]">60–200 words</b> is the sweet spot. Include the course,
          one specific moment, and what changed for you. Mentioning a score, a job or a
          confidence win makes it far more useful to the next student.
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-white px-3 py-2 font-sans text-[0.7rem] text-[#7b8f89] ring-1 ring-[#e6f2ee]">
          <Star className="h-3.5 w-3.5 fill-[#f5b93c] text-[#f5b93c]" strokeWidth={0} />
          Real name + real photo = a review people trust.
        </div>
      </div>

      <div className="rounded-[1.75rem] bg-gradient-to-br from-[#102b25] via-[#0a4e43] to-[#14a08c] p-5 text-white">
        <p className="flex items-center gap-2 font-sans text-[0.6rem] font-black uppercase tracking-[0.28em] text-white/70">
          <ShieldCheck className="h-4 w-4" /> Your privacy
        </p>
        <p className="mt-2 font-sans text-[0.8rem] leading-relaxed text-white/75">
          Your email and phone are never shown publicly — we only use them to confirm a
          review. Ask us at any time and we&apos;ll remove your review from the site.
        </p>
      </div>
    </div>
  );
}
