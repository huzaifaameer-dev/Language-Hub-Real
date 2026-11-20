import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin, isValidId } from "@/lib/admin-guard";
import { audit } from "@/lib/server/admin";
import { setFeedbackStatus } from "@/lib/server/learner";

export const dynamic = "force-dynamic";

const PatchSchema = z.object({
  status: z.enum(["NEW", "REVIEWED", "ARCHIVED"]),
});

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const { id } = await ctx.params;
  if (!isValidId(id)) return NextResponse.json({ message: "Invalid id." }, { status: 400 });

  const parsed = PatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 }
    );
  }

  await setFeedbackStatus(id, parsed.data.status);
  await audit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "admin.feedback_updated",
    targetType: "feedback",
    targetId: id,
    meta: { status: parsed.data.status },
  });

  return NextResponse.json({ ok: true });
}
