import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { requireMgRole, canAccessGroup, logMg } from "@/lib/management/core";
import { getUsersCollection, getGroupsCollection } from "@/lib/db";

export const dynamic = "force-dynamic";

const PatchSchema = z.object({
  name: z.string().min(2).max(80).trim().optional(),
  phone: z.string().max(24).trim().optional().nullable(),
  notes: z.string().max(600).trim().optional().nullable(),
  active: z.boolean().optional(),
  groupIds: z.array(z.string()).max(100).optional(),
  groupsAction: z.enum(["set", "add", "remove"]).optional(),
});

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await requireMgRole(["ADMIN", "TEACHER"]);
  if (!ObjectId.isValid(id)) return NextResponse.json({ message: "Not found." }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Validation failed." }, { status: 400 });
  }

  const users = await getUsersCollection();
  const userDoc = await users.findOne({ _id: new ObjectId(id) });
  if (!userDoc) return NextResponse.json({ message: "Not found." }, { status: 404 });

  const groups = await getGroupsCollection();
  // Teacher scope guard.
  if (user.role === "TEACHER") {
    const mine = (await groups.find({ teacherIds: user.id, status: "ACTIVE" }, { projection: { studentIds: 1 } }).toArray())
      .flatMap((g) => g.studentIds ?? []);
    if (!mine.includes(id)) return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.name !== undefined) update.name = parsed.data.name.trim();
  if (parsed.data.phone !== undefined) update.phone = parsed.data.phone?.trim() || null;
  if (parsed.data.notes !== undefined) update.notes = parsed.data.notes ?? null;
  if (parsed.data.active !== undefined) update.active = parsed.data.active;

  if (parsed.data.groupIds && parsed.data.groupsAction) {
    const target = parsed.data.groupIds.map((g) => new ObjectId(g));
    if (parsed.data.groupsAction === "set") {
      await groups.updateMany({ studentIds: id, _id: { $nin: target } }, { $pull: { studentIds: id }, $set: { updatedAt: new Date() } });
      await groups.updateMany({ _id: { $in: target }, studentIds: { $ne: id } }, { $addToSet: { studentIds: id }, $set: { updatedAt: new Date() } });
    } else if (parsed.data.groupsAction === "add") {
      await groups.updateMany({ _id: { $in: target }, studentIds: { $ne: id } }, { $addToSet: { studentIds: id }, $set: { updatedAt: new Date() } });
    } else {
      await groups.updateMany({ _id: { $in: target } }, { $pull: { studentIds: id }, $set: { updatedAt: new Date() } });
    }
  }

  await users.updateOne({ _id: new ObjectId(id) }, { $set: update });
  logMg(user, "UPDATE", "student", String(userDoc.email));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await requireMgRole(["ADMIN"]);
  if (!ObjectId.isValid(id)) return NextResponse.json({ message: "Not found." }, { status: 404 });

  // Archive = deactivate + remove from all groups (keeps assignment history).
  const groups = await getGroupsCollection();
  const users = await getUsersCollection();
  await groups.updateMany({ studentIds: id }, { $pull: { studentIds: id }, $set: { updatedAt: new Date() } });
  await users.updateOne({ _id: new ObjectId(id) }, { $set: { active: false, updatedAt: new Date() } });
  logMg(user, "DELETE", "student", String(user.email));
  return NextResponse.json({ ok: true });
}