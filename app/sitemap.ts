import type { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";
import { appBaseUrl } from "@/lib/base-url";
import { FALLBACK_COURSES, courseSlug } from "@/lib/course-data";
import { SUCCESS_STORY_SLUGS } from "@/lib/content";

/** Sitemap is rebuilt at most every 5 minutes — news posts rarely change. */
export const dynamic = "force-dynamic";
export const revalidate = 300;

const getNewsUrlsCached = unstable_cache(
  async (): Promise<{ slug: string; publishedAt: string }[]> => {
    const { getNewsPostsCollection } = await import("@/lib/db");
    const news = await getNewsPostsCollection();
    const posts = await news
      .find({ published: true })
      .project({ slug: 1, publishedAt: 1, updatedAt: 1 })
      .sort({ publishedAt: -1 })
      .limit(100)
      .toArray();
    return posts.map((p) => ({
      slug: p.slug,
      publishedAt: (p.publishedAt ?? p.updatedAt ?? new Date()).toISOString(),
    }));
  },
  ["sitemap-news"],
  { revalidate: 300, tags: ["news"] }
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = appBaseUrl();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/reset-password`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/news`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/team`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/success-stories`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/placement-test`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/refund-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    ...FALLBACK_COURSES.map((c) => ({
      url: `${base}/courses/${courseSlug(c.name)}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];

  const newsPages: MetadataRoute.Sitemap = (await getNewsUrlsCached()).map((p) => ({
    url: `${base}/news/${p.slug}`,
    lastModified: p.publishedAt,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  const storyPages: MetadataRoute.Sitemap = SUCCESS_STORY_SLUGS.map((slug) => ({
    url: `${base}/success-stories/${slug}`,
    lastModified: now,
    changeFrequency: "yearly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...newsPages, ...storyPages];
}