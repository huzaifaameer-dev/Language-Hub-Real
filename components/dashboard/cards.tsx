"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Check, CreditCard, Mail, MessageCircle, Smartphone, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { booksFor } from "@/lib/books";
import type { Enr } from "@/components/dashboard/ui";

const ease = [0.16, 1, 0.3, 1] as const;

const ENR_META: Record<Enr["status"], { cls: string; dot: string; label: string }> = {
  PENDING: { cls: "border-amber-300 bg-amber-50 text-amber-700", dot: "bg-amber-500", label: "Awaiting payment request" },
  AWAITING_PAYMENT: { cls: "border-sky-300 bg-sky-50 text-sky-700", dot: "bg-sky-500", label: "Payment required" },
  PROOF_SUBMITTED: { cls: "border-violet-300 bg-violet-50 text-violet-700", dot: "bg-violet-500", label: "Payment under review" },
  ENROLLED: { cls: "border-emerald-300 bg-emerald-50 text-emerald-700", dot: "bg-emerald-500", label: "Enrolled" },
  REJECTED: { cls: "border-red-300 bg-red-50 text-red-600", dot: "bg-red-500", label: "Declined" },
};

export function EnrollmentCard({ enr, onlinePayment, konnectPayment, onRetry }: { enr: Enr; onlinePayment: boolean; konnectPayment?: boolean; onRetry?: () => void }) {
  const meta = ENR_META[enr.status];
  const [proofBusy, setProofBusy] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);
  const [proofDone, setProofDone] = useState(false);
  const [payBusy, setPayBusy] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [konnectBusy, setKonnectBusy] = useState(false);
  const [konnectError, setKonnectError] = useState<string | null>(null);
  const proofRef = useRef<HTMLInputElement>(null);

  const startOnlinePayment = async () => {
    setPayBusy(true);
    setPayError(null);
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId: enr.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPayError(data.message ?? "Could not start online payment.");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setPayError("Network error. Please try again.");
    } finally {
      setPayBusy(false);
    }
  };

  const startKonnectPayment = async () => {
    setKonnectBusy(true);
    setKonnectError(null);
    try {
      const res = await fetch("/api/payments/konnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        setKonnectError(data.message ?? "Could not start local payment.");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setKonnectError("Network error. Please try again.");
    } finally {
      setKonnectBusy(false);
    }
  };

  const uploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setProofError("Please upload an image (JPG, PNG or WebP) of your payment receipt.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProofError("Image too large (max 5 MB).");
      return;
    }
    setProofBusy(true);
    setProofError(null);
    try {
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const dataUrl = `data:${file.type};base64,${btoa(binary)}`;
      const res = await fetch("/api/enrollments/payment-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId: enr.id, dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProofError(data.message ?? "Could not upload your payment proof.");
        return;
      }
      setProofDone(true);
    } catch {
      setProofError("Network error. Please try again.");
    } finally {
      setProofBusy(false);
    }
  };

  return (
    <section className="glass-dash relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-brand/10 blur-3xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-3 font-display text-[0.6rem] font-bold uppercase tracking-[0.36em] text-brand-deep">
          <span aria-hidden className="h-px w-7 bg-brand-deep/40" /> Your enrollment
        </p>
        <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[0.62rem] font-bold tracking-widest", meta.cls)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
          {meta.label}
        </span>
      </div>
      <h2 className="relative mt-2 font-display text-[1.5rem] font-extrabold tracking-[-0.02em]">
        {enr.status === "ENROLLED" ? (
          <>SEAT <span className="text-emerald-600">CONFIRMED.</span></>
        ) : enr.status === "REJECTED" ? (
          <>REQUEST <span className="text-rose-600">DECLINED.</span></>
        ) : enr.status === "AWAITING_PAYMENT" ? (
          <>PAYMENT <span className="text-sky-600">REQUIRED.</span></>
        ) : enr.status === "PROOF_SUBMITTED" ? (
          <>PAYMENT <span className="text-violet-600">UNDER REVIEW.</span></>
        ) : (
          <>REQUEST <span className="bg-gradient-to-r from-brand-deep to-brand-magenta bg-clip-text text-transparent">IN QUEUE.</span></>
        )}
      </h2>

      <div className="relative mt-5 flex flex-wrap gap-2">
        {enr.subjects.map((s) => (
          <span key={s} className="rounded-full border border-brand/20/80 bg-brand/8 px-3.5 py-1.5 font-mono text-[0.7rem] font-bold text-brand-deep">
            {s}
          </span>
        ))}
        <span className="rounded-full border border-ink/12 bg-white px-3.5 py-1.5 font-mono text-[0.7rem] text-ink-2">
          Batch · {enr.batch}
        </span>
      </div>

      {enr.plan ? (
        <p className="relative mt-4 text-[0.9rem] leading-relaxed text-ink-2">
          &ldquo;{enr.plan}&rdquo;
        </p>
      ) : null}

      {enr.adminMessage ? (
        <div className="relative mt-5 rounded-xl border border-brand/20 bg-brand/8 px-4 py-3">
          <p className="font-display text-[0.6rem] font-bold uppercase tracking-[0.26em] text-brand-deep">From the admin</p>
          <p className="mt-1 text-[0.9rem] text-ink">{enr.adminMessage}</p>
        </div>
      ) : null}

      {enr.status === "PENDING" ? (
        <div className="relative mt-6 flex items-center gap-3 rounded-2xl border border-amber-300/70 bg-amber-50 px-4 py-4">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
          </span>
          <p className="text-[0.92rem] text-amber-800">
            The admin is preparing your payment instructions. Check back shortly to send your fee and enroll.
          </p>
        </div>
      ) : null}

      {enr.status === "AWAITING_PAYMENT" ? (
        <div className="relative mt-6 space-y-4">
          {onlinePayment || konnectPayment ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                {konnectPayment ? (
                  <button
                    type="button"
                    onClick={startKonnectPayment}
                    disabled={konnectBusy}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 font-display text-[0.95rem] font-extrabold text-white shadow-[0_16px_40px_-16px_rgb(16_185_129/0.6)] transition-all hover:brightness-110 disabled:opacity-60"
                  >
                    <Smartphone className="h-5 w-5" />
                    {konnectBusy ? "Opening…" : "Pay via EasyPaisa / JazzCash"}
                  </button>
                ) : null}
                {onlinePayment ? (
                  <button
                    type="button"
                    onClick={startOnlinePayment}
                    disabled={payBusy}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-deep to-brand-magenta px-6 py-4 font-display text-[0.95rem] font-extrabold text-white shadow-[0_16px_40px_-16px_rgb(110_90_224/0.7)] transition-all hover:brightness-110 disabled:opacity-60"
                  >
                    <CreditCard className="h-5 w-5" />
                    {payBusy ? "Opening checkout…" : "Pay online with card"}
                  </button>
                ) : null}
              </div>
              <p className="text-center font-mono text-[0.62rem] uppercase tracking-widest text-ink-3">
                or pay manually below — either way your seat is confirmed once your payment is received
              </p>
              {payError ? (
                <p className="text-center text-[0.82rem] font-medium text-rose-600">{payError}</p>
              ) : null}
              {konnectError ? (
                <p className="text-center text-[0.82rem] font-medium text-rose-600">{konnectError}</p>
              ) : null}
            </>
          ) : null}
          {enr.paymentInstructions ? (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4">
              <p className="font-display text-[0.6rem] font-bold uppercase tracking-[0.28em] text-sky-600">
                Payment instructions
              </p>
              <p className="mt-1.5 font-display text-[0.98rem] font-semibold leading-relaxed text-sky-900">
                {enr.paymentInstructions}
              </p>
            </div>
          ) : (
            <p className="text-[0.9rem] text-ink-2">Payment instructions from the admin will be ready shortly.</p>
          )}

          <div className="rounded-2xl border border-ink/10 bg-white/60 p-4">
            <p className="font-display text-[0.62rem] font-bold uppercase tracking-[0.2em] text-ink-2">
              Upload payment screenshot
            </p>
            <p className="mt-1 text-[0.85rem] text-ink-2">
              After sending the payment, upload a screenshot of the receipt so the admin can confirm your seat.
            </p>
            <input
              ref={proofRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={uploadProof}
            />
            {proofDone ? (
              <p className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[0.9rem] font-semibold text-emerald-700">
                <Check className="h-4 w-4" /> Proof submitted — awaiting admin confirmation.
              </p>
            ) : (
              <button
                type="button"
                onClick={() => proofRef.current?.click()}
                disabled={proofBusy}
                className="mt-3 inline-flex h-11 items-center gap-2 rounded-full bg-brand-deep px-6 font-display text-[0.82rem] font-bold text-white transition-all hover:brightness-110 disabled:opacity-60"
              >
                {proofBusy ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {proofBusy ? "Uploading…" : "Upload payment proof"}
              </button>
            )}
            {proofError ? (
              <p className="mt-2 text-[0.82rem] font-medium text-rose-600">{proofError}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {enr.status === "PROOF_SUBMITTED" ? (
        <div className="relative mt-6 flex items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-4">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-500 opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-violet-500" />
          </span>
          <p className="text-[0.92rem] text-violet-800">
            Payment proof received. The admin is verifying it now — your seat will be confirmed shortly.
          </p>
        </div>
      ) : null}

      {enr.status === "REJECTED" && onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex h-[3rem] items-center gap-2 rounded-full border-2 border-brand/80 px-6 font-display text-[0.85rem] font-bold text-brand-deep transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-deep/10"
        >
          Re-submit enrollment →
        </button>
      ) : null}
    </section>
  );
}

export function Bookshelf({ subjects }: { subjects: string[] }) {
  const books = booksFor(subjects as Parameters<typeof booksFor>[0]);
  return (
    <section id="lh-bookshelf" className="glass-dash relative overflow-hidden rounded-[2rem] border-emerald-200/60 p-6 sm:p-8">
      <div aria-hidden className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-emerald-400/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-24 -bottom-28 h-56 w-56 rounded-full bg-teal-400/20 blur-3xl" />
      <div className="relative flex items-center justify-between gap-3">
        <p className="flex items-center gap-3 font-display text-[0.6rem] font-bold uppercase tracking-[0.36em] text-emerald-700">
          <span aria-hidden className="h-px w-7 bg-emerald-500/40" /> Your bookshelf
        </p>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-mono text-[0.62rem] font-bold tracking-widest text-emerald-700">
          {books.length} BOOKS
        </span>
      </div>
      <h2 className="relative mt-2 font-display text-[1.5rem] font-extrabold tracking-[-0.02em]">
        STUDY <span className="text-emerald-600">MATERIALS.</span>
      </h2>
      <p className="relative mt-1.5 text-[0.9rem] text-ink-2">
        Hand-picked for your enrolled subjects. Work through them in order — core first.
      </p>

      <div className="relative mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {books.map((b, i) => (
          <motion.article
            key={b.title}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, ease, delay: i * 0.06 }}
            whileHover={{ y: -6 }}
            className="group relative overflow-hidden rounded-2xl border border-ink/10 bg-white p-4 shadow-[0_10px_28px_-16px_rgb(15_23_42/0.16)] transition-colors duration-300 hover:border-emerald-300"
          >
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-14"
              style={{ background: `linear-gradient(135deg, ${b.from}, ${b.to})` }}
            />
            <div className="relative mt-14">
              <span className="inline-flex items-center gap-1 rounded-full bg-cream px-2 py-0.5 font-mono text-[0.6rem] font-bold uppercase tracking-[0.2em] text-ink-2">
                <BookOpen className="h-3 w-3" strokeWidth={2} />
                {b.tag}
              </span>
              <h3 className="mt-2.5 font-display text-[0.98rem] font-extrabold leading-snug">{b.title}</h3>
              <p className="mt-1 text-[0.8rem] text-ink-3">{b.author}</p>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

export function ContactCard({
  myWhatsapp,
  supportEmail,
  supportWhatsapp,
}: {
  myWhatsapp?: string;
  supportEmail?: string | null;
  supportWhatsapp?: string | null;
}) {
  const hasStudioWa = !!supportWhatsapp;
  const hasEmail = !!supportEmail;
  const hasMyWa = !!myWhatsapp;
  if (!hasStudioWa && !hasEmail && !hasMyWa) return null;

  return (
    <section className="glass-dash relative overflow-hidden rounded-[2rem] border-brand-cyan/30/60 p-6 sm:p-8">
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-brand-cyan/10 blur-3xl" />
      <div className="relative flex items-center justify-between gap-3">
        <p className="flex items-center gap-3 font-display text-[0.6rem] font-bold uppercase tracking-[0.36em] text-brand-cyan">
          <span aria-hidden className="h-px w-7 bg-brand-cyan/40" /> Get in touch
        </p>
      </div>
      <h2 className="relative mt-2 font-display text-[1.5rem] font-extrabold tracking-[-0.02em]">
        NEED A <span className="bg-gradient-to-r from-brand-cyan to-brand-deep bg-clip-text text-transparent">HAND?</span>
      </h2>
      <p className="relative mt-1.5 text-[0.9rem] text-ink-2">
        Questions about batches, books or your schedule? We reply fast.
      </p>

      <div className="relative mt-5 flex flex-col gap-3">
        {hasStudioWa ? (
          <a
            href={`https://wa.me/${supportWhatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 font-display text-[0.85rem] font-bold text-white shadow-[0_12px_26px_-12px_rgb(16_185_129/0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-600"
          >
            <MessageCircle className="h-4.5 w-4.5" strokeWidth={2} />
            Chat on WhatsApp
          </a>
        ) : null}
        {hasEmail ? (
          <a
            href={`mailto:${supportEmail}`}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-brand-cyan/30 bg-white/80 font-display text-[0.82rem] font-bold text-brand-cyan transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-cyan hover:bg-brand-cyan/10"
          >
            <Mail className="h-4.5 w-4.5" strokeWidth={2} />
            Email the studio
          </a>
        ) : null}
        {hasMyWa ? (
          <p className="flex items-center gap-2 rounded-xl border border-ink/10 bg-white/60 px-4 py-3 font-mono text-[0.72rem] text-ink-2 backdrop-blur-sm">
            <MessageCircle className="h-3.5 w-3.5 shrink-0 text-emerald-500" strokeWidth={2} />
            <span className="truncate">
              Your WhatsApp · <span className="font-bold text-ink">{myWhatsapp}</span> — the studio may reach you here.
            </span>
          </p>
        ) : null}
      </div>
    </section>
  );
}