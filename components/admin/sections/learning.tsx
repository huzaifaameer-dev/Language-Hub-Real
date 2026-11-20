"use client";

import { useEffect, useState } from "react";
import {
  CalendarPlus,
  GraduationCap,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserCog,
} from "lucide-react";

import {
  api,
  Badge,
  Card,
  Empty,
  ErrorNote,
  fmtDate,
  fmtDateTime,
  GhostButton,
  Input,
  Label,
  Loading,
  Modal,
  money,
  Pager,
  PrimaryButton,
  SectionHead,
  Select,
  Textarea,
  useApi,
} from "@/components/admin/ui";

/* ───────────────────────────────── users ───────────────────────────────── */

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  disabled: boolean;
  image: string | null;
  registrations: number;
  enrollments: number;
  lastLoginAt: string | null;
  createdAt: string;
}

interface UsersPayload {
  total: number;
  page: number;
  pages: number;
  users: AdminUser[];
}

const roleTone = (role: string) =>
  role === "ADMIN" ? "dark" : role === "TEACHER" ? "brand" : "neutral";

export function UsersSection() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("ALL");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");

  // Debounce the search box so typing does not fire a request per keystroke.
  useEffect(() => {
    const t = window.setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 320);
    return () => window.clearTimeout(t);
  }, [search]);

  const { data, loading, error, reload } = useApi<UsersPayload>(
    `/api/admin/users?search=${encodeURIComponent(query)}&role=${role}&page=${page}`
  );

  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [creating, setCreating] = useState(false);

  const remove = async (user: AdminUser) => {
    if (
      !window.confirm(
        `Delete ${user.name} (${user.email})? Their registrations, enrolments and certificates are removed too.`
      )
    )
      return;
    await api(`/api/admin/users/${user.id}`, { method: "DELETE" }).catch(() => null);
    reload();
  };

  return (
    <Card>
      <SectionHead
        title="Accounts"
        hint="Learners, teachers and administrators. Roles are enforced on every request."
        action={
          <PrimaryButton onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New account
          </PrimaryButton>
        }
      />

      <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
        <span className="flex flex-1 items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15 sm:max-w-xs">
          <Search className="h-3.5 w-3.5 text-ink-3" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email"
            className="w-full bg-transparent text-sm outline-none"
          />
        </span>
        <Select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          className="mt-0 w-auto"
        >
          <option value="ALL">All roles</option>
          <option value="USER">Learners</option>
          <option value="TEACHER">Teachers</option>
          <option value="ADMIN">Admins</option>
        </Select>
      </div>

      {loading && <Loading />}
      {error && <div className="p-5"><ErrorNote>{error}</ErrorNote></div>}
      {!loading && !error && data?.users.length === 0 && (
        <Empty title="No accounts match" hint="Try a different search or role filter." icon={UserCog} />
      )}

      {data && data.users.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-line bg-cream/60">
              <tr>
                <th className="px-4 py-2.5 text-left font-mono text-[0.56rem] font-bold uppercase tracking-[0.14em] text-ink-3">
                  Account
                </th>
                <th className="px-4 py-2.5 text-left font-mono text-[0.56rem] font-bold uppercase tracking-[0.14em] text-ink-3">
                  Role
                </th>
                <th className="px-4 py-2.5 text-left font-mono text-[0.56rem] font-bold uppercase tracking-[0.14em] text-ink-3">
                  Activity
                </th>
                <th className="px-4 py-2.5 text-left font-mono text-[0.56rem] font-bold uppercase tracking-[0.14em] text-ink-3">
                  Joined
                </th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.users.map((u) => (
                <tr key={u.id} className="hover:bg-cream/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-brand to-brand-fern text-[0.65rem] font-extrabold text-white">
                        {u.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          (u.name.split(" ").map((w) => w[0]).slice(0, 2).join("") || "LH").toUpperCase()
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 truncate text-sm font-bold text-ink">
                          {u.name}
                          {u.disabled && <Badge tone="red">Disabled</Badge>}
                        </p>
                        <p className="truncate text-xs text-ink-3">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={roleTone(u.role) as "dark" | "brand" | "neutral"}>{u.role}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-2">
                    {u.registrations} reg · {u.enrollments} enrol
                    <br />
                    <span className="text-ink-3">
                      last login {u.lastLoginAt ? fmtDate(u.lastLoginAt) : "never"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-2">{fmtDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <GhostButton onClick={() => setEditing(u)}>
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </GhostButton>
                      <GhostButton
                        onClick={() => remove(u)}
                        className="border-coral/30 text-coral-deep"
                        aria-label={`Delete ${u.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </GhostButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && <Pager page={data.page} pages={data.pages} onPage={setPage} />}

      <UserEditModal
        user={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          reload();
        }}
      />
      <UserCreateModal
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={() => {
          setCreating(false);
          reload();
        }}
      />
    </Card>
  );
}

function UserEditModal({
  user,
  onClose,
  onSaved,
}: {
  user: AdminUser | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [role, setRole] = useState(user?.role ?? "USER");
  const [disabled, setDisabled] = useState(user?.disabled ?? false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name,
          phone: phone.trim() || null,
          // The owner's ADMIN role is DB-only — never send it back.
          ...(user.role === "ADMIN" ? {} : { role }),
          disabled,
          ...(password ? { password } : {}),
        }),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal key={user.id} open title={`Edit ${user.name}`} onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <Label>Full name</Label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block">
            <Label>Role</Label>
            <Select
              value={user.role === "ADMIN" ? "ADMIN" : role}
              disabled={user.role === "ADMIN"}
              onChange={(e) => setRole(e.target.value)}
            >
              {user.role === "ADMIN" && <option value="ADMIN">Administrator</option>}
              <option value="USER">Learner</option>
              <option value="TEACHER">Teacher</option>
            </Select>
          </label>
          <label className="block">
            <Label>Phone / WhatsApp</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label className="block">
            <Label>Reset password (optional)</Label>
            <Input
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep"
            />
          </label>
        </div>
        <label className="flex items-start gap-2 rounded-xl border border-line bg-cream/60 px-3.5 py-3 text-sm text-ink-2">
          <input
            type="checkbox"
            checked={disabled}
            onChange={(e) => setDisabled(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#0a4e43]"
          />
          <span>
            <span className="font-bold text-ink">Disable this account</span>
            <br />
            Blocks sign-in immediately, even with a valid session.
          </span>
        </label>
        {error && <ErrorNote>{error}</ErrorNote>}
        <div className="flex justify-end gap-2">
          <GhostButton type="button" onClick={onClose}>
            Cancel
          </GhostButton>
          <PrimaryButton type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

function UserCreateModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({ name, email, phone: phone || undefined, password, role }),
      });
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setRole("USER");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} title="Create an account" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <Label>Full name</Label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block">
            <Label>Email</Label>
            <Input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block">
            <Label>Phone (optional)</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label className="block">
            <Label>Role</Label>
            <Select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="USER">Learner</option>
              <option value="TEACHER">Teacher</option>
            </Select>
            <p className="mt-1 text-[0.68rem] text-ink-3">
              Administrator access is database-only by design.
            </p>
          </label>
        </div>
        <label className="block">
          <Label>Temporary password</Label>
          <Input
            required
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
        </label>
        {error && <ErrorNote>{error}</ErrorNote>}
        <div className="flex justify-end gap-2">
          <GhostButton type="button" onClick={onClose}>
            Cancel
          </GhostButton>
          <PrimaryButton type="submit" disabled={busy}>
            {busy ? "Creating…" : "Create account"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

/* ──────────────────────────────── courses ──────────────────────────────── */

interface AdminCourse {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  duration: string;
  schedule: string;
  fee: number;
  currency: string;
  active: boolean;
  sortOrder: number;
  enrolled: number;
}

export function CoursesSection() {
  const { data, loading, error, reload } = useApi<{ courses: AdminCourse[] }>(
    "/api/admin/courses"
  );
  const [editing, setEditing] = useState<AdminCourse | null>(null);
  const [creating, setCreating] = useState(false);

  const rows = data?.courses ?? [];

  return (
    <Card>
      <SectionHead
        title="Programmes"
        hint="Fees and availability change live on the website and course pages."
        action={
          <PrimaryButton
            onClick={() => {
              setEditing(null);
              setCreating(true);
            }}
          >
            <Plus className="h-4 w-4" /> New programme
          </PrimaryButton>
        }
      />
      {loading && <Loading />}
      {error && <div className="p-5"><ErrorNote>{error}</ErrorNote></div>}
      {!loading && rows.length === 0 && (
        <Empty
          title="No programmes yet"
          hint="Add the first programme — it appears on /courses as soon as you save it."
        />
      )}
      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-line bg-cream/60">
              <tr>
                {["Programme", "Duration", "Fee", "Enrolled", "Status", ""].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-4 py-2.5 text-left font-mono text-[0.56rem] font-bold uppercase tracking-[0.14em] text-ink-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((c) => (
                <tr key={c.slug} className="hover:bg-cream/50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold text-ink">{c.name}</p>
                    <p className="max-w-sm truncate text-xs text-ink-3">{c.tagline}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-2">{c.duration || "—"}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-ink">
                    {money(Number(c.fee))}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-2">{c.enrolled}</td>
                  <td className="px-4 py-3">
                    <Badge tone={c.active ? "green" : "red"}>
                      {c.active ? "Live" : "Hidden"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <GhostButton onClick={() => setEditing(c)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </GhostButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CourseEditModal
        course={editing}
        creating={creating}
        onClose={() => {
          setEditing(null);
          setCreating(false);
        }}
        onSaved={() => {
          setEditing(null);
          setCreating(false);
          reload();
        }}
      />
    </Card>
  );
}

function CourseEditModal({
  course,
  creating,
  onClose,
  onSaved,
}: {
  course: AdminCourse | null;
  creating: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: course?.name ?? "",
    tagline: course?.tagline ?? "",
    duration: course?.duration ?? "",
    schedule: course?.schedule ?? "",
    fee: course ? Number(course.fee) : 0,
    active: course?.active ?? true,
    description: course?.description ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!course && !creating) return null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/admin/courses", {
        method: creating ? "POST" : "PATCH",
        body: JSON.stringify(creating ? form : { slug: course?.slug, ...form }),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the programme.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      key={creating ? "new" : course?.slug}
      open
      title={creating ? "New programme" : course?.name ?? "Programme"}
      onClose={onClose}
      wide
    >
      <form onSubmit={save} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <Label>Name</Label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className="block">
            <Label>Duration</Label>
            <Input
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              placeholder="12 weeks"
            />
          </label>
        </div>
        <label className="block">
          <Label>Tagline</Label>
          <Input
            value={form.tagline}
            onChange={(e) => setForm({ ...form, tagline: e.target.value })}
          />
        </label>
        <label className="block">
          <Label>Description</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <Label>Monthly fee (PKR)</Label>
            <Input
              type="number"
              min={0}
              value={form.fee}
              onChange={(e) => setForm({ ...form, fee: Number(e.target.value) })}
            />
          </label>
          <label className="block">
            <Label>Schedule</Label>
            <Input
              value={form.schedule}
              onChange={(e) => setForm({ ...form, schedule: e.target.value })}
              placeholder="Mon–Thu · 6–8 pm"
            />
          </label>
          <label className="flex items-end gap-2 pb-2.5 text-sm font-medium text-ink-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="h-4 w-4 accent-[#0a4e43]"
            />
            Visible on the site
          </label>
        </div>
        {error && <ErrorNote>{error}</ErrorNote>}
        <div className="flex justify-end gap-2">
          <GhostButton type="button" onClick={onClose}>
            Cancel
          </GhostButton>
          <PrimaryButton type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save programme"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

/* ──────────────────────────────── classes ──────────────────────────────── */

interface LiveClass {
  id: string;
  title: string;
  course: string;
  batch: string;
  instructor: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingLink: string;
  platform: string;
}

/** Single class row. */
function ClassRow({ c, onRemove }: { c: LiveClass; onRemove: (id: string) => void }) {
  return (
    <li className="flex flex-wrap items-center gap-3 px-5 py-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cream text-brand-deep">
        <GraduationCap className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink">
          {c.title}
          <Badge tone="brand">Live</Badge>
        </p>
        <p className="mt-0.5 text-xs text-ink-3">
          {c.course || "All programmes"} · {fmtDateTime(c.scheduledAt)} ·{" "}
          {c.durationMinutes} min · {c.platform}
        </p>
      </div>
      <GhostButton
        onClick={() => onRemove(c.id)}
        className="border-coral/30 text-coral-deep"
        aria-label={`Delete ${c.title}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </GhostButton>
    </li>
  );
}

export function ClassesSection() {
  const classes = useApi<{ classes: LiveClass[] }>("/api/admin/classes");
  const courses = useApi<{ courses: AdminCourse[] }>("/api/admin/courses");
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    title: "",
    courseSlug: "",
    batch: "",
    instructor: "",
    scheduledAt: "",
    durationMinutes: 60,
    meetingLink: "",
    platform: "Zoom",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/admin/classes", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          courseSlug: form.courseSlug || courses.data?.courses[0]?.slug || "",
          durationMinutes: Number(form.durationMinutes),
        }),
      });
      setOpen(false);
      setForm({
        title: "",
        courseSlug: "",
        batch: "",
        instructor: "",
        scheduledAt: "",
        durationMinutes: 60,
        meetingLink: "",
        platform: "Zoom",
      });
      classes.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not schedule the class.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this class from every learner's schedule?")) return;
    await api(`/api/admin/classes/${id}`, { method: "DELETE" }).catch(() => null);
    classes.reload();
  };

  const rows = classes.data?.classes ?? [];

  return (
    <Card>
      <SectionHead
        title="Live classes"
        hint="Scheduled sessions appear instantly on every enrolled learner's dashboard."
        action={
          <PrimaryButton onClick={() => setOpen(true)}>
            <CalendarPlus className="h-4 w-4" /> Schedule class
          </PrimaryButton>
        }
      />
      {classes.loading && <Loading />}
      {classes.error && <div className="p-5"><ErrorNote>{classes.error}</ErrorNote></div>}
      {!classes.loading && rows.length === 0 && (
        <Empty
          title="No classes scheduled"
          hint="Add the first session and it will show up on learner dashboards."
          icon={GraduationCap}
        />
      )}
      {rows.length > 0 && (
        <ul className="divide-y divide-line">
          {rows.map((c) => (
            <ClassRow key={c.id} c={c} onRemove={remove} />
          ))}
        </ul>
      )}

      <Modal open={open} title="Schedule a live class" onClose={() => setOpen(false)} wide>
        <form onSubmit={create} className="space-y-3">
          <label className="block">
            <Label>Title</Label>
            <Input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="IELTS Writing Task 2 — argument structure"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <Label>Programme</Label>
              <Select
                value={form.courseSlug}
                onChange={(e) => setForm({ ...form, courseSlug: e.target.value })}
              >
                <option value="">All programmes</option>
                {(courses.data?.courses ?? []).map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block">
              <Label>Batch</Label>
              <Input
                value={form.batch}
                onChange={(e) => setForm({ ...form, batch: e.target.value })}
                placeholder="Evening A"
              />
            </label>
            <label className="block">
              <Label>Date & time</Label>
              <Input
                required
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
              />
            </label>
            <label className="block">
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                min={15}
                max={480}
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
              />
            </label>
            <label className="block">
              <Label>Faculty</Label>
              <Input
                value={form.instructor}
                onChange={(e) => setForm({ ...form, instructor: e.target.value })}
              />
            </label>
            <label className="block">
              <Label>Platform</Label>
              <Input
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
              />
            </label>
          </div>
          <label className="block">
            <Label>Meeting link</Label>
            <Input
              type="url"
              value={form.meetingLink}
              onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
              placeholder="https://zoom.us/j/…"
            />
          </label>
          {error && <ErrorNote>{error}</ErrorNote>}
          <div className="flex justify-end gap-2">
            <GhostButton type="button" onClick={() => setOpen(false)}>
              Cancel
            </GhostButton>
            <PrimaryButton type="submit" disabled={busy}>
              {busy ? "Scheduling…" : "Schedule class"}
            </PrimaryButton>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
