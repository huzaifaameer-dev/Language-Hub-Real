import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin-guard";
import { ensureIndexesAndAdmin, getCoursesCollection } from "@/lib/db";
import type { CourseDoc } from "@/lib/db";
import {
  batchUsageMap,
  courseSeatSummary,
  seatViews,
} from "@/lib/course-stats";
import { getEnrollmentsCollection } from "@/lib/db";
import { publishEvent } from "@/lib/realtime";

export const dynamic = "force-dynamic";

const BatchInput = z.object({
  name: z.string().min(1, "Batch name is required.").max(30).trim(),
  time: z.string().max(60, "Time too long.").trim().default(""),
  seatsTotal: z.coerce.number().int().min(1).max(5000, "Capacity out of range."),
});

const CourseInput = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(80).trim(),
  tagline: z.string().max(160).trim().optional().default(""),
  description: z.string().max(800).trim().optional().default(""),
  fee: z.coerce.number().int().min(0).max(50_000_000, "Fee out of range."),
  duration: z.string().max(40).trim().optional().default(""),
  teacher: z.string().max(80).trim().optional().default(""),
  schedule: z.string().max(80).trim().optional().default(""),
  batches: z.array(BatchInput).min(1, "Add at least one batch.").max(8),
  order: z.coerce.number().int().min(0).max(999).optional().default(99),
  active: z.coerce.boolean().optional().default(true),
});

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  await ensureIndexesAndAdmin();
  const [coursesCol, enrollmentsCol] = await Promise.all([
    getCoursesCollection(),
    getEnrollmentsCollection(),
  ]);

  const [courseDocs, enrolledDocs] = await Promise.all([
    coursesCol.find({}).sort({ order: 1 }).toArray(),
    enrollmentsCol.find({ status: "ENROLLED" }).project({ batch: 1 }).toArray(),
  ]);

  const used = batchUsageMap(enrolledDocs as { batch: string }[]);
  const payload = courseDocs.map((c) => {
    const batches = seatViews(c.batches ?? [], used);
    return {
      id: String(c._id),
      name: c.name,
      tagline: c.tagline,
      description: c.description,
      fee: c.fee,
      currency: c.currency,
      duration: c.duration,
      teacher: c.teacher,
      schedule: c.schedule,
      order: c.order,
      active: c.active,
      batches,
      ...courseSeatSummary(batches),
    };
  });

  return NextResponse.json({ courses: payload });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON." }, { status: 400 });
  }

  const parsed = CourseInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.issues }, { status: 400 });
  }

  await ensureIndexesAndAdmin();
  const courses = await getCoursesCollection();
  const data = parsed.data;
  const now = new Date();

  const duplicate = await courses.findOne({
    name: { $regex: `^${data.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
  });
  if (duplicate) {
    return NextResponse.json(
      { message: "A course with that name already exists." },
      { status: 409 }
    );
  }

  const doc: Omit<CourseDoc, "_id"> = {
    ...data,
    currency: "PKR",
    createdAt: now,
    updatedAt: now,
  };
  const { insertedId } = await courses.insertOne(doc);

  await publishEvent({ table: "courses", at: Date.now() });
  revalidateTag("catalog", { expire: 0 });

  return NextResponse.json(
    { course: { id: String(insertedId), ...doc } },
    { status: 201 }
  );
}