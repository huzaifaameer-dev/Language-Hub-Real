import type { Metadata } from "next";

import { ensureIndexesAndAdmin, getTestimonialsCollection } from "@/lib/db";
import { SuccessStoriesBoard, type Story } from "@/components/success-stories/SuccessStoriesBoard";

export const metadata: Metadata = {
  title: "Success Stories | Language Hub",
  description:
    "Real results from Language Hub students — IELTS, PTE, Spoken English and Writing success stories with measurable outcomes.",
};

export const dynamic = "force-dynamic";
export const revalidate = 300;

/** Stories are read directly from the testimonials pool (admin-managed) and
 *  server-rendered into the page HTML — no client fetch, no loading spinner,
 *  fast even on a cold serverless instance. */
async function getStories(): Promise<Story[]> {
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
}

export default async function SuccessStoriesPage() {
  const stories = await getStories();
  return <SuccessStoriesBoard stories={stories} />;
}