import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";

import {
  requireMgRole,
  scopedGroupIds,
  logMg,
  dispatchMessage,
} from "@/lib/management/core";
import { getMessagesCollection, getGroupsCollection } from "@/lib/db";
import { MgMessageSchema } from "@/lib/validate";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireMgRole(["ADMIN", "TEACHER"]);
  const { searchParams } = new URL(request.url);
  const group = searchParams.get("group")?.trim();
  const kind = searchParams.get("kind")?.trim();
  const status = searchParams.get("status")?.toUpperCase();
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const col = await getMessagesCollection();
  const filter: import("mongodb").Filter<import("@/lib/db").MessageDoc> = {};
  if (group && ObjectId.isValid(group)) filter.groupIds = { $in: [group] };
  if (kind) filter.kind = kind as never;
  if (status) filter.status = status as never;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  // Teachers only ever see messages they sent or sent to their own groups.
  if (user.role === "TEACHER") {
    const scope = await scopedGroupIds(user);
    filter.$or = [{ senderId: user.id }, { groupIds: { $in: scope?.length ? scope : ["__none__"] } }];
  }

  const docs = await col.find(filter).sort({ createdAt: -1 }).limit(200).toArray();
  return NextResponse.json({
    messages: docs.map((d) => ({
      id: String(d._id),
      kind: d.kind,
      senderName: d.senderName,
      recipientType: d.recipientType,
      groupNames: d.groupNames,
      text: d.text,
      status: d.status,
      scheduledFor: d.scheduledFor?.toISOString() ?? null,
      sentAt: d.sentAt?.toISOString() ?? null,
      failedReason: d.failedReason ?? null,
      mock: d.mock,
      recipientCount: d.deliveries?.length ?? 0,
      sentCount: d.deliveries?.filter((x) => x.status === "SENT").length ?? 0,
      createdAt: d.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const user = await requireMgRole(["ADMIN", "TEACHER"]);

  const rl = await rateLimitDb(await clientKey(request, "manage-message"), 10, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ message: `Too many messages. Try again in ${rl.retryAfter}s.` }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }
  const parsed = MgMessageSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ message: "Validation failed.", errors: z.flattenError(parsed.error).fieldErrors }, { status: 400 });
  }
  const d = parsed.data;
  const saveOnly = new URL(request.url).searchParams.get("save") === "1";

  // Scope check: teachers can only message their own groups/students.
  if (user.role === "TEACHER") {
    const scope = await scopedGroupIds(user);
    if (d.groupIds.length && !d.groupIds.every((g) => scope?.includes(g))) {
      return NextResponse.json({ message: "You can only message your own groups." }, { status: 403 });
    }
    if (d.studentIds.length) {
      const col = await getGroupsCollection();
      const mine = (await col.find({ teacherIds: user.id, status: "ACTIVE" }, { projection: { studentIds: 1 } }).toArray()).flatMap((g) => g.studentIds ?? []);
      if (!d.studentIds.every((s) => mine.includes(s))) {
        return NextResponse.json({ message: "You can only message students in your own groups." }, { status: 403 });
      }
    }
  }

  const message = await dispatchMessage({
    kind: d.kind,
    sender: user,
    recipientType: d.recipientType,
    studentIds: d.studentIds,
    groupIds: d.groupIds,
    text: d.text,
    scheduleAt: saveOnly ? null : d.scheduleAt ? new Date(d.scheduleAt) : null,
  });

  // Keep a DRAFT row without sending when the editor asked to save.
  if (saveOnly) {
    const col = await getMessagesCollection();
    await col.updateOne({ _id: message._id as ObjectId }, { $set: { status: "DRAFT", updatedAt: new Date() } });
  }

  logMg(user, saveOnly ? "SAVE_DRAFT" : "SEND", "message", `${d.kind} → ${d.groupIds.length || d.studentIds.length} recipients`);
  return NextResponse.json({ id: String(message._id), ok: true, status: saveOnly ? "DRAFT" : message.status }, { status: 201 });
}