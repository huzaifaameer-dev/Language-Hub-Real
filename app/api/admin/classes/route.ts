import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin-guard";
import { audit } from "@/lib/server/admin";
import { createLiveClass, listAllClasses } from "@/lib/server/learner";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const classes = await listAllClasses();
  return NextResponse.json({
    classes: classes.map((c) => ({
      id: c.id,
      title: c.title,
      course: c.course,
      batch: c.batch,
      instructor: c.instructor,
      scheduledAt: c.scheduledAt,
      durationMinutes: c.durationMinutes,
      meetingLink: c.meetingLink,
      platform: c.platform,
    })),
  });
}

const CreateSchema = z.object({
  title: z.string().trim().min(3).max(160),
  courseSlug: z.string().trim().min(1).max(120),
  batch: z.string().trim().max(80).optional(),
  instructor: z.string().trim().max(80).optional(),
  scheduledAt: z.string().trim().min(10).max(40),
  durationMinutes: z.number().int().min(15).max(480).optional(),
  meetingLink: z.url().max(500).optional().or(z.literal("")),
  platform: z.string().trim().max(40).optional(),
});

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

  const when = new Date(parsed.data.scheduledAt);
  if (Number.isNaN(when.getTime())) {
    return NextResponse.json({ message: "Enter a valid class date and time." }, { status: 400 });
  }

  const id = await createLiveClass({
    ...parsed.data,
    scheduledAt: when.toISOString(),
    meetingLink: parsed.data.meetingLink || "",
  });

  await audit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "admin.class_created",
    targetType: "live_class",
    targetId: id,
    meta: { title: parsed.data.title, courseSlug: parsed.data.courseSlug },
  });

  return NextResponse.json({ ok: true, id }, { status: 201 });
}
