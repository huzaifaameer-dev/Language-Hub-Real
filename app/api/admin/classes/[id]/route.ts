import { NextResponse } from "next/server";

import { requireAdmin, isValidId } from "@/lib/admin-guard";
import { audit } from "@/lib/server/admin";
import { deleteLiveClass } from "@/lib/server/learner";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const { id } = await ctx.params;
  if (!isValidId(id)) return NextResponse.json({ message: "Invalid id." }, { status: 400 });

  await deleteLiveClass(id);

  await audit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "admin.class_deleted",
    targetType: "live_class",
    targetId: id,
  });

  return NextResponse.json({ ok: true });
}
