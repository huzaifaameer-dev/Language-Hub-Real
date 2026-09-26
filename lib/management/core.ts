import { ObjectId } from "mongodb";

import { auth } from "@/auth";
import {
  getDb,
  getGroupsCollection,
  getSubmissionsCollection,
  getMessagesCollection,
  getUsersCollection,
  logAdminAction,
  type MgAssignmentDoc,
  type MessageDoc,
  type MessageDelivery,
} from "@/lib/db";
import { notify } from "@/lib/notifications";
import { sendWaText, waConfigured } from "@/lib/whatsapp";
import { saveDataUriUpload } from "@/lib/registration-storage";

/* ────────────────────────────────────────────────────────────────────────── */
/*  Auth / role access                                                        */
/* ────────────────────────────────────────────────────────────────────────── */

export type MgRole = "ADMIN" | "TEACHER" | "STUDENT";

export interface MgUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  image?: string | null;
  role: MgRole;
}

/** Resolve the signed-in user into a management actor. Returns null when not
 *  signed in or the account is missing. */
export async function currentMgUser(): Promise<MgUser | null> {
  const session = await auth();
  if (!session?.user?.id || !ObjectId.isValid(session.user.id)) return null;
  const users = await getDb().then((db) => db.collection("users"));
  const user = await users.findOne({ _id: new ObjectId(session.user.id) });
  if (!user) return null;
  const role = (user.role as string) === "ADMIN" ? "ADMIN" : (user.role as string) === "TEACHER" ? "TEACHER" : "STUDENT";
  return {
    id: String(user._id),
    name: String(user.name ?? "User"),
    email: String(user.email ?? ""),
    phone: (user.phone as string) ?? (user.whatsapp as string) ?? null,
    image: (user.image as string) ?? null,
    role,
  };
}

export async function requireMgRole(roles: MgRole[]): Promise<MgUser> {
  const user = await currentMgUser();
  if (!user) {
    throw new MgHttpError(401, "Sign in required.");
  }
  if (!roles.includes(user.role)) {
    throw new MgHttpError(403, "You don't have permission to perform this action.");
  }
  return user;
}

export class MgHttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Group ids a teacher manages (groups where they are an assigned teacher). */
export async function teacherGroupIds(userId: string): Promise<string[]> {
  const groups = await getGroupsCollection();
  const docs = await groups
    .find({ teacherIds: userId, status: "ACTIVE" }, { projection: { _id: 1 } })
    .toArray();
  return docs.map((d) => String(d._id));
}

/** Group ids a student belongs to. */
export async function studentGroupIds(userId: string): Promise<string[]> {
  const groups = await getGroupsCollection();
  const docs = await groups
    .find({ studentIds: userId, status: "ACTIVE" }, { projection: { _id: 1 } })
    .toArray();
  return docs.map((d) => String(d._id));
}

/** Union-scope filter for assignments/materials a role can see. */
export async function scopedGroupIds(user: MgUser): Promise<string[] | null> {
  if (user.role === "ADMIN") return null; // all
  if (user.role === "TEACHER") return teacherGroupIds(user.id);
  return studentGroupIds(user.id);
}

/** true when a user can act on a group (admin: all; teacher: their groups; student: membership). */
export async function canAccessGroup(user: MgUser, groupId: string): Promise<boolean> {
  if (user.role === "ADMIN") return true;
  const allowed = await scopedGroupIds(user);
  return allowed ? allowed.includes(groupId) : false;
}

/** Audit helper (shared log with the admin console). */
export function logMg(actor: MgUser, action: string, targetType: string, label?: string, detail?: string) {
  void logAdminAction({
    actor: `${actor.email}${actor.role === "ADMIN" ? "" : ` (${actor.role})`}`,
    action,
    targetType,
    targetLabel: label,
    detail,
  }).catch(() => {});
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Files                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

export interface MgFile {
  name: string;
  rel: string;
  mime: string;
}

/** Save an uploaded data-URI under private/management/<folder>/ and return the
 *  safe reference stored in documents (served via /api/management/media). */
export async function saveManagementFile(
  folder: string,
  field: string,
  name: string,
  dataUri: string
): Promise<MgFile> {
  const saved = await saveDataUriUpload(`mg/${folder}`, field, dataUri);
  return { name, rel: saved.ref, mime: saved.mime };
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  WhatsApp service (mock mode until the official API is configured)         */
/* ────────────────────────────────────────────────────────────────────────── */

/** Fill {{variable}} placeholders safely (server-side only). */
export function fillTemplate(body: string, vars: Record<string, string>): string {
  let out = body;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, "g"), v);
  }
  return out;
}

const DIGITS = (v: string) => (v || "").replace(/[^\d]/g, "");

