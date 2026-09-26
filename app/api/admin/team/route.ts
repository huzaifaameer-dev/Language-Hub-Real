import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { requireAdmin, isValidObjectId } from "@/lib/admin-guard";
import { ensureIndexesAndAdmin, getTeamMembersCollection, logAdminAction } from "@/lib/db";
import { TeamMemberSchema } from "@/lib/validate";

const PatchSchema = z.object({
  id: z.string().min(1),
  payload: TeamMemberSchema.partial().extend({
    active: z.boolean().optional(),
    order: z.number().int().min(0).optional(),
    ceo: z.boolean().optional(),
  }),
});

/** Admin: list all team profiles (CEO first, then display order). */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  await ensureIndexesAndAdmin();
  const col = await getTeamMembersCollection();
  const docs = await col.find({}).sort({ ceo: -1, order: 1 }).limit(200).toArray();

  const list = docs.map((d) => ({
    id: String(d._id),
    name: d.name,
    role: d.role,
    headline: d.headline ?? null,
    credentials: d.credentials ?? [],
    bio: d.bio,
    focus: d.focus ?? [],
    image: d.image ?? null,
    order: d.order,
    active: !!d.active,
    ceo: !!d.ceo,
    createdAt: d.createdAt.toISOString(),
  }));

  return NextResponse.json({ members: list });
}

/** Admin: create a team profile. */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const parsed = TeamMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 }
    );
  }

  await ensureIndexesAndAdmin();
  const col = await getTeamMembersCollection();
  const count = await col.countDocuments({});
  const now = new Date();
  const d = parsed.data;

  const result = await col.insertOne({
    name: d.name.trim(),
    role: d.role.trim(),
    headline: d.headline ?? null,
    credentials: d.credentials ?? [],
    bio: d.bio.trim(),
    focus: d.focus ?? [],
    image: d.image ?? null,
    active: d.active ?? true,
    ceo: !!d.ceo,
    order: d.order ?? count,
    createdAt: now,
    updatedAt: now,
  });

  void logAdminAction({
    actor: admin.email ?? "admin",
    action: "CREATE",
    targetType: "team_member",
    targetLabel: d.name,
  });

  return NextResponse.json({ id: String(result.insertedId), ok: true }, { status: 201 });
}

/** Admin: update a team profile. */
export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Validation failed." }, { status: 400 });
  }
  if (!isValidObjectId(parsed.data.id)) {
    return NextResponse.json({ message: "Invalid record id." }, { status: 400 });
  }

  await ensureIndexesAndAdmin();
  const col = await getTeamMembersCollection();
  const update: Record<string, unknown> = { updatedAt: new Date() };
  for (const [k, v] of Object.entries(parsed.data.payload)) {
    if (v !== undefined) update[k] = v;
  }

  const result = await col.updateOne({ _id: new ObjectId(parsed.data.id) }, { $set: update });
  if (result.matchedCount === 0) {
    return NextResponse.json({ message: "Record not found." }, { status: 404 });
  }

  void logAdminAction({
    actor: admin.email ?? "admin",
    action: "UPDATE",
    targetType: "team_member",
    targetLabel: String(parsed.data.id),
  });

  return NextResponse.json({ ok: true });
}

/** Admin: delete a team profile. */
export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") ?? "";
  if (!isValidObjectId(id)) {
    return NextResponse.json({ message: "Invalid record id." }, { status: 400 });
  }

  await ensureIndexesAndAdmin();
  const col = await getTeamMembersCollection();
  const target = await col.findOne({ _id: new ObjectId(id) }, { projection: { name: 1 } });
  await col.deleteOne({ _id: new ObjectId(id) });

  void logAdminAction({
    actor: admin.email ?? "admin",
    action: "DELETE",
    targetType: "team_member",
    targetLabel: target?.name,
  });

  return NextResponse.json({ ok: true });
}