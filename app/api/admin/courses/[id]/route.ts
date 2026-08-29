import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { requireAdmin, isValidObjectId } from "@/lib/admin-guard";
import {
  ensureIndexesAndAdmin,
  getCoursesCollection,
  getEnrollmentsCollection,
} from "@/lib/db";
import { publishEvent } from "@/lib/realtime";

export const dynamic = "force-dynamic";

const BatchInput = z.object({
  name: z.string().min(1, "Batch name is required.").max(30).trim(),
  time: z.string().max(60, "Time too long.").trim().default(""),
  seatsTotal: z.coerce.number().int().min(1).max(5000, "Capacity out of range."),
});

const CoursePatch = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(80).trim().optional(),
  tagline: z.string().max(160).trim().optional(),
  description: z.string().max(800).trim().optional(),
  fee: z.coerce.number().int().min(0).max(50_000_000).optional(),
  duration: z.string().max(40).trim().optional(),
  teacher: z.string().max(80).trim().optional(),
  schedule: z.string().max(80).trim().optional(),
  batches: z.array(BatchInput).min(1).max(8).optional(),
  order: z.coerce.number().int().min(0).max(999).optional(),
  active: z.coerce.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ message: "Bad course id." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON." }, { status: 400 });
  }

  const parsed = CoursePatch.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.issues }, { status: 400 });
  }

  await ensureIndexesAndAdmin();
  const courses = await getCoursesCollection();
  const data = parsed.data;

  const existing = await courses.findOne({ _id: new ObjectId(id) });
  if (!existing) {
    return NextResponse.json({ message: "Course not found." }, { status: 404 });
  }

  if (data.name && data.name !== existing.name) {
    const dup = await courses.findOne({
      name: { $regex: `^${data.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    });
    if (dup) {
      return NextResponse.json(
        { message: "A course with that name already exists." },
        { status: 409 }
      );
    }
  }

  await courses.updateOne(
    { _id: existing._id },
    { $set: { ...data, updatedAt: new Date() } }
  );

  await publishEvent({ table: "courses", at: Date.now() });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ message: "Bad course id." }, { status: 400 });
  }

  await ensureIndexesAndAdmin();
  const courses = await getCoursesCollection();

  const existing = await courses.findOne({ _id: new ObjectId(id) });
  if (!existing) {
    return NextResponse.json({ message: "Course not found." }, { status: 404 });
  }

  // Deleting a course that live enrollments depend on would orphan their seats;
  // hide it instead so past records stay consistent.
  const inUse = await getEnrollmentsCollection().then((c) =>
    c.countDocuments({ status: { $in: ["PENDING", "ENROLLED"] }, subjects: existing.name })
  );

  if (inUse > 0) {
    await courses.updateOne(
      { _id: existing._id },
      { $set: { active: false, updatedAt: new Date() } }
    );
    await publishEvent({ table: "courses", at: Date.now() });
    return NextResponse.json({ ok: true, hidden: true });
  }

  await courses.deleteOne({ _id: existing._id });
  await publishEvent({ table: "courses", at: Date.now() });

  return NextResponse.json({ ok: true, deleted: true });
}