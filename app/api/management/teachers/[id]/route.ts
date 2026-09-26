import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { requireMgRole, logMg } from "@/lib/management/core";
import { getTeachersCollection, getUsersCollection, getGroupsCollection } from "@/lib/db";

export const dynamic = "force-dynamic";

const PatchSchema = z.object({
  active: z.boolean().optional(),
  courseIds: z.array(z.string().max(80)).max(50).optional(),
});

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await requireMgRole(["ADMIN"]);
  if (!ObjectId.isValid(id)) return NextResponse.json({ message: "Not found." }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Validation failed." }, { status: 400 });

  const teachers = await getTeachersCollection();
  const t = await teachers.findOne({ _id: new ObjectId(id) });
  if (!t) return NextResponse.json({ message: "Not found." }, { status: 404 });

  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.active !== undefined) update.active = parsed.data.active;
  if (parsed.data.courseIds !== undefined) update.courseIds = parsed.data.courseIds;
  await teachers.updateOne({ _id: t._id }, { $set: update });

  // Deactivate also withholds teacher portal access.
  if (parsed.data.active === false) {
    await getUsersCollection().then((u) =>
      u.updateOne({ _id: new ObjectId(t.userId) }, { $set: { role: "USER", updatedAt: new Date() } })
    );
    const groups = await getGroupsCollection();
    await groups.updateMany({ teacherIds: t.userId }, { $pull: { teacherIds: t.userId }, $set: { updatedAt: new Date() } });
  }

  logMg(user, "UPDATE", "teacher", t.email);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await requireMgRole(["ADMIN"]);
  if (!ObjectId.isValid(id)) return NextResponse.json({ message: "Not found." }, { status: 404 });

  const teachers = await getTeachersCollection();
  const t = await teachers.findOne({ _id: new ObjectId(id) });
  if (!t) return NextResponse.json({ message: "Not found." }, { status: 404 });

  await teachers.deleteOne({ _id: t._id });
  await getUsersCollection().then((u) =>
    u.updateOne({ _id: new ObjectId(t.userId) }, { $set: { role: "USER", updatedAt: new Date() } })
  );
  const groups = await getGroupsCollection();
  await groups.updateMany({ teacherIds: t.userId }, { $pull: { teacherIds: t.userId }, $set: { updatedAt: new Date() } });

  logMg(user, "DELETE", "teacher", t.email);
  return NextResponse.json({ ok: true });
}