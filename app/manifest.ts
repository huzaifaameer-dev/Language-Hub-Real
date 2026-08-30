import type { MetadataRoute } from "next";

const baseUrl = (process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000").replace(/\/+$/, "");

export default function manifest(): MetadataRoute.Manifest {
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
    icons: [
      {
        src: "/icon.png",
        sizes: "256x256",
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