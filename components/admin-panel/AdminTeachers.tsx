"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  CalendarDays,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  Power,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
  UserRoundPlus,
  X,
} from "lucide-react";
import type { AdminTeacher } from "./types";
import { AvatarInitial, SearchBox, SectionTitle } from "./ui";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

export function AdminTeachers() {
  const [list, setList] = useState<AdminTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/teachers", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { teachers: AdminTeacher[] };
        setList(data.teachers ?? []);
      }
    } catch {
      // keep whatever is on screen; a refresh will retry
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((t) => `${t.name} ${t.email} ${t.role}`.toLowerCase().includes(q));
  }, [list, query]);

  const notify = useCallback((kind: "ok" | "err", text: string) => {
    setMessage({ kind, text });
    window.setTimeout(() => setMessage(null), 4500);
  }, []);

  const patch = async (id: string, body: Record<string, unknown>, okMsg: string) => {
    const res = await fetch(`/api/admin/teachers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) {
      notify("err", data.message ?? "Action failed.");
      return false;
    }
    notify("ok", okMsg);
    await load();
    return true;
  };

  if (loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <div className="flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-widest text-ink-3">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading staff…
        </div>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionTitle kicker="Staff · credentials" title="Teachers" />
        <span className="rounded-full border border-brand/20 bg-brand/8 px-3.5 py-1.5 font-mono text-[0.68rem] font-black tracking-widest text-brand-deep">
          {list.filter((t) => !t.disabled).length} active
        </span>
      </div>

      <CreateTeacherForm
        onCreated={() => {
          notify("ok", "Teacher account created.");
          void load();
        }}
        onError={(msg) => notify("err", msg)}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchBox value={query} onChange={setQuery} placeholder="Search name, email, role…" />
        <p className="font-mono text-[0.62rem] uppercase tracking-widest text-ink-3">
          Roles: ADMIN (super) · TEACHER (portal)
        </p>
      </div>

      {message ? (
        <p
          className={cn(
            "rounded-xl border px-4 py-3 font-display text-[0.82rem] font-bold",
            message.kind === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-600"
          )}
        >
          {message.text}
        </p>
      ) : null}

      {matches.length === 0 ? (
        <div className="glass-dash grid place-items-center overflow-hidden rounded-[1.75rem] px-6 py-16 text-center">
          <p className="font-display text-4xl font-extrabold text-slate-200">∅</p>
          <p className="mt-3 font-display text-[0.95rem] font-bold text-ink-2">No staff here</p>
          <p className="font-mono text-[0.7rem] text-ink-3">
            Create a teacher above — their credentials unlock the management portal at /manage.
          </p>
        </div>
      ) : (
        matches.map((t, i) => (
          <StaffCard
            key={t.id}
            teacher={t}
            index={i}
            onPatch={(body, okMsg) => patch(t.id, body, okMsg)}
            onChanged={load}
            onError={(msg) => notify("err", msg)}
          />
        ))
      )}
    </section>
  );
}

function CreateTeacherForm({
  onCreated,
  onError,
}: {
  onCreated: () => void;
  onError: (msg: string) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        onError(data.message ?? "Could not create the teacher.");
        return;
      }
      setName("");
      setEmail("");
      setPassword("");
      onCreated();
    } catch {
      onError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "w-full h-11 rounded-xl border border-ink/12 bg-white/80 px-3.5 font-display text-[0.85rem] text-ink outline-none transition-all backdrop-blur-md placeholder:text-ink-3/80 focus:border-brand focus:ring-4 focus:ring-brand/80/15";

  return (
    <form onSubmit={submit} className="glass-dash relative overflow-hidden rounded-[1.75rem] p-6">
      <span aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-brand-magenta/10 blur-3xl" />
      <div className="relative">
        <p className="flex items-center gap-2 font-display text-[0.68rem] font-bold uppercase tracking-[0.3em] text-brand-deep">
          <UserRoundPlus className="h-4 w-4" /> Create teacher credentials
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1.1fr_1.1fr_auto]">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            placeholder="Full name"
            aria-label="Teacher name"
            className={inputCls}
          />
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              placeholder="teacher@email.com"
              aria-label="Teacher email"
              className={cn(inputCls, "pl-10")}
            />
          </div>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPass ? "text" : "password"}
              required
              minLength={8}
              placeholder="Create password"
              aria-label="Teacher password"
              className={cn(inputCls, "pl-10 pr-10")}
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              aria-label={showPass ? "Hide password" : "Show password"}
              className="absolute right-2.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-cream hover:text-ink"
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-deep to-brand-deep px-5 font-display text-[0.82rem] font-bold text-white shadow-[0_14px_30px_-12px_rgb(99_102_241/0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-[1.05] disabled:opacity-60"
          >
            {busy ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                <Save className="h-4 w-4" /> Create
              </>
            )}
          </button>
        </div>
        <p className="mt-3 font-mono text-[0.62rem] text-ink-3">
          The teacher signs in at <span className="font-black text-brand-deep">/manage</span> with these credentials.
        </p>
      </div>
    </form>
  );
}

function StaffCard({
  teacher,
  index,
  onPatch,
  onChanged,
  onError,
}: {
  teacher: AdminTeacher;
  index: number;
  onPatch: (body: Record<string, unknown>, okMsg: string) => Promise<boolean>;
  onChanged: () => void;
  onError: (msg: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const isAdmin = teacher.role === "ADMIN";
  const disabled = teacher.disabled;

  const run = async (body: Record<string, unknown>, okMsg: string) => {
    setBusy(true);
    try {
      const ok = await onPatch(body, okMsg);
      if (ok) onChanged();
    } catch {
      onError("Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease, delay: Math.min(0.16, index * 0.03) }}
      className={cn(
        "glass-dash relative overflow-hidden rounded-[1.5rem] transition-all duration-300",
        disabled && "opacity-70"
      )}
    >
      <span aria-hidden className={cn("absolute left-0 top-0 h-full w-1", isAdmin ? "bg-gradient-to-b from-brand/80 to-brand-magenta" : "bg-gradient-to-b from-emerald-400 to-brand-deep")} />
      <div className="flex flex-wrap items-center gap-4 px-5 py-4">
        <AvatarInitial name={teacher.name} />
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="min-w-0 flex-1 text-start"
        >
          <div className="flex flex-wrap items-center gap-2 pr-2">
            <h3 className="font-display text-[1.02rem] font-extrabold text-ink">{teacher.name}</h3>
            {disabled ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 font-mono text-[0.6rem] font-bold text-rose-600">
                <Power className="h-3 w-3" /> Disabled
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-mono text-[0.6rem] font-bold text-emerald-700">
                <BadgeCheck className="h-3 w-3" /> Active
              </span>
            )}
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[0.6rem] font-bold",
                isAdmin
                  ? "border-brand/20 bg-brand/8 text-brand-deep"
                  : "border-violet-200 bg-violet-50 text-violet-700"
              )}
            >
              {isAdmin ? <ShieldCheck className="h-3 w-3" /> : <UserRound className="h-3 w-3" />} {teacher.role}
            </span>
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[0.68rem] text-ink-3">
            <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{teacher.email}</span>
            <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />
              {new Date(teacher.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </p>
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            disabled={busy}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 font-display text-[0.72rem] font-bold transition-all",
              expanded
                ? "border-brand/[0.6] bg-brand-deep text-white"
                : "border-ink/12 bg-white/70 text-ink-2 hover:border-brand/45 hover:text-brand-deep"
            )}
          >
            Manage
          </button>
          {isAdmin ? null : (
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                if (!window.confirm("Remove this teacher account permanently?")) return;
                const res = await fetch(`/api/admin/teachers/${teacher.id}`, { method: "DELETE" });
                if (!res.ok) onError("Could not remove the teacher.");
                else onChanged();
              }}
              aria-label="Remove teacher"
              className="grid h-9 w-9 place-items-center rounded-full border border-rose-200 bg-rose-50/60 text-rose-600 transition-all hover:bg-rose-100 disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {expanded ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease }}
          className="border-t border-ink/8 px-5 py-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <ResetPassword
              disabled={isAdmin}
              busy={busy}
              onSubmit={(password) => run({ action: "RESET_PASSWORD", password }, "Password updated.")}
            />
            <StatusControls
              isAdmin={isAdmin}
              disabled={disabled}
              busy={busy}
              onSubmit={(d) => run({ action: "SET_STATUS", disabled: d }, d ? "Teacher disabled." : "Teacher enabled.")}
            />
          </div>
        </motion.div>
      ) : null}
    </motion.article>
  );
}

function ResetPassword({
  disabled,
  busy,
  onSubmit,
}: {
  disabled: boolean;
  busy: boolean;
  onSubmit: (password: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  const inputCls =
    "w-full h-10 rounded-xl border border-ink/12 bg-white/80 pl-9 pr-10 font-display text-[0.82rem] text-ink outline-none transition-all backdrop-blur-md placeholder:text-ink-3/80 focus:border-brand focus:ring-4 focus:ring-brand/80/15";

  return (
    <div>
      <p className="mb-1.5 font-display text-[0.62rem] font-bold uppercase tracking-[0.28em] text-ink-2">Reset password</p>
      {disabled ? (
        <p className="font-mono text-[0.7rem] text-ink-3">Super-admin credentials are managed via server secrets.</p>
      ) : (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!password || busy) return;
            onSubmit(password);
            setPassword("");
          }}
        >
          <div className="relative min-w-[13rem] flex-1">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={show ? "text" : "password"}
              minLength={8}
              required
              placeholder="New password (min 8 chars)"
              aria-label="New password"
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-ink-3 hover:text-ink"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-brand/25 bg-brand/8 px-4 font-display text-[0.72rem] font-bold text-brand-deep transition-all hover:bg-brand/15 disabled:opacity-40"
          >
            <Save className="h-3.5 w-3.5" /> Save
          </button>
        </form>
      )}
    </div>
  );
}

function StatusControls({
  isAdmin,
  disabled,
  busy,
  onSubmit,
}: {
  isAdmin: boolean;
  disabled: boolean;
  busy: boolean;
  onSubmit: (disabled: boolean) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 font-display text-[0.62rem] font-bold uppercase tracking-[0.28em] text-ink-2">Portal access</p>
      {isAdmin ? (
        <p className="font-mono text-[0.7rem] text-ink-3">Admins always have access through the admin panel.</p>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => onSubmit(!disabled)}
          className={cn(
            "inline-flex h-10 items-center gap-1.5 rounded-xl border px-4 font-display text-[0.72rem] font-bold transition-all disabled:opacity-40",
            disabled
              ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              : "border-rose-200 bg-rose-50/60 text-rose-600 hover:bg-rose-100"
          )}
        >
          {disabled ? (
            <>
              <Power className="h-3.5 w-3.5" /> Enable access
            </>
          ) : (
            <>
              <X className="h-3.5 w-3.5" /> Disable access
            </>
          )}
        </button>
      )}
    </div>
  );
}