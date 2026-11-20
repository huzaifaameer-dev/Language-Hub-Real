import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin-guard";
import { audit } from "@/lib/server/admin";
import {
  createCourse,
  listCourses,
  toCourseInfo,
  updateCourse,
} from "@/lib/server/catalog";
import { q } from "@/lib/server/pg";

export const dynamic = "force-dynamic";

/** Every programme (including inactive) with live enrolment counts. */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const [records, usage] = await Promise.all([
    listCourses(false),
    q<{ course_slug: string; n: number }>(
      `SELECT course_slug, COUNT(*)::INT AS n
         FROM enrollments WHERE status IN ('ACTIVE','PAUSED')
        GROUP BY course_slug`
    ),
  ]);

  const enrolled = new Map(usage.map((u) => [u.course_slug, Number(u.n)]));

  return NextResponse.json({
    courses: records.map((record) => ({
      slug: record.slug,
      ...toCourseInfo(record),
      active: record.active,
      sortOrder: record.sortOrder,
      enrolled: enrolled.get(record.slug) ?? 0,
    })),
  });
}

const CreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().max(120).optional(),
  tagline: z.string().trim().max(300).optional(),
  description: z.string().trim().max(4000).optional(),
  duration: z.string().trim().max(80).optional(),
  schedule: z.string().trim().max(160).optional(),
  teacher: z.string().trim().max(120).optional(),
  fee: z.number().int().min(0).max(10_000_000).optional(),
  icon: z.string().trim().max(40).optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

/** Creates a programme. The slug is derived from the name and kept unique. */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const parsed = CreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 }
    );
  }

  const slug = await createCourse(parsed.data);
  await audit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "admin.course_created",
    targetType: "course",
    targetId: slug,
    meta: { name: parsed.data.name },
  });

  return NextResponse.json({ ok: true, slug }, { status: 201 });
}

const PatchSchema = z.object({
  slug: z.string().trim().min(1).max(120),
  name: z.string().trim().min(2).max(120).optional(),
  tagline: z.string().trim().max(300).optional(),
  description: z.string().trim().max(4000).optional(),
  duration: z.string().trim().max(80).optional(),
  schedule: z.string().trim().max(160).optional(),
  fee: z.number().int().min(0).max(10_000_000).optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

/** Updates one programme. Only the supplied fields change. */
export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const parsed = PatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 }
    );
  }

  const { slug, ...patch } = parsed.data;
  await updateCourse(slug, patch);

  await audit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "admin.course_updated",
    targetType: "course",
    targetId: slug,
    meta: patch,
  });

  return NextResponse.json({ ok: true });
}
