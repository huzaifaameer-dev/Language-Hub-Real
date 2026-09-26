import type { Metadata } from "next";
import { NextResponse } from "next/server";
import { ensureIndexesAndAdmin, getTestimonialsCollection } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Success stories come from the same testimonials pool as the homepage and
 *  reviews section — one source of truth maintained in the admin panel. */
const getStories = async () => {
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
    image: d.image ?? null,
  }));
};

export async function GET() {
  const stories = await getStories();
  return NextResponse.json(
    { stories },
    {
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=120",
      },
    }
  );
}