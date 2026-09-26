"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, CheckCircle2, Clock, GraduationCap, MessageCircle, User, X } from "lucide-react";
import { useBodyScrollLock } from "@/lib/hooks";
import { FocusTrap, useEscapeKey } from "@/components/ui/FocusTrap";
import { COURSE_CARDS } from "@/lib/content";

const TIMES = [
  "9:00 AM",
  "11:00 AM",
  "1:00 PM",
  "3:00 PM",
  "5:00 PM",
  "7:00 PM",
];

const ease = [0.16, 1, 0.3, 1] as const;

interface FieldErrors {
  name?: string[];
  email?: string[];
  phone?: string[];
  preferredDate?: string[];
  preferredTime?: string[];
  course?: string[];
}

interface BookingConfirmation {
  whatsappLink: string;
  confirmation: {
    course: string;
    date: string;
    time: string;
  };
}

/** Free demo-class booking form presented as a modal. */
export function DemoBooking({ open, onClose }: { open: boolean; onClose: () => void }) {
  useBodyScrollLock(open);
  useEscapeKey(onClose, open);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Book a free demo class"
        >
          <FocusTrap active={open} className="w-full max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: 0.4, ease }}
              className="relative overflow-hidden rounded-3xl bg-white shadow-[0_40px_100px_-30px_rgb(15_23_42/0.5)]"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-brand/[0.08] blur-3xl"
              />

              <div className="relative flex items-center justify-between border-b border-ink/[0.06] px-7 py-5">
                <div>
                  <p className="font-display text-[0.6rem] font-bold uppercase tracking-[0.3em] text-gold-deep">
                    Free demo class
                  </p>
                  <h3 className="mt-1 font-display text-xl font-extrabold tracking-tight text-ink">
                    Book your slot
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="grid h-10 w-10 place-items-center rounded-full border border-ink/10 text-ink-3 hover:bg-ink hover:text-ivory"
                >
                  <X className="h-5 w-5" strokeWidth={1.8} />
                </button>
              </div>

              <div className="relative max-h-[70vh] overflow-y-auto px-7 py-6">
                <DemoBookingBody key={open ? "open" : "closed"} onClose={onClose} />
              </div>
            </motion.div>
          </FocusTrap>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DemoBookingBody({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("9:00 AM");
  const [course, setCourse] = useState(COURSE_CARDS[0].info.name);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  const todayISO = new Date().toISOString().split("T")[0];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(null);
    setBusy(true);
    try {
      const res = await fetch("/api/demo-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, preferredDate, preferredTime, course, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors ?? null);
        return;
      }
      setConfirmation(data as BookingConfirmation);
      setDone(true);
    } catch {
      setErrors({ name: ["Network error. Please try again."] });
    } finally {
      setBusy(false);
    }
  };

  if (done && confirmation) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <motion.span
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-500"
        >
          <CheckCircle2 className="h-8 w-8" strokeWidth={1.6} />
        </motion.span>
        <h4 className="mt-5 font-display text-[1.3rem] font-extrabold text-ink">
          Demo class confirmed!
        </h4>
        <p className="mt-2 max-w-sm text-[0.92rem] leading-relaxed text-ink-2">
          Hi <span className="font-semibold text-ink">{name.split(" ")[0]}</span>, your{" "}
          <span className="font-semibold text-ink">{confirmation.confirmation.course}</span> demo
          is set for{" "}
          <span className="font-semibold text-ink">{confirmation.confirmation.date}</span> at{" "}
          <span className="font-semibold text-ink">{confirmation.confirmation.time}</span>.
        </p>

        {/* Confirmation details card */}
        <div className="mt-5 w-full max-w-sm rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-left">
          <p className="font-display text-[0.6rem] font-bold uppercase tracking-[0.2em] text-emerald-700">
            What happens next
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            <li className="flex items-start gap-2 text-[0.82rem] text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Confirmation email sent to <span className="font-semibold">{email}</span>
            </li>
            <li className="flex items-start gap-2 text-[0.82rem] text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Our teacher will reach out with the meeting link
            </li>
            <li className="flex items-start gap-2 text-[0.82rem] text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Join the demo 5 minutes before the scheduled time
            </li>
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {confirmation.whatsappLink ? (
            <a
              href={confirmation.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-6 font-display text-[0.82rem] font-bold text-emerald-700 transition-all hover:-translate-y-0.5 hover:bg-emerald-100"
            >
              <MessageCircle className="h-4 w-4" /> Confirm on WhatsApp
            </a>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center rounded-full bg-ink px-7 font-display text-[0.85rem] font-bold text-ivory hover:bg-brand-deep"
          >
            Done
          </button>
        </div>

        <p className="mt-4 font-mono text-[0.58rem] text-ink-3">
          A confirmation email has been sent to {email}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label="Full name" error={errors?.name?.[0]} icon={<User className="h-4 w-4" />}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Your name"
          className="w-full bg-transparent text-[0.92rem] text-ink outline-none placeholder:text-ink-3/70"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" error={errors?.email?.[0]} icon={<span className="text-xs font-bold">@</span>}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full bg-transparent text-[0.92rem] text-ink outline-none placeholder:text-ink-3/70"
          />
        </Field>
        <Field label="Phone / WhatsApp" error={errors?.phone?.[0]} icon={<span className="text-xs font-bold">+</span>}>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            placeholder="+92 300 1234567"
            className="w-full bg-transparent text-[0.92rem] text-ink outline-none placeholder:text-ink-3/70"
          />
        </Field>
      </div>

      <Field label="Preferred date" error={errors?.preferredDate?.[0]} icon={<CalendarDays className="h-4 w-4" />}>
        <input
          type="date"
          value={preferredDate}
          onChange={(e) => setPreferredDate(e.target.value)}
          min={todayISO}
          required
          className="w-full bg-transparent text-[0.92rem] text-ink outline-none"
        />
      </Field>

      <Field label="Preferred time" error={errors?.preferredTime?.[0]} icon={<Clock className="h-4 w-4" />}>
        <select
          value={preferredTime}
          onChange={(e) => setPreferredTime(e.target.value)}
          className="w-full bg-transparent text-[0.92rem] text-ink outline-none"
        >
          {TIMES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </Field>

      <Field label="Course of interest" error={errors?.course?.[0]} icon={<GraduationCap className="h-4 w-4" />}>
        <select
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          className="w-full bg-transparent text-[0.92rem] text-ink outline-none"
        >
          {COURSE_CARDS.map((c) => (
            <option key={c.info.name} value={c.info.name}>{c.info.name}</option>
          ))}
        </select>
      </Field>

      <Field label="Anything to tell us? (optional)">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          placeholder="A short note about your goals…"
          className="w-full resize-none bg-transparent text-[0.92rem] text-ink outline-none placeholder:text-ink-3/70"
        />
      </Field>

      <button
        type="submit"
        disabled={busy}
        className="mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink font-display text-[0.92rem] font-bold text-ivory transition-all hover:bg-brand-deep disabled:opacity-60"
      >
        {busy ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <>Request my free demo</>
        )}
      </button>
      <p className="text-center font-mono text-[0.6rem] uppercase tracking-widest text-ink-3">
        Free · No commitment · Instant confirmation
      </p>
    </form>
  );
}

function Field({
  label,
  icon,
  error,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 font-display text-[0.6rem] font-bold uppercase tracking-[0.2em] text-ink-3">
        {icon}
        {label}
      </span>
      <span className="flex items-center gap-3 rounded-xl border border-ink/10 bg-[#faf8f4] px-4 py-3 transition-colors focus-within:border-brand focus-within:bg-white focus-within:ring-4 focus-within:ring-brand/[0.08]">
        {children}
      </span>
      {error ? <span className="text-[0.72rem] font-medium text-rose-600">{error}</span> : null}
    </label>
  );
}
