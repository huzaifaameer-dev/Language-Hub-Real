"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { signOut } from "next-auth/react";
import {
  Download,
  KeyRound,
  Settings,
  Trash2,
  User,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 flex items-center gap-2 font-display text-[0.62rem] font-bold uppercase tracking-[0.26em] text-indigo-600">
      {children}
    </p>
  );
}

function ModalInput({
  id, label, value, onChange, type = "text", placeholder, hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block font-display text-[0.66rem] font-bold uppercase tracking-[0.2em] text-slate-600">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[0.92rem] text-slate-900 shadow-[0_1px_2px_rgb(15_23_42/0.04)] outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/12"
      />
      {hint ? <p className="mt-1 text-[0.72rem] text-slate-400">{hint}</p> : null}
    </div>
  );
}

function SmallMeta({ type, children }: { type: "ok" | "err" | "busy"; children: React.ReactNode }) {
  return (
    <p
      className={cn(
        "flex items-center gap-2 text-[0.78rem] font-medium",
        type === "ok" ? "text-emerald-600" : type === "err" ? "text-rose-600" : "text-indigo-600"
      )}
    >
      {type === "busy" ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-500" /> : null}
      {children}
    </p>
  );
}

export function SettingsModal({
  name,
  email,
  open,
  onClose,
  onSaved,
}: {
  name: string;
  email: string;
  open: boolean;
  onClose: () => void;
  onSaved: (name: string) => void;
}) {
  const [profileName, setProfileName] = useState(name);
  const [whatsapp, setWhatsapp] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [deleteArmed, setDeleteArmed] = useState(false);
  const [delPassword, setDelPassword] = useState("");
  const [delBusy, setDelBusy] = useState(false);
  const [delMsg, setDelMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user) {
          setProfileName(d.user.name ?? name);
          setWhatsapp(d.user.whatsapp ?? "");
        }
      })
      .catch(() => {});
  }, [open, name]);

  if (!open) return null;

  const saveProfile = async () => {
    setProfileBusy(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileName, whatsapp }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = d?.errors?.name?.[0] ?? d?.errors?.whatsapp?.[0] ?? d?.message ?? "Could not save your details.";
        setProfileMsg({ type: "err", text: msg });
        return;
      }
      setProfileMsg({ type: "ok", text: "Saved." });
      onSaved(d.user?.name ?? profileName.trim());
    } catch {
      setProfileMsg({ type: "err", text: "Network error. Please try again." });
    } finally {
      setProfileBusy(false);
    }
  };

  const savePassword = async () => {
    setPwMsg(null);
    if (pw.next.length < 8) {
      setPwMsg({ type: "err", text: "New password must be at least 8 characters." });
      return;
    }
    if (pw.next !== pw.confirm) {
      setPwMsg({ type: "err", text: "New passwords do not match." });
      return;
    }
    setPwBusy(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current: pw.current, next: pw.next }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPwMsg({ type: "err", text: d?.message ?? "Could not change your password." });
        return;
      }
      setPwMsg({ type: "ok", text: "Password updated." });
      setPw({ current: "", next: "", confirm: "" });
    } catch {
      setPwMsg({ type: "err", text: "Network error. Please try again." });
    } finally {
      setPwBusy(false);
    }
  };

  const deleteAccount = async () => {
    setDelBusy(true);
    setDelMsg(null);
    try {
      const res = await fetch("/api/profile", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: delPassword }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDelMsg(d?.message ?? "Could not delete your account.");
        return;
      }
      onClose();
      await signOut({ callbackUrl: "/" });
    } catch {
      setDelMsg("Network error. Please try again.");
    } finally {
      setDelBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/45 px-5 py-10 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Account settings"
    >
      <motion.div
        initial={{ opacity: 0, y: 36, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease }}
        className="relative w-full max-w-lg rounded-[2rem] border border-white/70 bg-white/95 p-7 shadow-[0_40px_90px_-30px_rgb(15_23_42/0.55)] backdrop-blur-2xl sm:p-9"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close settings"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-400 transition-all duration-300 hover:rotate-90 hover:border-slate-300 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="flex items-center gap-3 font-display text-[0.58rem] font-bold uppercase tracking-[0.36em] text-indigo-600">
          <span aria-hidden className="h-px w-6 bg-indigo-500/40" /> Account settings
        </p>
        <h3 className="mt-1.5 font-display text-[1.5rem] font-extrabold tracking-[-0.02em]">
          YOUR <span className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">PROFILE.</span>
        </h3>
        <p className="mt-1 text-[0.88rem] text-slate-500">{email}</p>

        <div className="mt-6 flex flex-col gap-5">
          {/* Profile */}
          <section>
            <SectionLabel>
              <User className="h-3.5 w-3.5" strokeWidth={2.2} /> Profile
            </SectionLabel>
            <div className="flex flex-col gap-3">
              <ModalInput id="set-name" label="Full name" value={profileName} onChange={setProfileName} />
              <ModalInput
                id="set-whatsapp"
                label="WhatsApp number"
                value={whatsapp}
                onChange={setWhatsapp}
                placeholder="e.g. +92 3XX 1234567"
                hint="Optional — used so the team can reach you about your classes."
              />
            </div>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={saveProfile}
                disabled={profileBusy}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-indigo-600 px-5 font-display text-[0.8rem] font-bold text-white shadow-[0_10px_24px_-10px_rgb(99_102_241/0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-[1.06] disabled:opacity-60"
              >
                {profileBusy ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}
                Save profile
              </button>
              {profileMsg ? <SmallMeta type={profileMsg.type}>{profileMsg.text}</SmallMeta> : null}
            </div>
          </section>

          {/* Security */}
          <section>
            <SectionLabel>
              <KeyRound className="h-3.5 w-3.5" strokeWidth={2.2} /> Security · change password
            </SectionLabel>
            <div className="flex flex-col gap-3">
              <ModalInput
                id="pw-current"
                type="password"
                label="Current password"
                value={pw.current}
                onChange={(v) => setPw({ ...pw, current: v })}
              />
              <ModalInput
                id="pw-next"
                type="password"
                label="New password"
                value={pw.next}
                onChange={(v) => setPw({ ...pw, next: v })}
                hint="At least 8 characters with a letter, a number and a special character."
              />
              <ModalInput
                id="pw-confirm"
                type="password"
                label="Confirm new password"
                value={pw.confirm}
                onChange={(v) => setPw({ ...pw, confirm: v })}
              />
            </div>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={savePassword}
                disabled={pwBusy}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-indigo-600 px-5 font-display text-[0.8rem] font-bold text-white shadow-[0_10px_24px_-10px_rgb(99_102_241/0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-[1.06] disabled:opacity-60"
              >
                {pwBusy ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}
                Update password
              </button>
              {pwMsg ? <SmallMeta type={pwMsg.type}>{pwMsg.text}</SmallMeta> : null}
            </div>
          </section>

          {/* Data & account */}
          <section>
            <SectionLabel>
              <Settings className="h-3.5 w-3.5" strokeWidth={2.2} /> Data & account
            </SectionLabel>
            <div className="flex flex-col gap-3">
              <a
                href="/api/profile/export"
                download
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white font-display text-[0.82rem] font-bold text-slate-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-600"
              >
                <Download className="h-4 w-4" strokeWidth={2} />
                Export my data (JSON)
              </a>

              <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
                {!deleteArmed ? (
                  <>
                    <p className="text-[0.88rem] font-semibold text-rose-700">Delete my account</p>
                    <p className="mt-1 text-[0.78rem] leading-relaxed text-rose-500">
                      Permanently removes your account, applications, enrollments and notifications.
                    </p>
                    <button
                      type="button"
                      onClick={() => setDeleteArmed(true)}
                      className="mt-3 inline-flex h-9 items-center gap-2 rounded-full border border-rose-300 bg-white px-4 font-display text-[0.75rem] font-bold text-rose-600 transition-all duration-300 hover:bg-rose-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                      Continue…
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-[0.88rem] font-semibold text-rose-700">Are you absolutely sure?</p>
                    <p className="mt-1 text-[0.78rem] leading-relaxed text-rose-500">
                      This cannot be undone. Enter your password to confirm.
                    </p>
                    <input
                      id="del-password"
                      type="password"
                      value={delPassword}
                      onChange={(e) => setDelPassword(e.target.value)}
                      placeholder="Your password"
                      className="mt-3 w-full rounded-xl border border-rose-300 bg-white px-4 py-2.5 text-[0.9rem] text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10"
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={deleteAccount}
                        disabled={delBusy || !delPassword}
                        className="inline-flex h-9 items-center gap-2 rounded-full bg-rose-600 px-4 font-display text-[0.75rem] font-bold text-white transition-all duration-300 hover:bg-rose-700 disabled:opacity-50"
                      >
                        {delBusy ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}
                        Yes, permanently delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteArmed(false)}
                        disabled={delBusy}
                        className="inline-flex h-9 items-center rounded-full border border-slate-200 bg-white px-4 font-display text-[0.75rem] font-bold text-slate-500 transition-all duration-300 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                    {delMsg ? <SmallMeta type="err">{delMsg}</SmallMeta> : null}
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
}