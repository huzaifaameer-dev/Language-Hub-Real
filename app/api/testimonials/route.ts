import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { ensureIndexesAndAdmin, getTestimonialsCollection } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Public testimonials, cached briefly. Returns only active, ordered reviews. */
const getPublicTestimonials = unstable_cache(
  async () => {
    await ensureIndexesAndAdmin();
    const col = await getTestimonialsCollection();
    const docs = await col.find({ active: true }).sort({ order: 1 }).limit(50).toArray();
    return docs.map((d) => ({
      id: String(d._id),
      name: d.name,
      role: d.role,
      quote: d.quote,
      outcome: d.outcome,
      course: d.course,
      featured: !!d.featured,
      image: d.image ?? null,
    }));
  },
  ["public-testimonials"],
  { revalidate: 60, tags: ["catalog"] }
);

export async function GET() {
  const testimonials = await getPublicTestimonials();
  return NextResponse.json(
    { testimonials },
    {
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=120",
      },
    }
  );
}
