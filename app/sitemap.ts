import type { MetadataRoute } from "next";
import { appBaseUrl } from "@/lib/base-url";
import { FALLBACK_COURSES, courseSlug } from "@/lib/course-data";
import { listPublishedPosts } from "@/lib/server/blog";

/** Sitemap is rebuilt at most every 5 minutes. */
export const dynamic = "force-dynamic";
export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = appBaseUrl();
  const now = new Date();

  const posts = await listPublishedPosts({ limit: 48 }).catch(() => []);

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/courses`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/team`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/success-stories`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/placement-test`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/feedback`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/refund-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    ...FALLBACK_COURSES.map((c) => ({
      url: `${base}/courses/${courseSlug(c.name)}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...posts.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.publishedAt ? new Date(p.publishedAt) : now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];

  return staticPages;
}
