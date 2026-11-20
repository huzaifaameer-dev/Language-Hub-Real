import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin-guard";
import { audit } from "@/lib/server/admin";
import {
  createTestimonial,
  listTestimonials,
} from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const rows = await listTestimonials(false);
  return NextResponse.json({ testimonials: rows });
}

const CreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  role: z.string().trim().max(80).optional(),
  course: z.string().trim().max(120).optional(),
  quote: z.string().trim().min(10).max(1200),
  outcome: z.string().trim().max(200).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  featured: z.boolean().optional(),
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

  const id = await createTestimonial(parsed.data);

  await audit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "admin.testimonial_created",
    targetType: "testimonial",
    targetId: id,
    meta: { name: parsed.data.name },
  });

  return NextResponse.json({ ok: true, id }, { status: 201 });
}
