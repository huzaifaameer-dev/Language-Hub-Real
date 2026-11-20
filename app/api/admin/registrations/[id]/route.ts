import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin, isValidId } from "@/lib/admin-guard";
import { audit } from "@/lib/server/admin";
import {
  enrollUser,
  getRegistration,
  setRegistrationStatus,
} from "@/lib/server/learner";

export const dynamic = "force-dynamic";

const PatchSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "ENROLLED", "REJECTED"]).optional(),
  adminNote: z.string().max(2000).nullable().optional(),
  enroll: z.boolean().optional(),
  batch: z.string().max(80).optional(),
  instructor: z.string().max(80).optional(),
});

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const { id } = await ctx.params;
  if (!isValidId(id)) return NextResponse.json({ message: "Invalid id." }, { status: 400 });

  const reg = await getRegistration(id);
  if (!reg) return NextResponse.json({ message: "Registration not found." }, { status: 404 });

  const parsed = PatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 }
    );
  }

  const { status, adminNote, enroll, batch, instructor } = parsed.data;

  if (status) {
    await setRegistrationStatus(id, status, adminNote ?? null);
  } else if (adminNote !== undefined) {
    await setRegistrationStatus(id, reg.status, adminNote);
  }

  let enrolled = false;
  if (enroll) {
    if (!reg.user_id) {
      return NextResponse.json(
        { message: "This registration is not linked to a learner account." },
        { status: 400 }
      );
    }
    await enrollUser({
      userId: reg.user_id,
      courseSlug: reg.course_slug,
      batch: batch ?? "",
      instructor: instructor ?? "",
    });
    if (reg.status !== "ENROLLED") {
      await setRegistrationStatus(id, "ENROLLED", adminNote ?? null);
    }
    enrolled = true;
  }

  await audit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "admin.registration_updated",
    targetType: "registration",
    targetId: id,
    meta: { status: status ?? reg.status, enrolled },
  });

  return NextResponse.json({ ok: true, enrolled });
}
