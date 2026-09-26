import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { requireMgRole, canAccessGroup, logMg } from "@/lib/management/core";
import { getGroupsCollection, getUsersCollection } from "@/lib/db";
import { MgGroupSchema } from "@/lib/validate";

export const dynamic = "force-dynamic";

const ActionSchema = z.object({
  action: z.enum(["addStudents", "removeStudents", "assignTeacher", "archive", "restore"]),
  studentIds: z.array(z.string()).max(500).optional().default([]),
  teacherId: z.string().optional().nullable(),
});

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await requireMgRole(["ADMIN", "TEACHER", "STUDENT"]);
  if (!ObjectId.isValid(id)) return NextResponse.json({ message: "Not found." }, { status: 404 });
  if (!(await canAccessGroup(user, id))) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const groups = await getGroupsCollection();
  const doc = await groups.findOne({ _id: new ObjectId(id) });
  if (!doc) return NextResponse.json({ message: "Not found." }, { status: 404 });

  const users = await getUsersCollection();
  const ids = [...new Set([...(doc.studentIds ?? []), ...(doc.teacherIds ?? [])])].map((x) => new ObjectId(x));
  const memdocs = await users.find({ _id: { $in: ids } }, { projection: { name: 1, email: 1, phone: 1, role: 1, image: 1 } }).toArray();
  const members = memdocs.map((m) => ({
    id: String(m._id),
    name: String(m.name ?? "User"),
    email: String(m.email ?? ""),
    phone: String(m.phone ?? m.whatsapp ?? ""),
    role: String(m.role ?? "USER"),
    image: m.image ?? null,
    isTeacher: (doc.teacherIds ?? []).includes(String(m._id)),
    isStudent: (doc.studentIds ?? []).includes(String(m._id)),
  }));

  return NextResponse.json({
    id: String(doc._id),
    name: doc.name,
    courseId: doc.courseId ?? null,
    courseName: doc.courseName ?? null,
    schedule: doc.schedule ?? null,
    notes: doc.notes ?? null,
    status: doc.status,
    teacherIds: doc.teacherIds,
    studentIds: doc.studentIds,
    members,
    createdAt: doc.createdAt.toISOString(),
  });
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await requireMgRole(["ADMIN", "TEACHER"]);
  if (!ObjectId.isValid(id)) return NextResponse.json({ message: "Not found." }, { status: 404 });
  if (!(await canAccessGroup(user, id))) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  // Either a partial group update or an action (both handled here).
  const actionParsed = ActionSchema.safeParse(body);
  const groupParsed = MgGroupSchema.partial().safeParse(body);

  const col = await getGroupsCollection();

  if (actionParsed.success && actionParsed.data.action) {
    const action = actionParsed.data.action;
    const cur = await col.findOne({ _id: new ObjectId(id) });
    if (!cur) return NextResponse.json({ message: "Not found." }, { status: 404 });

    const studentIds = actionParsed.data.studentIds ?? [];
    if (action === "addStudents") {
      const merged = Array.from(new Set([...(cur.studentIds ?? []), ...studentIds]));
      await col.updateOne({ _id: cur._id }, { $set: { studentIds: merged, updatedAt: new Date() } });
      logMg(user, "ADD_STUDENTS", "group", cur.name, `${studentIds.length} students`);
    } else if (action === "removeStudents") {
      const removed = new Set(studentIds);
      const merged = (cur.studentIds ?? []).filter((s) => !removed.has(s));
      await col.updateOne({ _id: cur._id }, { $set: { studentIds: merged, updatedAt: new Date() } });
      logMg(user, "REMOVE_STUDENTS", "group", cur.name, `${studentIds.length} students`);
    } else if (action === "assignTeacher") {
      const tid = actionParsed.data.teacherId;
      let list = cur.teacherIds ?? [];
      if (tid && !list.includes(tid)) list = [...list, tid];
      await col.updateOne({ _id: cur._id }, { $set: { teacherIds: list, updatedAt: new Date() } });
      logMg(user, "ASSIGN_TEACHER", "group", cur.name, tid ?? "none");
    } else if (action === "archive") {
      await col.updateOne({ _id: cur._id }, { $set: { status: "ARCHIVED", updatedAt: new Date() } });
      logMg(user, "ARCHIVE", "group", cur.name);
    } else if (action === "restore") {
      await col.updateOne({ _id: cur._id }, { $set: { status: "ACTIVE", updatedAt: new Date() } });
      logMg(user, "RESTORE", "group", cur.name);
    }
    return NextResponse.json({ ok: true });
  }

  if (groupParsed.success && groupParsed.data && Object.keys(groupParsed.data).length > 0) {
    const update: Record<string, unknown> = { updatedAt: new Date() };
    for (const [k, v] of Object.entries(groupParsed.data)) if (v !== undefined) update[k] = v;
    await col.updateOne({ _id: new ObjectId(id) }, { $set: update });
    logMg(user, "UPDATE", "group", String(id));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ message: "Nothing to update." }, { status: 400 });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await requireMgRole(["ADMIN"]);
  if (!ObjectId.isValid(id)) return NextResponse.json({ message: "Not found." }, { status: 404 });

  const col = await getGroupsCollection();
  const cur = await col.findOne({ _id: new ObjectId(id) });
  // Soft-delete: archive keeps student history intact.
  await col.updateOne({ _id: new ObjectId(id) }, { $set: { status: "ARCHIVED", updatedAt: new Date() } });
  logMg(user, "DELETE", "group", cur?.name ?? id);
  return NextResponse.json({ ok: true });
}