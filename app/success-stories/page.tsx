import type { Metadata } from "next";

import { listTestimonials } from "@/lib/server/catalog";
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
  try {
    const rows = await listTestimonials(true);
    return rows.map((d) => ({
      id: d.id,
      name: d.name,
      role: d.role,
      quote: d.quote,
      outcome: d.outcome,
      course: d.course,
      image: d.image,
    }));
  } catch {
    // Database unreachable — show the friendly empty state instead of a 500.
    return [];
  }
}

export default async function SuccessStoriesPage() {
  const stories = await getStories();
  return <SuccessStoriesBoard stories={stories} />;
}