import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { requireMgRole, logMg } from "@/lib/management/core";
import { getMessageTemplatesCollection } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await requireMgRole(["ADMIN", "TEACHER"]);
  if (!ObjectId.isValid(id)) return NextResponse.json({ message: "Not found." }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (Object.keys(body).length === 0) return NextResponse.json({ message: "Nothing to update." }, { status: 400 });

  const col = await getMessageTemplatesCollection();
  const update: Record<string, unknown> = { updatedAt: new Date() };
  for (const [k, v] of Object.entries(body)) {
    if (k === "name" || k === "body" || k === "active") update[k] = v;
  }
  const res = await col.updateOne({ _id: new ObjectId(id) }, { $set: update });
  if (res.matchedCount === 0) return NextResponse.json({ message: "Not found." }, { status: 404 });
  logMg(user, "UPDATE", "template", String(id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await requireMgRole(["ADMIN"]);
  if (!ObjectId.isValid(id)) return NextResponse.json({ message: "Not found." }, { status: 404 });
  const col = await getMessageTemplatesCollection();
  await col.deleteOne({ _id: new ObjectId(id) });
  logMg(user, "DELETE", "template", String(id));
  return NextResponse.json({ ok: true });
}