import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { requireMgRole, deliverMessage, logMg } from "@/lib/management/core";
import { getMessagesCollection } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await requireMgRole(["ADMIN", "TEACHER"]);
  if (!ObjectId.isValid(id)) return NextResponse.json({ message: "Not found." }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as { action?: string; scheduleAt?: string };
  const col = await getMessagesCollection();
  const m = await col.findOne({ _id: new ObjectId(id) });
  if (!m) return NextResponse.json({ message: "Not found." }, { status: 404 });
  if (user.role === "TEACHER" && m.senderId !== user.id) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  if (body.action === "cancel" && m.status === "SCHEDULED") {
    await col.updateOne({ _id: m._id }, { $set: { status: "CANCELLED", updatedAt: new Date() } });
    logMg(user, "CANCEL", "message", String(m._id));
    return NextResponse.json({ ok: true });
  }
  if (body.action === "sendNow") {
    const delivered = await deliverMessage(m);
    logMg(user, "SEND", "message", String(m._id));
    return NextResponse.json({ ok: true, status: delivered.status });
  }
  if (body.action === "reschedule" && body.scheduleAt) {
    await col.updateOne({ _id: m._id }, { $set: { status: "SCHEDULED", scheduledFor: new Date(body.scheduleAt), updatedAt: new Date() } });
    logMg(user, "RESCHEDULE", "message", String(m._id));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ message: "Unsupported action." }, { status: 400 });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await requireMgRole(["ADMIN", "TEACHER"]);
  if (!ObjectId.isValid(id)) return NextResponse.json({ message: "Not found." }, { status: 404 });
  const col = await getMessagesCollection();
  const m = await col.findOne({ _id: new ObjectId(id) });
  if (!m) return NextResponse.json({ message: "Not found." }, { status: 404 });
  if (user.role === "TEACHER" && m.senderId !== user.id) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }
  await col.deleteOne({ _id: m._id });
  logMg(user, "DELETE", "message", String(m._id));
  return NextResponse.json({ ok: true });
}