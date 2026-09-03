import type { MetadataRoute } from "next";
import { appBaseUrl } from "@/lib/base-url";

export default function manifest(): MetadataRoute.Manifest {
  const baseUrl = appBaseUrl();
  return {
    name: "Language Hub | Hub of Language Excellence",
    short_name: "Language Hub",
    description:
      "English fluency, confidence, communication skills and creative expression through practical, interactive learning.",
    id: `${baseUrl}/`,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf8f4",
    theme_color: "#faf8f4",
    categories: ["education", "lifestyle"],
    shortcuts: [
      {
        name: "Courses",
        short_name: "Courses",
        description: "Browse programmes and fees",
        url: "/#courses",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" }],
      },
      {
        name: "Blog",
        short_name: "Blog",
        description: "Learning tips and guides",
        url: "/blog",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" }],
      },
      {
        name: "Dashboard",
        short_name: "Dashboard",
        description: "Track your application and enrollment",
        url: "/dashboard",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" }],
      },
    ],
    screenshots: [
      {
        src: "/opengraph-image",
        sizes: "1200x630",
        type: "image/png",
        form_factor: "wide",
        label: "Language Hub — Hub of Language Excellence",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        form_factor: "narrow",
        label: "Language Hub app icon",
      },
    ],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}