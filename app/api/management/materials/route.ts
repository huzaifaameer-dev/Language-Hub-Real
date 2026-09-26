import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { requireMgRole, scopedGroupIds, logMg, saveManagementFile } from "@/lib/management/core";
import { getMaterialsCollection, getGroupsCollection } from "@/lib/db";
import { MgMaterialSchema } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireMgRole(["ADMIN", "TEACHER", "STUDENT"]);
  const { searchParams } = new URL(request.url);
  const group = searchParams.get("group");
  const category = searchParams.get("category")?.trim();

  const scope = await scopedGroupIds(user);
  const filter: Record<string, unknown> = { active: true };
  if (scope) filter.groupId = { $in: [...scope, null] };
  if (group && ObjectId.isValid(group) && scope?.includes(group)) filter.groupId = group;
  if (category) filter.category = category;

  const col = await getMaterialsCollection();
  const docs = await col.find(filter).sort({ createdAt: -1 }).limit(300).toArray();
  return NextResponse.json({
    materials: docs.map((d) => ({
      id: String(d._id),
      title: d.title,
      category: d.category ?? "General",
      description: d.description ?? null,
      type: d.type,
      url: d.url ?? null,
      uploadedBy: d.uploaderName,
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
  const parsed = MgMaterialSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ message: "Validation failed.", errors: z.flattenError(parsed.error).fieldErrors }, { status: 400 });
  }
  const d = parsed.data;

  if (d.groupId) {
    const scope = await scopedGroupIds(user);
    if (scope && !scope.includes(d.groupId)) {
      return NextResponse.json({ message: "You can only add materials to your groups." }, { status: 403 });
    }
  }

  let url = d.url ?? null;
  if (d.dataUri) {
    const saved = await saveManagementFile("material", String(new ObjectId()), `${d.title}.webp`, d.dataUri);
    url = saved.rel;
  }

  const col = await getMaterialsCollection();
  await col.insertOne({
    title: d.title.trim(),
    category: d.category ?? null,
    description: d.description ?? null,
    type: d.type,
    url,
    uploaderId: user.id,
    uploaderName: user.name,
    groupId: d.groupId ?? null,
    courseId: d.courseId ?? null,
    active: true,
    createdAt: new Date(),
  });
  logMg(user, "CREATE", "material", d.title);
  return NextResponse.json({ ok: true }, { status: 201 });
}