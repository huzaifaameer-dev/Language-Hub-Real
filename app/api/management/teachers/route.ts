import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { requireMgRole, logMg } from "@/lib/management/core";
import { getTeachersCollection, getUsersCollection, getGroupsCollection, ensureIndexesAndAdmin } from "@/lib/db";
import { MgTeacherCreateSchema } from "@/lib/validate";
import type { TeacherDoc } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireMgRole(["ADMIN", "TEACHER"]);
  const teachers = await getTeachersCollection();
  const users = await getUsersCollection();

  const rosterDocs = await teachers.find({}).sort({ createdAt: -1 }).limit(500).toArray();
  const rosterIds = new Set(rosterDocs.map((d) => d.userId));

  // Auto-backfill: any USER-role account promoted to TEACHER (e.g. through the
  // admin panel) gets a management roster row on first read so group assignment
  // always lists every active teacher.
  const rosterObjectIds = rosterDocs
    .map((d) => d.userId)
    .filter((u) => ObjectId.isValid(u))
    .map((u) => new ObjectId(u));
  const backfill = await users
    .find({ role: "TEACHER", _id: { $nin: rosterObjectIds } })
    .project({ name: 1, email: 1, phone: 1 })
    .toArray();

  const now = new Date();
  const addedDocs: TeacherDoc[] = [];
  for (const u of backfill) {
    const uid = String(u._id);
    if (rosterIds.has(uid) || !ObjectId.isValid(uid)) continue;
    const doc: Omit<TeacherDoc, "_id"> = {
      userId: uid,
      name: (u.name as string) ?? "Teacher",
      email: (u.email as string) ?? "",
      phone: (u.phone as string) ?? null,
      courseIds: [],
      active: true,
      createdAt: now,
      updatedAt: now,
    };
    const inserted = await teachers.insertOne(doc);
    addedDocs.push({ ...doc, _id: inserted.insertedId });
    rosterIds.add(uid);
  }

  const allDocs = [...addedDocs, ...rosterDocs].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
  const userDocs = await users
    .find(
      { _id: { $in: allDocs.map((d) => d.userId).filter((o) => ObjectId.isValid(o)).map((o) => new ObjectId(o)) } },
      { projection: { name: 1, email: 1, phone: 1 } }
    )
    .toArray();
  const byId = new Map(userDocs.map((d) => [String(d._id), d]));

  return NextResponse.json({
    teachers: allDocs.map((d) => {
      const u = byId.get(d.userId) as { name?: string; email?: string; phone?: string } | undefined;
      return {
        id: String(d._id),
        userId: d.userId,
        name: u?.name ?? d.name,
        email: u?.email ?? d.email,
        phone: u?.phone ?? d.phone ?? null,
        courseIds: d.courseIds,
        active: d.active,
        createdAt: d.createdAt.toISOString(),
      };
    }),
  });
}

/** Promote an existing user account to TEACHER (by e-mail — never duplicate). */
export async function POST(request: Request) {
  const user = await requireMgRole(["ADMIN"]);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }
  const parsed = MgTeacherCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 }
    );
  }
  const { email, name, phone, courseIds } = parsed.data;

  await ensureIndexesAndAdmin();
  const users = await getUsersCollection();
  const emailNorm = email.toLowerCase();
  let account = await users.findOne({ email: emailNorm });

  if (!account) {
    const hash = await bcrypt.hash(Math.random().toString(36).slice(2) + "Lh!2026", 12);
    const now = new Date();
    const insert = await users.insertOne({
      name: name.trim(),
      email: emailNorm,
      password: hash,
      phone: phone?.trim() || null,
      role: "TEACHER",
      emailVerified: null,
      image: null,
      createdAt: now,
    });
    account = { _id: insert.insertedId };
  } else {
    await users.updateOne({ _id: account._id }, { $set: { role: "TEACHER", updatedAt: new Date() } });
  }

  const teachers = await getTeachersCollection();
  const existing = await teachers.findOne({ userId: String(account._id) });
  if (existing) {
    await teachers.updateOne({ _id: existing._id }, { $set: { courseIds, active: true, updatedAt: new Date() } });
  } else {
    await teachers.insertOne({
      userId: String(account._id),
      name: name.trim(),
      email: emailNorm,
      phone: phone?.trim() || null,
      courseIds,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  logMg(user, "CREATE", "teacher", emailNorm);
  return NextResponse.json({ id: String(account._id), ok: true }, { status: 201 });
}

/** Assign a teacher to groups (by teacher userId + group ids) — convenience for the UI. */
export async function PATCH(request: Request) {
  const user = await requireMgRole(["ADMIN"]);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }
  const parsed = z
    .object({ teacherUserId: z.string().min(1), groupIds: z.array(z.string()).min(1) })
    .safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Validation failed." }, { status: 400 });

  const groups = await getGroupsCollection();
  await groups.updateMany(
    { _id: { $in: parsed.data.groupIds.map((g) => new ObjectId(g)) }, teacherIds: { $ne: parsed.data.teacherUserId } },
    { $addToSet: { teacherIds: parsed.data.teacherUserId }, $set: { updatedAt: new Date() } }
  );
  logMg(user, "ASSIGN_TEACHER", "teacher", parsed.data.teacherUserId, `${parsed.data.groupIds.length} groups`);
  return NextResponse.json({ ok: true });
}