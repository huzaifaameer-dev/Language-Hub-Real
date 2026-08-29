import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const baseUrl = () =>
  (process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000").replace(/\/+$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin-panel", "/dashboard", "/api/"] }],
    sitemap: `${baseUrl()}/sitemap.xml`,
    host: baseUrl(),
  };
}