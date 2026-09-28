"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Camera,
  Check,
  ChevronRight,
  CreditCard,
  FileText,
  GraduationCap,
  HeartHandshake,
  Image as ImageIcon,
  Landmark,
  Lock,
  Mail,
  PartyPopper,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  optionLabel,
  optionLabels,
  PAYMENT_ACCOUNTS,
  PAYMENT_METHODS,
  registrationFeeLabel,
  registrationFeeNote,
  type RegistrationCourseConfig,
} from "@/lib/registration-config";
import { Field, ErrorNote, resizeImage } from "@/components/dashboard/ui";
import { useBodyScrollLock } from "@/lib/hooks";

const ease = [0.16, 1, 0.3, 1] as const;

interface WizardData {
  dob: string;
  phone: string;
  address: string;
  photo: string | null;
  photoName: string | null;
  education: { qualification: string; institution: string; yearOfPassing: string };
  study: {
    preferredTime: string;
    focusModules: string[];
    level: string;
    hoursPerWeek: string;
    heardAbout: string;
    extras: string;
  };
  payment: { method: string; note: string; receipt: string | null; receiptName: string | null };
  agreed: boolean;
  sendCopy: boolean;
  website?: string;
  company?: string;
}

const STEPS = [
  { key: "personal", label: "Details" },
  { key: "academics", label: "Academics" },
  { key: "study", label: "Study" },
  { key: "payment", label: "Payment" },
  { key: "review", label: "Review" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

export function RegistrationWizard({
  course,
  userName,
  userEmail,
  onExit,
  onSuccess,
}: {
  course: RegistrationCourseConfig;
  userName: string;
  userEmail: string;
  onExit: () => void;
  onSuccess: (ref: string) => void;
}) {
  const [step, setStep] = useState<StepKey>("personal");
  const [data, setData] = useState<WizardData>({
    dob: "",
    phone: "",
    address: "",
    photo: null,
    photoName: null,
    education: { qualification: "", institution: "", yearOfPassing: "" },
    study: {
      preferredTime: "",
      focusModules: [],
      level: "",
      hoursPerWeek: "",
      heardAbout: "",
      extras: "",
    },
    payment: { method: "Easypaisa", note: "", receipt: null, receiptName: null },
    agreed: false,
    sendCopy: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState<{ ref: string } | null>(null);

  // The fixed marketing navbar sits at z-[100]; the wizard must layer above it
  // and lock page scroll while the registration form is open.
  useBodyScrollLock(true);

  const photoInput = useRef<HTMLInputElement>(null);
  const receiptInput = useRef<HTMLInputElement>(null);

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const set = <K extends keyof WizardData>(key: K, value: WizardData[K]) => {
    setData((d) => ({ ...d, [key]: value }));
    setErrors((e) => {
      const next = { ...e };
      delete next[key];
      return next;
    });
  };

  const validateStep = (k: StepKey): boolean => {
    const errs: Record<string, string> = {};
    if (k === "personal") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.dob)) errs.dob = "Enter your date of birth.";
      else {
        const d = new Date(data.dob);
        if (Number.isNaN(d.getTime()) || d.getTime() > Date.now() - 3 * 365 * 86400_000)
          errs.dob = "Enter a valid date of birth.";
      }
      if (!/^[+\d][\d\s\-()]{5,}$/.test(data.phone.trim())) errs.phone = "Enter a valid phone number.";
      if (data.address.trim().length < 5) errs.address = "Enter your complete address.";
      if (!data.photo) errs.photo = "Please upload your photo (JPG, PNG or WebP).";
    }
    if (k === "academics") {
      if (data.education.qualification.trim().length < 2) errs.qualification = "Enter your highest qualification.";
      if (data.education.institution.trim().length < 2) errs.institution = "Enter your institution.";
      const y = Number(data.education.yearOfPassing);
      if (!/^\d{4}$/.test(data.education.yearOfPassing) || y < 1950 || y > new Date().getFullYear() + 1)
        errs.yearOfPassing = "Enter a valid year (YYYY).";
    }
    if (k === "study") {
      if (!data.study.preferredTime) errs.preferredTime = "Pick your preferred study time.";
      if (data.study.focusModules.length === 0) errs.focusModules = "Select at least one module.";
      if (!data.study.level) errs.level = "Select your current level.";
      if (!data.study.hoursPerWeek) errs.hoursPerWeek = "Select your weekly study hours.";
      if (!data.study.heardAbout) errs.heardAbout = "Tell us how you heard about Language Hub.";
    }
    if (k === "payment") {
      if (!data.payment.method) errs.method = "Choose a payment method.";
      if (!data.payment.receipt) errs.receipt = "Upload your payment receipt or screenshot (PNG, JPG, WebP or PDF, max 10 MB).";
      if (data.payment.method === "Other" && data.payment.note.trim().length < 2)
        errs.note = "Describe your payment method so the team can verify the payment.";
    }
    if (k === "review") {
      if (!data.agreed) errs.agreed = "You must agree to the declaration to submit.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => {
    if (!validateStep(step)) return;
    const nextIdx = stepIndex + 1;
    if (nextIdx < STEPS.length) setStep(STEPS[nextIdx].key);
  };

  const back = () => {
    if (stepIndex > 0) setStep(STEPS[stepIndex - 1].key);
    else onExit();
  };

  const submit = async () => {
    if (!validateStep("review")) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const body = {
        courseKey: course.key,
        dob: data.dob,
        phone: data.phone.trim(),
        address: data.address.trim(),
        education: {
          qualification: data.education.qualification.trim(),
          institution: data.education.institution.trim(),
          yearOfPassing: data.education.yearOfPassing,
        },
        study: {
          preferredTime: data.study.preferredTime,
          focusModules: data.study.focusModules,
          level: data.study.level,
          hoursPerWeek: data.study.hoursPerWeek,
          heardAbout: data.study.heardAbout,
          extras: data.study.extras || null,
        },
        payment: {
          method: data.payment.method,
          note: data.payment.method === "Other" ? data.payment.note.trim() || null : data.payment.note.trim() || null,
          receipt: data.payment.receipt,
          receiptName: data.payment.receiptName,
        },
        photo: data.photo,
        agreed: data.agreed,
        sendCopy: data.sendCopy,
        website: data.website ?? "",
        company: data.company ?? "",
      };
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = d?.errors?.photo?.[0] ?? d?.errors?.receipt?.[0] ?? d?.errors?.agreed?.[0] ?? d?.message ?? "Could not submit. Please try again.";
        setSubmitError(msg);
        return;
      }
      setDone({ ref: d.ref as string });
      onSuccess(d.ref as string);
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleModule = (value: string) => {
    setData((d) => {
      const has = d.study.focusModules.includes(value);
      const focusModules = has
        ? d.study.focusModules.filter((m) => m !== value)
        : [...d.study.focusModules, value];
      setErrors((e) => {
        const next = { ...e };
        delete next.focusModules;
        return next;
      });
      return { ...d, study: { ...d.study, focusModules } };
    });
  };

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrors((x) => ({ ...x, photo: "Photo must be a JPG, PNG or WebP image." }));
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setErrors((x) => ({ ...x, photo: "Photo must be under 3 MB." }));
      return;
    }
    try {
      const dataUrl = await resizeImage(file, 640);
      set("photo", dataUrl);
      set("photoName", file.name);
    } catch {
      setErrors((x) => ({ ...x, photo: "Could not read that image." }));
    }
  };

  const onReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    if (!isImage && !isPdf) {
      setErrors((x) => ({ ...x, receipt: "Receipt must be a PNG, JPG, WebP image or a PDF." }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrors((x) => ({ ...x, receipt: "Receipt must be under 10 MB." }));
      return;
    }
    try {
      const dataUrl = isPdf ? await readAsDataUrl(file) : await resizeImage(file, 1600);
      set("payment", { ...data.payment, receipt: dataUrl, receiptName: file.name });
      setErrors((x) => {
        const next = { ...x };
        delete next.receipt;
        return next;
      });
    } catch {
      setErrors((x) => ({ ...x, receipt: "Could not read that file." }));
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-slate-900/50 px-3 py-6 backdrop-blur-md sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease }}
        className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-[0_50px_120px_-40px_rgb(15_23_42/0.6)]"
        role="dialog"
        aria-modal="true"
        aria-label={`${course.name} registration form`}
      >
        {/* header band */}
        <div
          className="relative overflow-hidden px-6 pb-5 pt-6 text-white sm:px-8"
          style={{ background: `linear-gradient(120deg, ${course.accent.from}, ${course.accent.to})` }}
        >
          <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
          <span aria-hidden className="pointer-events-none absolute right-24 top-4 h-24 w-24 rounded-full bg-white/10 blur-xl" />
          <button
            type="button"
            onClick={onExit}
            aria-label="Close registration form"
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition-all duration-300 hover:rotate-90 hover:bg-white/30"
          >
            <X className="h-4.5 w-4.5" />
          </button>

          <p className="flex items-center gap-2 font-mono text-[0.62rem] font-black uppercase tracking-[0.28em] text-white/80">
            <ShieldCheck className="h-4 w-4" /> Secure registration
          </p>
          <h2 className="mt-1.5 font-display text-[1.5rem] font-extrabold tracking-[-0.02em] sm:text-[1.8rem]">
            {course.name}
          </h2>
          <p className="mt-1 text-[0.85rem] text-white/85">{course.description}</p>
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.66rem] text-white/75">
            <span className="inline-flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {userName}</span>
            <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {userEmail}</span>
            <span className="inline-flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5" /> {course.duration}</span>
            <span className="inline-flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" /> {registrationFeeLabel(course)}</span>
          </p>

          {/* progress */}
          <ol className="mt-6 flex items-center gap-1.5">
            {STEPS.map((s, i) => {
              const active = s.key === step;
              const done = i < stepIndex;
              return (
                <li key={s.key} className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[0.58rem] font-black uppercase tracking-widest transition-all duration-300",
                      active
                        ? "border-white/60 bg-white text-slate-900 shadow-lg"
                        : done
                          ? "border-white/40 bg-white/20 text-white"
                          : "border-white/25 text-white/60"
                    )}
                  >
                    {done ? <Check className="h-3 w-3" strokeWidth={3} /> : <span>{i + 1}</span>}
                    <span className="hidden sm:inline">{s.label}</span>
                  </span>
                  {i < STEPS.length - 1 ? (
                    <span aria-hidden className={cn("h-px w-4 sm:w-6", done ? "bg-white/60" : "bg-white/20")} />
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>

        {/* body */}
        <div className="px-6 py-6 sm:px-8 sm:py-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.32, ease }}
            >
              {step === "personal" ? (
                <StepShell
                  title="Tell us about yourself"
                  hint="This helps us plan your batch and verify your identity securely."
                  icon={<User className="h-5 w-5" />}
                >
                  <div className="flex flex-col gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Date of birth" id="reg-dob" type="date" value={data.dob} onChange={(v) => set("dob", v)} error={errors.dob} />
                      <Field label="Phone number" id="reg-phone" type="tel" value={data.phone} onChange={(v) => set("phone", v)} placeholder="+92 3XX 1234567" error={errors.phone} />
                    </div>
                    <div>
                      <label htmlFor="reg-address" className="mb-1.5 block font-display text-[0.66rem] font-bold uppercase tracking-[0.2em] text-slate-600">
                        Postal address
                      </label>
                      <textarea
                        id="reg-address"
                        value={data.address}
                        onChange={(e) => set("address", e.target.value)}
                        rows={2}
                        placeholder="Street, area, city"
                        className={cn(
                          "w-full resize-none rounded-xl border bg-white px-4 py-3 text-[0.95rem] text-slate-900 shadow-[0_1px_2px_rgb(15_23_42/0.04)] outline-none transition-all placeholder:text-slate-400",
                          errors.address
                            ? "border-rose-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10"
                            : "border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/12"
                        )}
                      />
                      {errors.address ? <p className="mt-1.5 text-[0.78rem] font-medium text-rose-600">{errors.address}</p> : null}
                    </div>

                    {/* photo upload */}
                    <div>
                      <p className="mb-2 font-display text-[0.66rem] font-bold uppercase tracking-[0.2em] text-slate-600">
                        Your photo <span aria-hidden>*</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-50">
                          {data.photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={data.photo} alt="Your photo preview" className="h-full w-full object-cover" />
                          ) : (
                            <span className="grid h-full w-full place-items-center text-slate-300">
                              <Camera className="h-7 w-7" />
                            </span>
                          )}
                          <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-indigo-600 to-violet-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => photoInput.current?.click()}
                            className="inline-flex h-10 items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/60 px-5 font-display text-[0.78rem] font-bold text-indigo-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-100"
                          >
                            <Camera className="h-4 w-4" /> {data.photo ? "Change photo" : "Upload photo"}
                          </button>
                          <p className="mt-1.5 text-[0.72rem] text-slate-400">
                            JPG, PNG or WebP · under 3 MB. Used on your registration record and the PDF summary.
                          </p>
                          <input ref={photoInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onPhoto} />
                        </div>
                      </div>
                      {errors.photo ? <p className="mt-1.5 text-[0.78rem] font-medium text-rose-600">{errors.photo}</p> : null}
                    </div>
                  </div>
                </StepShell>
              ) : null}

              {step === "academics" ? (
                <StepShell
                  title="Academic background"
                  hint="Your highest qualification helps our teachers place you in the right batch."
                  icon={<GraduationCap className="h-5 w-5" />}
                >
                  <div className="grid gap-4">
                    <Field label="Highest qualification" id="reg-qualification" value={data.education.qualification} onChange={(v) => set("education", { ...data.education, qualification: v })} placeholder="e.g. Bachelor of Science (BS)" error={errors.qualification} />
                    <Field label="Institution" id="reg-institution" value={data.education.institution} onChange={(v) => set("education", { ...data.education, institution: v })} placeholder="e.g. University of the Punjab" error={errors.institution} />
                    <Field label="Year of passing" id="reg-year" type="number" value={data.education.yearOfPassing} onChange={(v) => set("education", { ...data.education, yearOfPassing: v })} placeholder="e.g. 2024" error={errors.yearOfPassing} />
                  </div>
                </StepShell>
              ) : null}

              {step === "study" ? (
                <StepShell
                  title="Your study plan"
                  hint={`${course.focusQuestion} Choose what fits your goals.`}
                  icon={<Sparkles className="h-5 w-5" />}
                >
                  <div className="flex flex-col gap-5">
                    {/* focus modules */}
                    <div>
                      <p className="mb-2 flex items-center gap-2 font-display text-[0.72rem] font-bold text-slate-700">
                        {course.focusQuestion} <span className="font-mono text-[0.58rem] font-bold uppercase tracking-widest text-slate-400">(choose one or more)</span>
                      </p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {course.focusOptions.map((o) => {
                          const on = data.study.focusModules.includes(o.value);
                          return (
                            <button
                              key={o.value}
                              type="button"
                              onClick={() => toggleModule(o.value)}
                              className={cn(
                                "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-start font-display text-[0.84rem] font-bold transition-all duration-200",
                                on
                                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-[0_10px_24px_-12px_rgb(99_102_241/0.5)]"
                                  : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                              )}
                            >
                              <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-md border", on ? "border-indigo-500 bg-indigo-500 text-white" : "border-slate-300")}>
                                {on ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                              </span>
                              {o.label}
                            </button>
                          );
                        })}
                      </div>
                      {errors.focusModules ? <p className="mt-1.5 text-[0.78rem] font-medium text-rose-600">{errors.focusModules}</p> : null}
                    </div>

                    {course.extraQuestion ? (
                      <ChoiceGroup
                        title={course.extraQuestion.title}
                        options={course.extraQuestion.options.map((o) => o.label)}
                        value={data.study.extras}
                        required
                        onChange={(labelOpt) => set("study", { ...data.study, extras: labelOpt })}
                      />
                    ) : null}

                    <ChoiceGroup
                      title="What is your preferred study time?"
                      options={course.preferredTimeOptions.map((o) => o.label)}
                      value={data.study.preferredTime}
                      required
                      error={errors.preferredTime}
                      onChange={(v) => set("study", { ...data.study, preferredTime: v })}
                    />
                    <ChoiceGroup
                      title="Your current level of language learning"
                      options={course.levelOptions.map((o) => o.label)}
                      value={data.study.level}
                      required
                      error={errors.level}
                      onChange={(v) => set("study", { ...data.study, level: v })}
                    />
                    <ChoiceGroup
                      title="How many hours of study do you want per week?"
                      options={course.hoursOptions.map((o) => o.label)}
                      value={data.study.hoursPerWeek}
                      required
                      error={errors.hoursPerWeek}
                      onChange={(v) => set("study", { ...data.study, hoursPerWeek: v })}
                    />
                    <ChoiceGroup
                      title="Through which medium did you hear about Language Hub?"
                      options={course.heardOptions.map((o) => o.label)}
                      value={data.study.heardAbout}
                      required
                      error={errors.heardAbout}
                      onChange={(v) => set("study", { ...data.study, heardAbout: v })}
                    />
                  </div>
                </StepShell>
              ) : null}

              {step === "payment" ? (
                <StepShell
                  title="Payment method"
                  hint="Strict verification — upload your payment proof so our team can confirm your seat."
                  icon={<CreditCard className="h-5 w-5" />}
                >
                  <div className="flex flex-col gap-5">
                    {/* fee summary */}
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 px-5 py-4">
                      <div>
                        <p className="font-display text-[0.58rem] font-bold uppercase tracking-[0.26em] text-indigo-500">Course fee</p>
                        <p className="mt-1 font-display text-[1.7rem] font-extrabold tracking-[-0.02em] text-slate-900">{registrationFeeLabel(course)}</p>
                      </div>
                      <p className="max-w-[16rem] text-[0.78rem] leading-relaxed text-slate-500">{registrationFeeNote(course)}</p>
                    </div>

                    <ChoiceGroup
                      title="Payment method"
                      options={[...PAYMENT_METHODS]}
                      value={data.payment.method}
                      required
                      onChange={(m) => set("payment", { ...data.payment, method: m })}
                    />

                    {/* account details */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {Object.values(PAYMENT_ACCOUNTS).map((acct) => (
                        <div key={acct.label} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                          <p className="flex items-center gap-2 font-display text-[0.66rem] font-black uppercase tracking-[0.2em] text-slate-700">
                            {acct.label === "Easypaisa" ? <ImageIcon className="h-4 w-4 text-emerald-600" /> : <Landmark className="h-4 w-4 text-indigo-600" />}
                            {acct.label}
                          </p>
                          <div className="mt-2 space-y-1">
                            {acct.rows.map((r) => (
                              <p key={r.label} className="font-mono text-[0.74rem] text-slate-600">
                                <span className="text-slate-400">{r.label}:</span> <b className="text-slate-900">{r.value}</b>
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[0.8rem] text-amber-700">
                      <Lock className="h-4 w-4 shrink-0" /> Send your fee to one of the accounts above, then upload your proof. Our team verifies every payment manually.
                    </p>

                    {data.payment.method === "Other" ? (
                      <Field label="Describe your payment method" id="reg-pay-note" value={data.payment.note} onChange={(v) => set("payment", { ...data.payment, note: v })} placeholder="e.g. JazzCash transaction via a family account" error={errors.note} />
                    ) : null}

                    {/* receipt upload */}
                    <div>
                      <p className="mb-2 font-display text-[0.66rem] font-bold uppercase tracking-[0.2em] text-slate-600">
                        Payment proof {data.payment.receipt ? "(uploaded)" : ""}{" "}
                        <span className="text-rose-500">*</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => receiptInput.current?.click()}
                        className={cn(
                          "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-all duration-300",
                          errors.receipt
                            ? "border-rose-300 bg-rose-50/50"
                            : data.payment.receipt
                              ? "border-emerald-300 bg-emerald-50/50"
                              : "border-slate-300 bg-slate-50/60 hover:border-indigo-400 hover:bg-indigo-50/40"
                        )}
                      >
                        {data.payment.receipt ? (
                          <>
                            <BadgeCheck className="h-7 w-7 text-emerald-600" />
                            <span className="font-display text-[0.9rem] font-bold text-slate-800">{data.payment.receiptName}</span>
                            <span className="font-mono text-[0.66rem] uppercase tracking-widest text-slate-400">Tap to replace</span>
                          </>
                        ) : (
                          <>
                            <FileText className="h-7 w-7 text-slate-400" />
                            <span className="font-display text-[0.95rem] font-bold text-slate-700">Upload payment receipt</span>
                            <span className="font-mono text-[0.66rem] uppercase tracking-widest text-slate-400">supported · 1 file · max 10 MB</span>
                          </>
                        )}
                      </button>
                      <p className="mt-1.5 text-[0.72rem] text-slate-400">
                        Screenshot of your transaction or an account statement — PNG, JPG, WebP or PDF (max 10 MB).
                      </p>
                      <input
                        ref={receiptInput}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,application/pdf"
                        className="hidden"
                        onChange={onReceipt}
                      />
                      {errors.receipt ? <p className="mt-1.5 text-[0.78rem] font-medium text-rose-600">{errors.receipt}</p> : null}
                    </div>
                  </div>
                </StepShell>
              ) : null}

              {step === "review" ? (
                <StepShell
                  title="Review & submit"
                  hint="Your responses are bundled into a secure PDF and sent to the Language Hub team instantly."
                  icon={<HeartHandshake className="h-5 w-5" />}
                >
                  <div className="flex flex-col gap-5">
                    <ReviewGrid
                      course={course}
                      data={data}
                    />

                    <label
                      htmlFor="reg-agree"
                      className={cn(
                        "flex items-start gap-3 rounded-2xl border px-4 py-4 transition-all",
                        errors.agreed ? "border-rose-300 bg-rose-50/60" : data.agreed ? "border-emerald-300 bg-emerald-50/50" : "border-slate-200 bg-slate-50/60"
                      )}
                    >
                      <input
                        id="reg-agree"
                        type="checkbox"
                        checked={data.agreed}
                        onChange={(e) => set("agreed", e.target.checked)}
                        className="mt-0.5 h-5 w-5 shrink-0 accent-indigo-600"
                      />
                      <span className="text-[0.88rem] leading-relaxed text-slate-600">
                        I hereby declare that the information provided is accurate and true. I understand that any false
                        information may lead to cancellation of my registration.
                      </span>
                    </label>
                    {errors.agreed ? <p className="-mt-2 text-[0.78rem] font-medium text-rose-600">{errors.agreed}</p> : null}

                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <input
                        type="checkbox"
                        checked={data.sendCopy}
                        onChange={(e) => set("sendCopy", e.target.checked)}
                        className="h-5 w-5 shrink-0 accent-indigo-600"
                      />
                      <span className="text-[0.88rem] font-medium text-slate-700">
                        Send me a copy of my responses by email
                      </span>
                    </label>

                    {submitError ? <ErrorNote>{submitError}</ErrorNote> : null}
                  </div>
                </StepShell>
              ) : null}
            </motion.div>
          </AnimatePresence>

          {/* actions */}
          {!done ? (
            <div className="mt-7 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={back}
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 font-display text-[0.85rem] font-bold text-slate-500 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
                {step === "personal" ? "Cancel" : "Back"}
              </button>

              {step !== "review" ? (
                <button
                  type="button"
                  onClick={next}
                  className="group inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-7 font-display text-[0.9rem] font-bold text-white shadow-[0_14px_30px_-12px_rgb(99_102_241/0.75)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-12px_rgb(99_102_241/0.85)] hover:brightness-[1.05]"
                >
                  Next
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting}
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-7 font-display text-[0.9rem] font-bold text-white shadow-[0_14px_30px_-12px_rgb(16_185_129/0.75)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-12px_rgb(16_185_129/0.85)] hover:brightness-[1.05] disabled:opacity-60"
                >
                  {submitting ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  {submitting ? "Submitting…" : "Submit registration"}
                </button>
              )}
            </div>
          ) : null}
        </div>

        {/* success state */}
        {done ? (
          <div className="absolute inset-0 z-10 grid place-items-center bg-white/95 px-6 backdrop-blur">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease }}
              className="max-w-md text-center"
            >
              <motion.span
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 16 }}
                className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-[0_24px_50px_-16px_rgb(16_185_129/0.7)]"
              >
                <PartyPopper className="h-9 w-9" />
              </motion.span>
              <p className="mt-5 font-mono text-[0.62rem] font-black uppercase tracking-[0.32em] text-emerald-600">
                Registration received
              </p>
              <h3 className="mt-2 font-display text-[1.9rem] font-extrabold tracking-[-0.03em] text-slate-900">
                Thank you for choosing <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Language Hub.</span>
              </h3>
              <p className="mt-2 font-display text-[0.92rem] text-slate-500">
                Every language journey begins with one small step — you&apos;ve just taken yours.
              </p>
              <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-5 py-4">
                <p className="font-mono text-[0.62rem] uppercase tracking-widest text-indigo-500">Your reference</p>
                <p className="mt-1 font-mono text-[1.1rem] font-black tracking-wide text-indigo-700">{done.ref}</p>
              </div>
              <p className="mt-4 text-[0.9rem] leading-relaxed text-slate-600">
                We&apos;ve received your application safely. Our team is now
                reviewing it and will confirm your seat soon.
                <b> We will reply within 24 hours</b> on WhatsApp or email to confirm your seat and next steps.
              </p>
              <button
                type="button"
                onClick={onExit}
                className="mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 font-display text-[0.9rem] font-bold text-white shadow-[0_14px_30px_-12px_rgb(99_102_241/0.75)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-[1.05]"
              >
                Done <ChevronRight className="h-4 w-4" />
              </button>
            </motion.div>
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(new Error("read failed"));
    fr.readAsDataURL(file);
  });
}

function StepShell({
  title,
  hint,
  icon,
  children,
}: {
  title: string;
  hint: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-[0_10px_24px_-10px_rgb(99_102_241/0.7)]">
          {icon}
        </span>
        <div>
          <h3 className="font-display text-[1.25rem] font-extrabold tracking-[-0.01em] text-slate-900">{title}</h3>
          <p className="text-[0.8rem] text-slate-400">{hint}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function ChoiceGroup({
  title,
  options,
  value,
  onChange,
  required,
  error,
}: {
  title: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  error?: string;
}) {
  return (
    <div>
      <p className="mb-2 font-display text-[0.72rem] font-bold text-slate-700">
        {title} {required ? <span className="text-rose-500">*</span> : null}
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((o) => {
          const on = value === o;
          return (
            <button
              key={o}
              type="button"
              onClick={() => onChange(o === value && !required ? "" : o)}
              className={cn(
                "inline-flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-start font-display text-[0.84rem] font-bold transition-all duration-200",
                on
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-[0_10px_24px_-12px_rgb(99_102_241/0.5)]"
                  : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
              )}
            >
              <span className={cn("grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full border-2", on ? "border-indigo-500 bg-indigo-500" : "border-slate-300")}>
                {on ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
              </span>
              {o}
            </button>
          );
        })}
      </div>
      {error ? <p className="mt-1.5 text-[0.78rem] font-medium text-rose-600">{error}</p> : null}
    </div>
  );
}

function ReviewGrid({ course, data }: { course: RegistrationCourseConfig; data: WizardData }) {
  const focus = optionLabels(course.focusOptions, data.study.focusModules);
  const rows = useMemo(
    () =>
      (
        [
          ["Course", course.name],
          ["Date of birth", data.dob],
          ["Phone", data.phone],
          ["Address", data.address],
          ["Highest qualification", data.education.qualification],
          ["Institution", data.education.institution],
          ["Year of passing", data.education.yearOfPassing],
          ["Preferred study time", optionLabel(course.preferredTimeOptions, data.study.preferredTime)],
          ["Modules to enhance", focus.join(", ")],
          ...(data.study.extras && course.extraQuestion ? [[course.extraQuestion.title, optionLabel(course.extraQuestion.options, data.study.extras)] as [string, string]] : []),
          ["Current level", optionLabel(course.levelOptions, data.study.level)],
          ["Hours per week", optionLabel(course.hoursOptions, data.study.hoursPerWeek)],
          ["Heard about via", optionLabel(course.heardOptions, data.study.heardAbout)],
          ["Payment method", data.payment.method],
          ["Programme fee", registrationFeeLabel(course)],
        ] as Array<[string, string]>
      ).filter(([, v]) => v && v.trim().length > 0),
    [course, data, focus]
  );
  return (
    <div className="grid gap-x-6 gap-y-2 rounded-2xl border border-slate-200 bg-slate-50/50 p-5 sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k} className="border-b border-slate-100 pb-2">
          <dt className="font-mono text-[0.58rem] uppercase tracking-widest text-slate-400">{k}</dt>
          <dd className="font-display text-[0.9rem] font-bold text-slate-800">{v}</dd>
        </div>
      ))}
    </div>
  );
}