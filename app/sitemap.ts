import type { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";
import { appBaseUrl } from "@/lib/base-url";
import { FALLBACK_COURSES, courseSlug } from "@/lib/course-data";
import { SUCCESS_STORY_SLUGS } from "@/lib/content";

/** Sitemap is rebuilt at most every 5 minutes — blog posts rarely change. */
export const revalidate = 300;

const getBlogUrlsCached = unstable_cache(
  async (): Promise<{ slug: string; publishedAt: string; tags: string[] }[]> => {
    const { getBlogCollection } = await import("@/lib/db");
    const blog = await getBlogCollection();
    const posts = await blog
      .find({ published: true })
      .project({ slug: 1, publishedAt: 1, updatedAt: 1, tags: 1 })
      .sort({ publishedAt: -1 })
      .limit(100)
      .toArray();
    return posts.map((p) => ({
      slug: p.slug,
      publishedAt: (p.publishedAt ?? p.updatedAt ?? new Date()).toISOString(),
      tags: p.tags ?? [],
    }));
  },
  ["sitemap-blog"],
  { revalidate: 300, tags: ["blog"] }
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = appBaseUrl();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/reset-password`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
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

  const blogPages: MetadataRoute.Sitemap = (await getBlogUrlsCached()).map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: p.publishedAt,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const storyPages: MetadataRoute.Sitemap = SUCCESS_STORY_SLUGS.map((slug) => ({
    url: `${base}/success-stories/${slug}`,
    lastModified: now,
    changeFrequency: "yearly" as const,
    priority: 0.7,
  }));

  // Blog category / tag archive URLs.
  const tagSet = new Set<string>();
  for (const p of await getBlogUrlsCached()) {
    for (const t of p.tags) {
      tagSet.add(t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
    }
  }
  const tagPages: MetadataRoute.Sitemap = Array.from(tagSet)
    .filter(Boolean)
    .map((tag) => ({
      url: `${base}/blog/tag/${tag}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

  return [...staticPages, ...blogPages, ...storyPages, ...tagPages];
}
