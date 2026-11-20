import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-guard";
import {
  countRegistrationsByStatus,
  listRegistrationsAdmin,
} from "@/lib/server/learner";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "ALL";
  const search = url.searchParams.get("search") ?? "";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
  const limit = 20;

  const [{ rows, total }, counts] = await Promise.all([
    listRegistrationsAdmin({ status, search, limit, offset: (page - 1) * limit }),
    countRegistrationsByStatus(),
  ]);

  return NextResponse.json({
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    counts,
    registrations: rows.map((r) => ({
      id: r.id,
      ref: r.ref,
      userId: r.user_id,
      name: r.full_name,
      email: r.email,
      phone: r.phone,
      course: r.course_slug,
      courseKey: r.course_key,
      dob: r.dob,
      address: r.address,
      details: typeof r.details === "string" ? safeJson(r.details) : r.details,
      status: r.status,
      adminNote: r.admin_note,
      hasPhoto: Boolean(r.photo_path),
      hasReceipt: Boolean(r.receipt_path),
      hasPdf: Boolean(r.pdf_path),
      createdAt: new Date(r.created_at).toISOString(),
    })),
  });
}

function safeJson(value: string): Record<string, unknown> {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}
