import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { requireMgRole, scopedGroupIds, logMg } from "@/lib/management/core";
import { getMaterialsCollection } from "@/lib/db";
import { MgMaterialSchema } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await requireMgRole(["ADMIN", "TEACHER"]);
  if (!ObjectId.isValid(id)) return NextResponse.json({ message: "Not found." }, { status: 404 });

  const parse = MgMaterialSchema.partial().safeParse(await request.json().catch(() => null));
  if (!parse.success || !parse.data || Object.keys(parse.data).length === 0) {
    return NextResponse.json({ message: "Nothing to update." }, { status: 400 });
  }

  const col = await getMaterialsCollection();
  const doc = await col.findOne({ _id: new ObjectId(id) });
  if (!doc) return NextResponse.json({ message: "Not found." }, { status: 404 });
  if (user.role === "TEACHER" && doc.uploaderId !== user.id) {
    const scope = await scopedGroupIds(user);
    if (!doc.groupId || !scope?.includes(doc.groupId)) {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }
  }

  const update: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parse.data)) if (v !== undefined) update[k] = v;
  await col.updateOne({ _id: doc._id }, { $set: update });
  logMg(user, "UPDATE", "material", doc.title);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await requireMgRole(["ADMIN", "TEACHER"]);
  if (!ObjectId.isValid(id)) return NextResponse.json({ message: "Not found." }, { status: 404 });
  const col = await getMaterialsCollection();
  await col.deleteOne({ _id: new ObjectId(id) });
  logMg(user, "DELETE", "material", id);
  return NextResponse.json({ ok: true });
}

export { z };