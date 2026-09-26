import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { requireMgRole, scopedGroupIds, logMg, saveManagementFile, type MgUser } from "@/lib/management/core";
import { getSubmissionsCollection, getMgAssignmentsCollection, getGroupsCollection, getUsersCollection } from "@/lib/db";
import { notify } from "@/lib/notifications";
import { MgSubmissionSchema } from "@/lib/validate";

export const dynamic = "force-dynamic";

async function assignmentAccess(
  user: MgUser,
  assignmentId: string
): Promise<{ a: MgAssignment | null; error: { status: number; message: string } | null }> {
  const col = await getMgAssignmentsCollection();
  const a = await col.findOne({ _id: new ObjectId(assignmentId) }).catch(() => null);
  if (!a) return { a: null, error: { status: 404, message: "Assignment not found." } };
  const scope = await scopedGroupIds(user);
  if (scope && !a.groupIds.some((g) => scope.includes(g))) {
    return { a: null, error: { status: 403, message: "You can't access that assignment." } };
  }
  return { a: a as MgAssignment, error: null };
}

type MgAssignment = { _id: unknown; groupIds: string[]; teacherId: string; title: string; status?: string; deadline?: Date | null };

/** Teacher/admin: submissions for an assignment + live tracking numbers.
 *  Student: the student's own submissions across their assignments. */
export async function GET(request: Request) {
  const user = await requireMgRole(["ADMIN", "TEACHER", "STUDENT"]);
  const { searchParams } = new URL(request.url);
  const assignmentId = searchParams.get("assignment");

  if (user.role !== "STUDENT" && assignmentId) {
    if (!ObjectId.isValid(assignmentId)) return NextResponse.json({ message: "Bad assignment id." }, { status: 400 });
    const res = await assignmentAccess(user, assignmentId);
    if (res.error) return NextResponse.json({ message: res.error.message }, { status: res.error.status });
    const a = res.a!;

    const subs = await getSubmissionsCollection();
    const docs = await subs.find({ assignmentId }).sort({ submittedAt: -1 }).toArray();

    // Tracking: total students = union of group members (minus admins/teachers).
    const groups = await getGroupsCollection();
    const groupDocs = await groups.find({ _id: { $in: a.groupIds.map((g) => new ObjectId(g)) } }).toArray();
    const studentIds = Array.from(new Set(groupDocs.flatMap((g) => g.studentIds ?? [])));
    const users = await getUsersCollection();
    const memberDocs = await users.find({ _id: { $in: studentIds.map((s) => new ObjectId(s)) } }, { projection: { name: 1, phone: 1 } }).toArray();
    const byId = new Map(memberDocs.map((m) => [String(m._id), m]));

    const submittedIds = docs.map((d) => d.studentId);
    const pending = studentIds.filter((s) => !submittedIds.includes(s));

    return NextResponse.json({
      assignment: {
        id: String(a._id),
        title: a.title,
        deadline: a.deadline?.toISOString() ?? null,
        status: a.status,
        groupIds: a.groupIds,
      },
      summary: {
        total: studentIds.length,
        submitted: submittedIds.length,
        late: docs.filter((d) => d.status === "LATE").length,
        reviewed: docs.filter((d) => d.status === "REVIEWED").length,
        pending: pending.length,
      },
      submissions: docs.map((d) => ({
        id: String(d._id),
        assignmentId: d.assignmentId,
        studentId: d.studentId,
        studentName: byId.get(d.studentId)?.name ?? d.studentName,
        phone: byId.get(d.studentId)?.phone ?? null,
        text: d.text,
        links: d.links ?? [],
        hasAttachments: (d.attachments ?? []).length > 0,
        status: d.status,
        feedback: d.feedback ?? null,
        grade: d.grade ?? null,
        submittedAt: d.submittedAt.toISOString(),
        reviewedAt: d.reviewedAt?.toISOString() ?? null,
      })),
      pendingStudents: pending.map((s) => ({
        studentId: s,
        name: byId.get(s)?.name ?? "Student",
        phone: byId.get(s)?.phone ?? null,
      })),
    });
  }

  if (user.role === "STUDENT") {
    const subs = await getSubmissionsCollection();
    const mine = await subs.find({ studentId: user.id }).sort({ submittedAt: -1 }).limit(200).toArray();
    return NextResponse.json({
      submissions: mine.map((d) => ({
        id: String(d._id),
        assignmentId: d.assignmentId,
        text: d.text,
        links: d.links ?? [],
        status: d.status,
        feedback: d.feedback ?? null,
        grade: d.grade ?? null,
        submittedAt: d.submittedAt.toISOString(),
      })),
    });
  }

  // Admin/teacher: one student's submission history (scope-guarded for teachers).
  const studentId = searchParams.get("student");
  if (studentId) {
    if (!ObjectId.isValid(studentId)) return NextResponse.json({ message: "Bad student id." }, { status: 400 });
    if (user.role === "TEACHER") {
      const groups = await getGroupsCollection();
      const mine = (await groups.find({ teacherIds: user.id, status: "ACTIVE" }, { projection: { studentIds: 1 } }).toArray()).flatMap((g) => g.studentIds ?? []);
      if (!mine.includes(studentId)) return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }
    const subs = await getSubmissionsCollection();
    const docs = await subs.find({ studentId }).sort({ submittedAt: -1 }).limit(200).toArray();
    const assignments = await getMgAssignmentsCollection();
    const aDocs = await assignments.find({ _id: { $in: docs.map((d) => new ObjectId(d.assignmentId)).filter((o) => o) } }, { projection: { title: 1 } }).toArray();
    const title = new Map(aDocs.map((a) => [String(a._id), a.title]));
    return NextResponse.json({
      submissions: docs.map((d) => ({
        id: String(d._id),
        assignmentId: d.assignmentId,
        assignmentTitle: title.get(d.assignmentId) ?? "Assignment",
        text: d.text,
        links: d.links ?? [],
        status: d.status,
        feedback: d.feedback ?? null,
        grade: d.grade ?? null,
        submittedAt: d.submittedAt.toISOString(),
      })),
    });
  }

  return NextResponse.json({ submissions: [] });
}

