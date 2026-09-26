import { NextResponse } from "next/server";

import { requireMgRole, scopedGroupIds } from "@/lib/management/core";
import {
  getUsersCollection,
  getGroupsCollection,
  getTeachersCollection,
  getMgAssignmentsCollection,
  getSubmissionsCollection,
  getMessagesCollection,
  getAttendanceCollection,
} from "@/lib/db";

export const dynamic = "force-dynamic";

/** Role-scoped KPI + trend summary for management dashboards. */
export async function GET() {
  const user = await requireMgRole(["ADMIN", "TEACHER", "STUDENT"]);
  const scope = await scopedGroupIds(user);

  const groupsCol = await getGroupsCollection();
  const activeGroups: import("mongodb").Filter<import("@/lib/db").GroupDoc> = scope
    ? { _id: { $in: scope.map((g) => g as never) }, status: "ACTIVE" }
    : { status: "ACTIVE" };
  const [groupCount, activeStudents, teacherCount, usersCount] = await Promise.all([
    groupsCol.countDocuments(activeGroups),
    (async () => {
      if (user.role === "STUDENT") return scope?.length ?? 0;
      const docs = await groupsCol.find(activeGroups, { projection: { studentIds: 1 } }).toArray();
      return Array.from(new Set(docs.flatMap((d) => d.studentIds ?? []))).length;
    })(),
    user.role === "ADMIN" ? getTeachersCollection().then((t) => t.countDocuments({ active: true })) : Promise.resolve(1),
    user.role === "ADMIN" ? getUsersCollection().then((u) => u.countDocuments({ role: "USER", active: { $ne: false } })) : Promise.resolve(0),
  ]);

  // Assignment/submission activity within scope.
  const assignmentsCol = await getMgAssignmentsCollection();
  const assignmentFilter: import("mongodb").Filter<import("@/lib/db").MgAssignmentDoc> = {};
  if (scope) assignmentFilter.groupIds = { $in: scope };
  const now = new Date();
  const sinceDay = new Date(now.getTime() - 24 * 3600000);

  const [totalAssignments, publishedOpen, dueToday, overdueOpen, mySubmissions] = await Promise.all([
    assignmentsCol.countDocuments({ ...assignmentFilter, status: { $nin: ["DRAFT"] } }),
    assignmentsCol.countDocuments({ ...assignmentFilter, status: { $in: ["PUBLISHED", "OPEN"] } }),
    assignmentsCol.countDocuments({ ...assignmentFilter, status: { $in: ["PUBLISHED", "OPEN"] }, deadline: { $gte: sinceDay } }),
    assignmentsCol.countDocuments({ ...assignmentFilter, status: { $in: ["PUBLISHED", "OPEN"] }, deadline: { $lt: now } }),
    user.role === "STUDENT"
      ? getSubmissionsCollection().then((s) => s.countDocuments({ studentId: user.id }))
      : Promise.resolve(0),
  ]);

  const messagesCol = await getMessagesCollection();
  const msgFilter: Record<string, unknown> = {};
  if (user.role === "TEACHER") msgFilter.$or = [{ senderId: user.id }, { groupIds: { $in: scope?.length ? scope : ["__none__"] } }];
  const [totalMessages, sentMessages, scheduledMessages] = await Promise.all([
    messagesCol.countDocuments({ ...msgFilter, status: { $nin: ["DRAFT"] } }),
    messagesCol.countDocuments({ ...msgFilter, status: "SENT" }),
    messagesCol.countDocuments({ ...msgFilter, status: "SCHEDULED" }),
  ]);

  // Attendance today (scoped groups).
  const attCol = await getAttendanceCollection();
  const today = new Date().toISOString().slice(0, 10);
  const todayAtt = scope
    ? await attCol.countDocuments({ date: today, groupId: { $in: scope } })
    : await attCol.countDocuments({ date: today });

  return NextResponse.json({
    role: user.role,
    groups: groupCount,
    students: activeStudents,
    teachers: teacherCount,
    users: usersCount,
    assignments: totalAssignments,
    openAssignments: publishedOpen,
    dueToday,
    overdue: overdueOpen,
    mySubmissions,
    messages: totalMessages,
    messagesSent: sentMessages,
    scheduledMessages,
    attendanceToday: todayAtt,
  });
}