import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { requireMgRole, scopedGroupIds, logMg } from "@/lib/management/core";
import { getGroupsCollection, getCoursesCollection, ensureIndexesAndAdmin } from "@/lib/db";
import { MgGroupSchema } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireMgRole(["ADMIN", "TEACHER", "STUDENT"]);
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const onlyActive = searchParams.get("status") !== "all";

  const groups = await getGroupsCollection();
  const myGroups = await scopedGroupIds(user);
  const base = myGroups ? { _id: { $in: myGroups.map((g) => new ObjectId(g)) } } : {};
  const filter: Record<string, unknown> = {
    ...base,
    ...(onlyActive ? { status: "ACTIVE" } : {}),
    ...(q ? { name: { $regex: q, $options: "i" } } : {}),
  };

  const docs = await groups.find(filter).sort({ createdAt: -1 }).limit(500).toArray();
  return NextResponse.json({
    groups: docs.map((d) => ({
      id: String(d._id),
      name: d.name,
      courseId: d.courseId ?? null,
      courseName: d.courseName ?? null,
      teacherIds: d.teacherIds,
      studentIds: d.studentIds,
      studentCount: (d.studentIds ?? []).length,
      schedule: d.schedule ?? null,
      notes: d.notes ?? null,
      status: d.status,
      createdAt: d.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const user = await requireMgRole(["ADMIN"]);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }
  const parsed = MgGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 }
    );
  }

  await ensureIndexesAndAdmin();
  const col = await getGroupsCollection();
  const d = parsed.data;
  const courses = await getCoursesCollection();
  const course = d.courseId
    ? await courses.findOne({ _id: new ObjectId(d.courseId) }).catch(() => null)
    : null;

  const now = new Date();
  const result = await col.insertOne({
    name: d.name.trim(),
    courseId: d.courseId ?? null,
    courseName: d.courseName ?? course?.name ?? null,
    teacherIds: d.teacherIds ?? [],
    studentIds: d.studentIds ?? [],
    schedule: d.schedule ?? null,
    notes: d.notes ?? null,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  });

  logMg(user, "CREATE", "group", d.name);
  return NextResponse.json({ id: String(result.insertedId), ok: true }, { status: 201 });
}