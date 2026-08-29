import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const baseUrl = () =>
  (process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000").replace(/\/+$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const base = baseUrl();
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/reset-password`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}