/** Student: submit / re-submit an assignment (text, links, files). */
export async function POST(request: Request) {
  const user = await requireMgRole(["STUDENT"]);
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }
  const body = (raw ?? {}) as Record<string, unknown>;
  const attachmentsRaw = Array.isArray(body.attachments) ? body.attachments : [];
  const { attachments: _a, ...rest } = body;
  const parsed = MgSubmissionSchema.safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 }
    );
  }
  const d = parsed.data;
  const res = await assignmentAccess(user, d.assignmentId);
  if (res.error) return NextResponse.json({ message: res.error.message }, { status: res.error.status });
  const assignment = res.a!;

  const saved = [];
  for (let i = 0; i < attachmentsRaw.length; i += 1) {
    const att = attachmentsRaw[i] as { name?: string; mime?: string; dataUri: string };
    if (!att || typeof att.dataUri !== "string") continue;
    const f = await saveManagementFile(`submission/${d.assignmentId}/${user.id}`, `f${i}`, String(att.name ?? "file"), att.dataUri);
    saved.push(f);
  }

  const isLate = !!assignment.deadline && new Date(assignment.deadline).getTime() < Date.now();
  const now = new Date();

  const subs = await getSubmissionsCollection();
  const existing = await subs.findOne({ assignmentId: d.assignmentId, studentId: user.id });

  if (existing) {
    await subs.updateOne(
      { _id: existing._id },
      {
        $set: {
          text: d.text ?? null,
          links: d.links ?? [],
          attachments: saved,
          status: isLate ? "LATE" : "SUBMITTED",
          feedback: null,
          grade: null,
          submittedAt: now,
          updatedAt: now,
        },
      }
    );
  } else {
    await subs.insertOne({
      assignmentId: d.assignmentId,
      studentId: user.id,
      studentName: user.name,
      studentEmail: user.email || null,
      text: d.text ?? null,
      links: d.links ?? [],
      attachments: saved,
      status: isLate ? "LATE" : "SUBMITTED",
      feedback: null,
      grade: null,
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  // In-app notification to the assignment's teacher.
  if (ObjectId.isValid(assignment.teacherId)) {
    void notify(assignment.teacherId, {
      kind: "submission",
      title: "Submission received",
      message: `${user.name} submitted "${assignment.title}".`,
      href: "/manage?tab=submissions",
    }).catch(() => {});
  }

  logMg(user, "SUBMIT", "submission", d.assignmentId);
  return NextResponse.json({ ok: true, status: isLate ? "LATE" : "SUBMITTED" }, { status: 201 });
}