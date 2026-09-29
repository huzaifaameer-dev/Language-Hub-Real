import type { MetadataRoute } from "next";
import { appBaseUrl } from "@/lib/base-url";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin-panel", "/dashboard", "/api/"] }],
    sitemap: `${appBaseUrl()}/sitemap.xml`,
    host: appBaseUrl(),
  };
}