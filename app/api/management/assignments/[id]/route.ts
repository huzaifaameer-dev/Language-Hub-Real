import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { requireMgRole, canAccessGroup, logMg, dispatchMessage, notifyGroup, scopedGroupIds } from "@/lib/management/core";
import { getMgAssignmentsCollection, getGroupsCollection } from "@/lib/db";
import { MgAssignmentSchema } from "@/lib/validate";

export const dynamic = "force-dynamic";

const ActionSchema = z.object({
  action: z.enum(["publish", "schedule", "close", "reopen", "delete"]).optional(),
  scheduledFor: z.string().datetime({ offset: true }).optional().nullable(),
});

async function loadOwned(userId: string, id: string) {
  const col = await getMgAssignmentsCollection();
  if (!ObjectId.isValid(id)) return null;
  return col.findOne({ _id: new ObjectId(id), teacherId: userId });
}

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await requireMgRole(["ADMIN", "TEACHER", "STUDENT"]);
  if (!ObjectId.isValid(id)) return NextResponse.json({ message: "Not found." }, { status: 404 });

  const col = await getMgAssignmentsCollection();
  const doc = await col.findOne({ _id: new ObjectId(id) });
  if (!doc) return NextResponse.json({ message: "Not found." }, { status: 404 });

  const scope = await scopedGroupIds(user);
  if (scope && !doc.groupIds.some((g) => scope.includes(g))) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  return NextResponse.json({
    id: String(doc._id),
    groupIds: doc.groupIds,
    teacherId: doc.teacherId,
    teacherName: doc.teacherName,
    title: doc.title,
    kind: doc.kind ?? "assignment",
    description: doc.description,
    instructions: doc.instructions,
    attachments: doc.attachments ?? [],
    links: doc.links ?? [],
    materialIds: doc.materialIds ?? [],
    deadline: doc.deadline?.toISOString() ?? null,
    reminderEnabled: doc.reminderEnabled,
    reminderAt: doc.reminderAt?.toISOString() ?? null,
    priority: doc.priority,
    status: doc.status,
    scheduledFor: doc.scheduledFor?.toISOString() ?? null,
    notifyOnPublish: doc.notifyOnPublish,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  });
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await requireMgRole(["ADMIN", "TEACHER"]);
  if (!ObjectId.isValid(id)) return NextResponse.json({ message: "Not found." }, { status: 404 });
  const doc = await (await getMgAssignmentsCollection()).findOne({ _id: new ObjectId(id) }).catch(() => null);
  if (!doc) return NextResponse.json({ message: "Not found." }, { status: 404 });
  // Teachers may act on their own assignments within their groups.
  if (user.role === "TEACHER" && doc.teacherId !== user.id) {
    const scope = await scopedGroupIds(user);
    if (!scope || !doc.groupIds.some((g) => scope.includes(g))) {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }
  const body = (raw ?? {}) as Record<string, unknown>;
  const action = ActionSchema.safeParse(body);

  const col = await getMgAssignmentsCollection();
  const now = new Date();

  if (action.success && action.data.action) {
    if (action.data.action === "publish") {
      await col.updateOne({ _id: doc._id }, { $set: { status: "PUBLISHED", publishedAt: now, scheduledFor: null, updatedAt: now } });
      const groups = await getGroupsCollection();
      const gNames = (await groups.find({ _id: { $in: doc.groupIds.map((g) => new ObjectId(g)) } }, { projection: { name: 1 } }).toArray()).map((g) => String(g.name));
      const text = `Salam! 📚 New assignment: "${doc.title}". ${doc.instructions ? `Instructions: ${doc.instructions.slice(0, 180)}… ` : ""}Deadline: ${
        doc.deadline ? doc.deadline.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "soon"
      }. Submit: ${base()}/my-learning`;
      await notifyGroup(doc.groupIds, `New assignment: ${doc.title}`, text, "/my-learning");
      void dispatchMessage({ kind: "assignment", sender: user, recipientType: "group", groupIds: doc.groupIds, text, relatedAssignmentId: String(doc._id) }).catch(() => {});
      logMg(user, "PUBLISH", "assignment", doc.title);
      return NextResponse.json({ ok: true });
    }
    if (action.data.action === "schedule") {
      const when = action.data.scheduledFor ? new Date(action.data.scheduledFor) : null;
      await col.updateOne({ _id: doc._id }, { $set: { status: "SCHEDULED", scheduledFor: when, updatedAt: now } });
      logMg(user, "SCHEDULE", "assignment", doc.title, when?.toISOString() ?? undefined);
      return NextResponse.json({ ok: true });
    }
    if (action.data.action === "close") {
      await col.updateOne({ _id: doc._id }, { $set: { status: "CLOSED", closedAt: now, updatedAt: now } });
      logMg(user, "CLOSE", "assignment", doc.title);
      return NextResponse.json({ ok: true });
    }
    if (action.data.action === "reopen") {
      await col.updateOne({ _id: doc._id }, { $set: { status: "PUBLISHED", updatedAt: now } });
      logMg(user, "REOPEN", "assignment", doc.title);
      return NextResponse.json({ ok: true });
    }
    if (action.data.action === "delete") {
      await col.deleteOne({ _id: doc._id });
      logMg(user, "DELETE", "assignment", doc.title);
      return NextResponse.json({ ok: true });
    }
  }

  // Partial update (title, instructions, deadline, reminder…) without changing status.
  const parsed = MgAssignmentSchema.partial().safeParse(body);
  if (parsed.success && Object.keys(parsed.data).length > 0) {
    const update: Record<string, unknown> = { updatedAt: now };
    const d = parsed.data;
    if (d.title !== undefined) update.title = d.title.trim();
    if (d.kind !== undefined) update.kind = d.kind;
    if (d.description !== undefined) update.description = d.description;
    if (d.instructions !== undefined) update.instructions = d.instructions;
    if (d.links !== undefined) update.links = d.links;
    if (d.materialIds !== undefined) update.materialIds = d.materialIds;
    if (d.deadline !== undefined) update.deadline = d.deadline ? new Date(d.deadline) : null;
    if (d.reminderEnabled !== undefined) update.reminderEnabled = d.reminderEnabled;
    if (d.reminderAt !== undefined) update.reminderAt = d.reminderAt ? new Date(d.reminderAt) : d.reminderEnabled ? new Date((d.deadline ? new Date(d.deadline).getTime() : Date.now()) - 2 * 3600000) : null;
    if (d.priority !== undefined) update.priority = d.priority;
    if (d.groupIds !== undefined) {
      const scope = await scopedGroupIds(user);
      if (scope && !d.groupIds.every((g) => scope.includes(g))) {
        return NextResponse.json({ message: "You can only use your assigned groups." }, { status: 403 });
      }
      update.groupIds = d.groupIds;
    }
    await col.updateOne({ _id: doc._id }, { $set: update });
    logMg(user, "UPDATE", "assignment", doc.title);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ message: "Nothing to update." }, { status: 400 });
}

function base(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}