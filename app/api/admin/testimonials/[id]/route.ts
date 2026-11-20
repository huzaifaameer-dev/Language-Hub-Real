import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin, isValidId } from "@/lib/admin-guard";
import { audit } from "@/lib/server/admin";
import { deleteTestimonial, updateTestimonial } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

const PatchSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  role: z.string().trim().max(80).optional(),
  course: z.string().trim().max(120).optional(),
  quote: z.string().trim().min(10).max(1200).optional(),
  outcome: z.string().trim().max(200).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
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

  await updateTestimonial(id, parsed.data);
  await audit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "admin.testimonial_updated",
    targetType: "testimonial",
    targetId: id,
    meta: parsed.data,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const { id } = await ctx.params;
  if (!isValidId(id)) return NextResponse.json({ message: "Invalid id." }, { status: 400 });

  await deleteTestimonial(id);
  await audit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "admin.testimonial_deleted",
    targetType: "testimonial",
    targetId: id,
  });

  return NextResponse.json({ ok: true });
}
