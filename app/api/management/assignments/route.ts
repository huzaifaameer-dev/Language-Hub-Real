import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";

import {
  requireMgRole,
  canAccessGroup,
  logMg,
  dispatchMessage,
  notifyGroup,
  saveManagementFile,
  scopedGroupIds,
  type MgUser,
} from "@/lib/management/core";
import { getMgAssignmentsCollection, getGroupsCollection, ensureIndexesAndAdmin } from "@/lib/db";
import type { MgAssignmentStatus, MgAssignmentPriority } from "@/lib/db";
import { MgAssignmentSchema } from "@/lib/validate";

export const dynamic = "force-dynamic";

const AttachmentItem = z.object({
  name: z.string().max(120).trim(),
  mime: z.string().max(60).trim(),
  dataUri: z.string().regex(/^data:[a-z]+\/[a-zA-Z0-9.+-]+;base64,/, "Invalid file.").max(4_000_000),
});

const CreateBody = MgAssignmentSchema.extend({
  attachments: z.array(AttachmentItem).max(5).optional().default([]),
});

async function checkGroups(user: MgUser, groupIds: string[]): Promise<{ courseId?: string; courseName?: string | null }> {
  const groups = await getGroupsCollection();
  for (const g of groupIds) {
    if (!(await canAccessGroup(user, g))) {
      throw new ApiError(403, "You don't have permission to use one of the selected groups.");
    }
  }
  const docs = await groups.find({ _id: { $in: groupIds.map((g) => new ObjectId(g)) } }).toArray();
  return { courseId: docs[0]?.courseId ?? undefined, courseName: docs[0]?.courseName ?? null };
}

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function toDate(v: string | Date | null | undefined): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export async function GET(request: Request) {
  const user = await requireMgRole(["ADMIN", "TEACHER", "STUDENT"]);
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status")?.toUpperCase();
  const groupId = searchParams.get("group");
  const mine = searchParams.get("mine") === "1";

  const groupScope = await scopedGroupIds(user);
  const assignments = await getMgAssignmentsCollection();
  const byId = groupId && ObjectId.isValid(groupId) ? new ObjectId(groupId) : null;

  const filter: Record<string, unknown> = {};
  if (groupScope) filter.groupIds = { $in: groupScope };
  if (byId) filter.groupIds = byId;
  if (status && ["DRAFT", "SCHEDULED", "PUBLISHED", "OPEN", "CLOSED"].includes(status)) filter.status = status;
  if (mine) {
    // Students: only published/open/closed (never drafts).
    filter.status = { $in: ["PUBLISHED", "OPEN", "CLOSED"] };
  }

  const docs = await assignments.find(filter).sort({ createdAt: -1 }).limit(300).toArray();

  const groups = await getGroupsCollection();
  const groupDocs = await groups.find({ _id: { $in: docs.flatMap((d) => d.groupIds).map((g) => new ObjectId(g)) } }).toArray();
  const groupName = new Map(groupDocs.map((g) => [String(g._id), g.name]));

  return NextResponse.json({
    assignments: docs.map((d) => ({
      id: String(d._id),
      groupIds: d.groupIds,
      groupNames: d.groupIds.map((g) => groupName.get(g) ?? g),
      teacherId: d.teacherId,
      teacherName: d.teacherName,
      title: d.title,
      kind: d.kind ?? "assignment",
      description: d.description,
      instructions: d.instructions,
      links: d.links ?? [],
      hasAttachments: (d.attachments ?? []).length > 0,
      materialIds: d.materialIds ?? [],
      deadline: d.deadline?.toISOString() ?? null,
      reminderEnabled: d.reminderEnabled,
      reminderAt: d.reminderAt?.toISOString() ?? null,
      priority: d.priority,
      status: d.status,
      scheduledFor: d.scheduledFor?.toISOString() ?? null,
      notifyOnPublish: d.notifyOnPublish,
      publishedAt: d.publishedAt?.toISOString() ?? null,
      createdAt: d.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const user = await requireMgRole(["ADMIN", "TEACHER"]);

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }
  const body = (raw ?? {}) as Record<string, unknown>;
  const attachmentsRaw = Array.isArray(body.attachments) ? body.attachments : [];
  const { attachments: _attachments, ...rest } = body;

  const parsed = CreateBody.safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 }
    );
  }
  const d = parsed.data;
  const groupMeta = await checkGroups(user, d.groupIds);

  await ensureIndexesAndAdmin();
  const col = await getMgAssignmentsCollection();
  const _id = new ObjectId();
  const now = new Date();

  const attachments: Array<{ name: string; rel: string; mime: string }> = [];
  for (let i = 0; i < (attachmentsRaw as z.infer<typeof AttachmentItem>[]).length; i += 1) {
    const a = (attachmentsRaw as z.infer<typeof AttachmentItem>[])[i] as { dataUri: string; name: string; mime: string };
    const saved = await saveManagementFile(`assignment/${String(_id)}`, `file${i}`, a.name, a.dataUri);
    attachments.push(saved);
  }

  const status = d.status ?? "DRAFT";
  const isSchedule = status === "SCHEDULED";
  const isPublish = status === "PUBLISHED" || status === "OPEN";

  const doc = {
    _id,
    groupIds: d.groupIds,
    teacherId: user.id,
    teacherName: user.name,
    courseId: groupMeta.courseId ?? null,
    courseName: groupMeta.courseName ?? null,
    title: d.title.trim(),
    kind: d.kind ?? "assignment",
    description: d.description ?? null,
    instructions: d.instructions ?? null,
    attachments,
    links: d.links ?? [],
    materialIds: d.materialIds ?? [],
    deadline: toDate(d.deadline as string | null),
    reminderEnabled: d.reminderEnabled,
    reminderAt: d.reminderAt ? toDate(d.reminderAt as string) : toDate(d.deadline as string | null) ? new Date(toDate(d.deadline as string)!.getTime() - 2 * 3600000) : null,
    priority: (d.priority ?? "MEDIUM") as MgAssignmentPriority,
    status: (isSchedule ? "SCHEDULED" : isPublish ? "PUBLISHED" : "DRAFT") as MgAssignmentStatus,
    scheduledFor: isSchedule ? toDate(d.scheduledFor as string | null) ?? now : null,
    notifyOnPublish: d.notifyOnPublish,
    publishedAt: isPublish ? now : null,
    closedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  await col.insertOne(doc);

  if (isPublish) {
    const title = d.title.trim();
    const note = `📚 New assignment: "${title}". ${d.instructions ? `Instructions: ${d.instructions.slice(0, 200)}${d.instructions.length > 200 ? "…" : " "}` : ""}${
      doc.deadline ? `Deadline: ${doc.deadline.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}.` : ""
    } Submit: ${(process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "")}/my-learning`;
    await notifyGroup(d.groupIds, `New assignment: ${title}`, note, "/my-learning");
    await dispatchMessage({
      kind: "assignment",
      sender: user,
      recipientType: "group",
      groupIds: d.groupIds,
      text: note,
      relatedAssignmentId: String(_id),
    }).catch(() => {});
  }

  logMg(user, isSchedule ? "SCHEDULE" : isPublish ? "PUBLISH" : "CREATE", "assignment", d.title);
  return NextResponse.json({ id: String(_id), ok: true }, { status: 201 });
}