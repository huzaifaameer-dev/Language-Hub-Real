import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-guard";
import { getAuditLogCollection } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Admin: recent admin action log (audit trail). */
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit")) || 100));

  const log = await getAuditLogCollection();
  const docs = await log.find({}).sort({ createdAt: -1 }).limit(limit).toArray();

  return NextResponse.json({
    entries: docs.map((d) => ({
      id: String(d._id),
      actor: d.actor,
      action: d.action,
      targetType: d.targetType,
      targetLabel: d.targetLabel ?? null,
      detail: d.detail ?? null,
      createdAt: d.createdAt.toISOString(),
    })),
  });
}