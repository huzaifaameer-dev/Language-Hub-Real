import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { requireMgRole, scopedGroupIds, logMg } from "@/lib/management/core";
import { getSubmissionsCollection, getMgAssignmentsCollection } from "@/lib/db";
import { notify } from "@/lib/notifications";
import { MgSubmissionReviewSchema } from "@/lib/validate";

export const dynamic = "force-dynamic";

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
  const parsed = MgSubmissionReviewSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Validation failed." }, { status: 400 });

  const subs = await getSubmissionsCollection();
  const sub = await subs.findOne({ _id: new ObjectId(id) });
  if (!sub) return NextResponse.json({ message: "Not found." }, { status: 404 });

  // Authorize: teacher owns the assignment (or admin).
  const assignments = await getMgAssignmentsCollection();
  const a = await assignments.findOne({ _id: new ObjectId(sub.assignmentId) });
  if (!a) return NextResponse.json({ message: "Assignment missing." }, { status: 404 });
  if (user.role === "TEACHER") {
    const scope = await scopedGroupIds(user);
    if (!scope || !a.groupIds.some((g) => scope.includes(g))) {
      return NextResponse.json({ message: "You don't have permission for this submission." }, { status: 403 });
    }
  }

  const now = new Date();
  const update: Record<string, unknown> = { updatedAt: now };
  if (parsed.data.feedback !== undefined) update.feedback = parsed.data.feedback ?? null;
  if (parsed.data.grade !== undefined) update.grade = parsed.data.grade ?? null;
  if (parsed.data.status !== undefined) {
    update.status = parsed.data.status;
    if (parsed.data.status === "REVIEWED") update.reviewedAt = now;
    if (parsed.data.status === "RETURNED") update.returnedAt = now;
  }
  await subs.updateOne({ _id: sub._id }, { $set: update });

  if (ObjectId.isValid(sub.studentId)) {
    void notify(sub.studentId, {
      kind: "submission-review",
      title: parsed.data.grade ? `Grade: ${parsed.data.grade}` : "Assignment reviewed",
      message: `Your submission for "${a.title}" ${parsed.data.status === "RETURNED" ? "was returned for revision." : "has been reviewed."}${parsed.data.feedback ? ` Feedback: ${parsed.data.feedback.slice(0, 200)}` : ""}`,
      href: "/my-learning",
    }).catch(() => {});
  }

  logMg(user, parsed.data.status ?? "UPDATE", "submission", sub.assignmentId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await requireMgRole(["ADMIN"]);
  if (!ObjectId.isValid(id)) return NextResponse.json({ message: "Not found." }, { status: 404 });
  const subs = await getSubmissionsCollection();
  await subs.deleteOne({ _id: new ObjectId(id) });
  logMg(user, "DELETE", "submission", id);
  return NextResponse.json({ ok: true });
}