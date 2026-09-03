import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { requireAdmin, isValidObjectId } from "@/lib/admin-guard";
import { ensureIndexesAndAdmin, getTestimonialsCollection } from "@/lib/db";
import { TestimonialSchema } from "@/lib/validate";
import { revalidateTag } from "next/cache";
import { z } from "zod";

const PatchSchema = z.object({
  id: z.string().min(1),
  payload: TestimonialSchema.partial().extend({
    active: z.boolean().optional(),
    order: z.number().int().min(0).optional(),
  }),
});

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  await ensureIndexesAndAdmin();
  const col = await getTestimonialsCollection();
  const docs = await col.find({}).sort({ order: 1 }).limit(200).toArray();

  const list = docs.map((d) => ({
    id: String(d._id),
    name: d.name,
    role: d.role,
    quote: d.quote,
    outcome: d.outcome,
    course: d.course,
    active: d.active,
    order: d.order,
    createdAt: d.createdAt.toISOString(),
  }));

  return NextResponse.json({ testimonials: list });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const parsed = TestimonialSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 }
    );
  }

  await ensureIndexesAndAdmin();
  const col = await getTestimonialsCollection();
  const count = await col.countDocuments({});
  const now = new Date();
  const data = parsed.data;

  const result = await col.insertOne({
    name: data.name.trim(),
    role: data.role,
    quote: data.quote.trim(),
    outcome: data.outcome,
    course: data.course.trim(),
    active: true,
    order: count,
    createdAt: now,
    updatedAt: now,
  });

  revalidateTag("catalog", { expire: 0 });
  return NextResponse.json({ id: String(result.insertedId), ok: true }, { status: 201 });
}

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
  const col = await getTestimonialsCollection();
  const update: Record<string, unknown> = { updatedAt: new Date() };
  for (const [k, v] of Object.entries(parsed.data.payload)) {
    if (v !== undefined) update[k] = v;
  }

  const result = await col.updateOne({ _id: new ObjectId(parsed.data.id) }, { $set: update });
  if (result.matchedCount === 0) {
    return NextResponse.json({ message: "Record not found." }, { status: 404 });
  }

  revalidateTag("catalog", { expire: 0 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") ?? "";
  if (!isValidObjectId(id)) {
    return NextResponse.json({ message: "Invalid record id." }, { status: 400 });
  }

  await ensureIndexesAndAdmin();
  const col = await getTestimonialsCollection();
  await col.deleteOne({ _id: new ObjectId(id) });

  revalidateTag("catalog", { expire: 0 });
  return NextResponse.json({ ok: true });
}
