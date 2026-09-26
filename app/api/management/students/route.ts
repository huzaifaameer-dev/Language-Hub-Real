import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { requireMgRole, logMg } from "@/lib/management/core";
import { getUsersCollection, getGroupsCollection, ensureIndexesAndAdmin } from "@/lib/db";
import { MgStudentCreateSchema } from "@/lib/validate";

export const dynamic = "force-dynamic";

const PAGE = 25;

export async function GET(request: Request) {
  const user = await requireMgRole(["ADMIN", "TEACHER"]);
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const onlyActive = searchParams.get("status") !== "inactive";

  const groups = await getGroupsCollection();
  // Students = user accounts. Membership lives on groups; "in my groups" scope
  // applies to teachers so they never see unrelated students.
  const teacherGroupIds =
    user.role === "TEACHER"
      ? (await groups.find({ teacherIds: user.id, status: "ACTIVE" }, { projection: { studentIds: 1 } }).toArray()).flatMap((g) => g.studentIds ?? [])
      : null;

  const users = await getUsersCollection();
  const filter: Record<string, unknown> = { role: { $nin: ["ADMIN", "TEACHER"] } };
  if (onlyActive) filter.active = { $ne: false };
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { phone: { $regex: q, $options: "i" } },
    ];
  }
  const cursor = users.find(filter);
  if (teacherGroupIds) {
    const ids = Array.from(new Set(teacherGroupIds)).map((x) => new ObjectId(x));
    cursor.filter({ _id: { $in: ids } });
  }

  const [docs, total] = await Promise.all([
    cursor.sort({ createdAt: -1 }).skip((page - 1) * PAGE).limit(PAGE).toArray(),
    users.countDocuments(filter),
  ]);

  // Enrich with group memberships.
  const groupDocs = await groups.find({ studentIds: { $in: docs.map((d) => String(d._id)) } }).project({ name: 1, courseName: 1, studentIds: 1 }).toArray();
  const students = docs.map((d) => {
    const sid = String(d._id);
    const myGroups = groupDocs.filter((g) => (g.studentIds ?? []).includes(sid));
    return {
      id: sid,
      name: d.name,
      email: d.email,
      phone: d.phone ?? d.whatsapp ?? null,
      image: d.image ?? null,
      notes: (d as { notes?: string }).notes ?? null,
      active: (d as { active?: boolean }).active !== false,
      groups: myGroups.map((g) => ({ id: String(g._id), name: g.name, courseName: g.courseName ?? null })),
      createdAt: d.createdAt.toISOString(),
    };
  });

  return NextResponse.json({ students, total, page, pageSize: PAGE });
}

/** Add a student by email: links an existing account, or creates one (fresh
 *  account with a random password + USER role) then enrols into the chosen
 *  groups. E-mail is the dedupe key — duplicates are never created. */
export async function POST(request: Request) {
  const user = await requireMgRole(["ADMIN", "TEACHER"]);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }
  const parsed = MgStudentCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 }
    );
  }
  const { email, name, phone, groupIds } = parsed.data;

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
      role: "USER",
      emailVerified: null,
      image: null,
      notes: parsed.data.notes ?? null,
      createdAt: now,
    });
    account = { _id: insert.insertedId };
  } else {
    const set: Record<string, unknown> = {};
    if (phone) set.phone = phone.trim();
    if (parsed.data.notes !== undefined) set.notes = parsed.data.notes;
    set.updatedAt = new Date();
    await users.updateOne({ _id: account._id }, { $set: set });
  }

  const studentId = String(account._id);
  if (groupIds.length) {
    const groups = await getGroupsCollection();
    await groups.updateMany(
      { _id: { $in: groupIds.map((g) => new ObjectId(g)) }, studentIds: { $ne: studentId } },
      { $addToSet: { studentIds: studentId }, $set: { updatedAt: new Date() } }
    );
  }

  logMg(user, "CREATE", "student", emailNorm);
  return NextResponse.json({ id: studentId, ok: true }, { status: 201 });
}