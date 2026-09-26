import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { requireMgRole, scopedGroupIds, canAccessGroup, logMg } from "@/lib/management/core";
import { getAttendanceCollection, getGroupsCollection } from "@/lib/db";
import { MgAttendanceSchema } from "@/lib/validate";

export const dynamic = "force-dynamic";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function attendancePct(records: Array<{ status?: string | null }>): number {
  if (!records.length) return 0;
  const present = records.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
  return Math.round((present / records.length) * 100);
}

export async function GET(request: Request) {
  const user = await requireMgRole(["ADMIN", "TEACHER", "STUDENT"]);
  const { searchParams } = new URL(request.url);
  const group = searchParams.get("group");
  const on = searchParams.get("date") ?? todayStr();
  const mine = searchParams.get("mine") === "1";

  const col = await getAttendanceCollection();

  if (mine && user.role === "STUDENT") {
    const groups = await getGroupsCollection();
    const myGroups = await scopedGroupIds(user);
    const history = await col
      .find({ groupId: { $in: myGroups ?? [] } })
      .sort({ date: -1 })
      .limit(120)
      .toArray();
    const rows = history.map((d) => ({
      date: d.date,
      groupId: d.groupId,
      status: d.records.find((r) => r.studentId === user.id)?.status ?? null,
    }));
    const total = rows.filter((r) => r.status).length;
    const pct = attendancePct(rows.filter((r) => r.status));
    return NextResponse.json({ rows, total, pct });
  }

  // Admin/teacher: one student's attendance history (scope-guarded for teachers).
  const student = searchParams.get("student");
  if (student && user.role !== "STUDENT") {
    const groups = await getGroupsCollection();
    if (user.role === "TEACHER") {
      const mine = (await groups.find({ teacherIds: user.id, status: "ACTIVE" }, { projection: { studentIds: 1 } }).toArray()).flatMap((g) => g.studentIds ?? []);
      if (!mine.includes(student)) return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }
    const history = await col.find({ "records.studentId": student }).sort({ date: -1 }).limit(120).toArray();
    const rows = history.map((d) => ({
      date: d.date,
      groupId: d.groupId,
      status: d.records.find((r) => r.studentId === student)?.status ?? null,
    }));
    const total = rows.filter((r) => r.status).length;
    const pct = attendancePct(rows.filter((r) => r.status));
    return NextResponse.json({ rows, total, pct });
  }

  if (!group || !ObjectId.isValid(group)) {
    return NextResponse.json({ message: "Group + date required." }, { status: 400 });
  }
  if (!(await canAccessGroup(user, group))) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const doc = await col.findOne({ groupId: group, date: on });
  const groups = await getGroupsCollection();
  const grp = await groups.findOne({ _id: new ObjectId(group) });

  // History for the group when no exact doc: recent dates.
  const history = await col.find({ groupId: group }).sort({ date: -1 }).limit(90).toArray();

  return NextResponse.json({
    date: on,
    groupName: grp?.name ?? null,
    records: doc?.records ?? [],
    history: history.map((h) => ({ date: h.date, ...groupPct(h.records) })),
    studentTotal: (grp?.studentIds ?? []).length,
  });
}

function groupPct(records: Array<{ status: string }>) {
  return { pct: attendancePct(records), present: records.filter((r) => r.status === "PRESENT" || r.status === "LATE").length };
}

export async function POST(request: Request) {
  const user = await requireMgRole(["ADMIN", "TEACHER"]);
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }
  const parsed = MgAttendanceSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ message: "Validation failed.", errors: z.flattenError(parsed.error).fieldErrors }, { status: 400 });
  }
  const d = parsed.data;
  if (!(await canAccessGroup(user, d.groupId))) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const col = await getAttendanceCollection();
  const now = new Date();
  await col.updateOne(
    { groupId: d.groupId, date: d.date },
    { $set: { records: d.records, createdBy: user.id, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true }
  );
  logMg(user, "MARK_ATTENDANCE", "group", d.groupId, `${d.date} (${d.records.length})`);
  return NextResponse.json({ ok: true });
}