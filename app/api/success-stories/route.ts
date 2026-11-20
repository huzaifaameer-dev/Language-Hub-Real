import { NextResponse } from "next/server";

import { listTestimonials } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

/** Success stories reuse the admin-managed testimonials pool (one source). */
export async function GET() {
  const rows = await listTestimonials(true);
  const stories = rows.map((t) => ({
    id: t.id,
    name: t.name,
    role: t.role,
    quote: t.quote,
    outcome: t.outcome,
    course: t.course,
    image: t.image,
  }));

  return NextResponse.json(
    { stories },
    {
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=120",
      },
    }
  );
}