async function studentRecipients(studentIds: string[]) {
  if (studentIds.length === 0) return [] as Array<{ studentId: string; name: string; phone: string; email?: string }>;
  const users = await getUsersCollection();
  const ids = studentIds.map((id) => new ObjectId(id));
  const docs = await users.find({ _id: { $in: ids } }, { projection: { name: 1, phone: 1, whatsapp: 1, email: 1 } }).toArray();
  return docs.map((d) => ({
    studentId: String(d._id),
    name: String(d.name ?? "Student"),
    phone: DIGITS(String(d.phone ?? d.whatsapp ?? "")),
    email: String(d.email ?? ""),
  }));
}

async function studentsOfGroups(groupIds: string[]): Promise<Array<{ studentId: string; name: string; phone: string; email?: string }>> {
  const groups = await getGroupsCollection();
  const docs = await groups.find({ _id: { $in: groupIds.map((g) => new ObjectId(g)) } }).toArray();
  const ids = Array.from(new Set(docs.flatMap((d) => d.studentIds ?? [])));
  return studentRecipients(ids);
}

/** Deliver a single WhatsApp text to one recipient — real API when configured,
 *  otherwise a simulated "mock" success (persisted so the whole flow is safe
 *  to test end-to-end). */
async function deliverOne(phone: string, name: string, text: string): Promise<MessageDelivery> {
  if (!phone) return { phone, name, status: "FAILED", error: "No WhatsApp number on file." };
  if (waConfigured()) {
    const res = await sendWaText({ to: phone, text });
    return res.ok
      ? { phone, name, status: "SENT" }
      : { phone, name, status: "FAILED", error: res.error ?? "Send failed." };
  }
  // Mock mode: simulate success for anything with a plausible number.
  return { phone, name, status: "SENT" };
}

/** Deliver a message document: creates deliveries for every recipient and
 *  marks the message SENT/FAILED. Safe to call from the scheduler or immediates. */
export async function deliverMessage(message: MessageDoc): Promise<MessageDoc> {
  const messages = await getMessagesCollection();
  if (!message._id) return message;

  const recipients =
    message.recipientType === "student"
      ? await studentRecipients(message.studentIds)
      : await studentsOfGroups(message.groupIds);

  const deliveries: MessageDelivery[] = [];
  let failed = 0;
  for (const r of recipients) {
    const d = await deliverOne(r.phone, r.name, message.text);
    deliveries.push(d);
    if (d.status === "FAILED") failed += 1;
  }

  const status = deliveries.length === 0 ? "SENT" : failed > 0 ? (failed === deliveries.length ? "FAILED" : "SENT") : "SENT";
  await messages.updateOne(
    { _id: message._id },
    {
      $set: {
        status,
        deliveries,
        sentAt: new Date(),
        failedReason: failed === deliveries.length ? "All recipients failed." : undefined,
        mock: !waConfigured(),
        updatedAt: new Date(),
      },
      $unset: { scheduledFor: message.status === "SCHEDULED" ? "" : undefined } as never,
    }
  );
  return { ...message, status, deliveries, mock: !waConfigured(), sentAt: new Date() };
}

/** Compose + create a message document, delivering now or scheduling later. */
export async function dispatchMessage(input: {
  kind: MessageDoc["kind"];
  sender: MgUser;
  recipientType: "student" | "group" | "groups";
  studentIds?: string[];
  groupIds?: string[];
  text: string;
  scheduleAt?: Date | null;
  refKey?: string | null;
  relatedAssignmentId?: string | null;
}): Promise<MessageDoc> {
  const messages = await getMessagesCollection();
  const groups = await getGroupsCollection();
  const groupIds = input.groupIds ?? [];
  const gDocs = groupIds.length
    ? await groups.find({ _id: { $in: groupIds.map((g) => new ObjectId(g)) } }, { projection: { name: 1 } }).toArray()
    : [];
  const groupNames = gDocs.map((d) => String(d.name ?? "Group"));

  const doc: Omit<MessageDoc, "_id"> = {
    kind: input.kind,
    senderId: input.sender.id,
    senderName: input.sender.name,
    recipientType: input.recipientType,
    studentIds: input.studentIds ?? [],
    groupIds: groupIds,
    groupNames,
    text: input.text,
    templateKey: null,
    variables: null,
    status: input.scheduleAt ? "SCHEDULED" : "PROCESSING",
    scheduledFor: input.scheduleAt ?? null,
    mock: !waConfigured(),
    relatedAssignmentId: input.relatedAssignmentId ?? null,
    deliveries: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...(input.refKey ? { refKey: input.refKey } : {}),
  };

  const result = await messages.insertOne(doc);
  const withId = { ...doc, _id: result.insertedId };

  if (input.scheduleAt) return withId;
  return deliverMessage(withId);
}

