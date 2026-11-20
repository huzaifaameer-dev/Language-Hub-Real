import { NextResponse } from "next/server";

import { listTestimonials } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Public testimonials — active rows only, featured first. */
export async function GET() {
  const rows = await listTestimonials(true);
  const testimonials = rows.map((t) => ({
    id: t.id,
    name: t.name,
    role: t.role,
    quote: t.quote,
    outcome: t.outcome,
    course: t.course,
    rating: t.rating,
    featured: t.featured,
    image: t.image,
  }));

  return NextResponse.json(
    { testimonials },
    {
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=120",
      },
    }
  );
}