/** Notify every student in a group through the in-app notification bell. */
export async function notifyGroup(groupIds: string[], title: string, message: string, href?: string) {
  const students = await studentsOfGroups(groupIds);
  await Promise.all(
    students.map((s) => notify(s.studentId, { kind: "management", title, message, href: href ?? "/my-learning" }).catch(() => {}))
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Scheduler — published schedules, sends scheduled messages, fires reminders */
/* ────────────────────────────────────────────────────────────────────────── */

/** Publish anything due (scheduled assignments/messages) and fire reminders. */
export async function runManagementTick(): Promise<{
  published: number;
  messages: number;
  reminders: number;
  closed: number;
}> {
  const db = await getDb();
  const now = new Date();
  let published = 0;
  let messagesSent = 0;
  let reminders = 0;
  const closed = 0;

  /* 1. Scheduled assignments → publish + notify. */
  const dueAssignments = await db
    .collection<MgAssignmentDoc>("assignments")
    .find({ status: "SCHEDULED", scheduledFor: { $lte: now } })
    .limit(50)
    .toArray();
  for (const a of dueAssignments) {
    await db.collection("assignments").updateOne(
      { _id: a._id },
      { $set: { status: "PUBLISHED", publishedAt: now, updatedAt: now } }
    );
    published += 1;
    if (a.notifyOnPublish) {
      await notifyGroup(a.groupIds, `New ${a.title}`, assignmentText(a), "/my-learning");
      const teacher = { id: a.teacherId, name: a.teacherName, email: "", role: "TEACHER" as MgRole };
      try {
        await dispatchMessage({
          kind: "assignment",
          sender: teacher,
          recipientType: "group",
          groupIds: a.groupIds,
          text: assignmentText(a),
          relatedAssignmentId: String(a._id),
        });
        messagesSent += 1;
      } catch {
        // never let one assignment block the tick
      }
    }
  }

  /* 2. Scheduled messages due → deliver. */
  const dueMessages = await db
    .collection<MessageDoc>("messages")
    .find({ status: "SCHEDULED", scheduledFor: { $lte: now } })
    .limit(100)
    .toArray();
  for (const m of dueMessages) {
    await deliverMessage(m);
    messagesSent += 1;
  }

  /* 3. Auto-close assignments past deadline. */
  await db
    .collection("assignments")
    .updateMany(
      { status: { $in: ["PUBLISHED", "OPEN"] }, deadline: { $lte: now } },
      { $set: { status: "CLOSED", closedAt: now, updatedAt: now } }
    );

  /* 4. Reminders for non-submitters (deduped per assignment+student). */
  const reminded = new Set<string>();
  const reminderQueue = await db
    .collection<MgAssignmentDoc>("assignments")
    .find({
      status: { $in: ["PUBLISHED", "OPEN"] },
      reminderEnabled: true,
      reminderAt: { $lte: now },
      deadline: { $gt: now },
    })
    .limit(100)
    .toArray();
  for (const a of reminderQueue) {
    const students = await studentsOfGroups(a.groupIds);
    for (const s of students) {
      const key = `remind:${String(a._id)}:${s.studentId}`;
      if (reminded.has(key)) continue;
      const existing = await db
        .collection("messages")
        .findOne({ refKey: key }, { projection: { _id: 1 } });
      if (existing) {
        reminded.add(key);
        continue;
      }
      const submitted = await db.collection("submissions").countDocuments({ assignmentId: String(a._id), studentId: s.studentId });
      if (submitted > 0) {
        reminded.add(key);
        continue;
      }
      const teacher = { id: a.teacherId, name: a.teacherName, email: "", role: "TEACHER" as MgRole };
      try {
        await dispatchMessage({
          kind: "reminder",
          sender: teacher,
          recipientType: "student",
          studentIds: [s.studentId],
          text: `Salam ${s.name.split(" ")[0]} — just a reminder that "${a.title}" is due ${deadlineLabel(a.deadline)}. Please submit it through your dashboard: ${appOrigin()}/my-learning.`,
          refKey: key,
          relatedAssignmentId: String(a._id),
        });
        reminders += 1;
        reminded.add(key);
        void notify(s.studentId, {
          kind: "assignment-reminder",
          title: `Reminder: ${a.title}`,
          message: `Don't forget to submit "${a.title}" — it's due ${deadlineLabel(a.deadline)}.`,
          href: "/my-learning",
        }).catch(() => {});
      } catch {
        // skipped — try again next tick
      }
    }
  }

  return { published, messages: messagesSent, reminders, closed };
}

function assignmentText(a: MgAssignmentDoc): string {
  return `Salam! 📚 New assignment: "${a.title}". ${a.instructions ? `Instructions: ${a.instructions.slice(0, 180)}${a.instructions.length > 180 ? "…" : " "}` : ""}Deadline: ${deadlineLabel(a.deadline)}. Submit it here: ${appOrigin()}/my-learning`;
}

function deadlineLabel(d: Date | null | undefined): string {
  if (!d) return "soon";
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function appOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    "http://localhost:3000"
  );
}