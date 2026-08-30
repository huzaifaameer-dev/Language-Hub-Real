import type { Metadata, Viewport } from "next";
import { Inter, Manrope, Playfair_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { ErrorReporter } from "@/components/ErrorReporter";
import { PwaInit } from "@/components/PwaInit";
import { SiteAnalytics } from "@/components/analytics/SiteAnalytics";

const analyticsUrl =
  (process.env.ANALYTICS_SCRIPT_URL ?? "").trim() ||
  (process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT_URL ?? "").trim();

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["italic", "normal"],
  display: "swap",
});

const baseUrl =
  (process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000").replace(/\/+$/, "");

const title = "Language Hub | Hub of Language Excellence";
const description =
  "Language Hub helps learners develop English fluency, confidence, communication skills and creative expression through practical and interactive learning.";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": ["EducationalOrganization", "LocalBusiness"],
  name: "Language Hub",
  alternateName: "Language Hub Academy",
  description,
  url: baseUrl,
  logo: `${baseUrl}/opengraph-image`,
  image: `${baseUrl}/opengraph-image`,
  founder: { "@type": "Person", name: "Javeria Malik" },
  email: process.env.ACADEMY_EMAIL ?? undefined,
  knowsAbout: ["Spoken English", "IELTS preparation", "PTE preparation", "Duolingo English Test"],
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      opens: "10:00",
      closes: "20:00",
    },
  ],
};

export const metadata: Metadata = {
  title,
  description,
  metadataBase: new URL(baseUrl),
  applicationName: "Language Hub",
  category: "education",
  authors: [{ name: "Javeria Malik" }],
  creator: "Language Hub",
  keywords: [
    "Language Hub",
    "Spoken English",
    "IELTS preparation",
    "PTE preparation",
    "Duolingo English",
    "English fluency",
    "English communication",
    "Javeria Malik",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description,
    type: "website",
    url: baseUrl,
    locale: "en_US",
    siteName: "Language Hub",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#faf8f4",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${manrope.variable} ${playfair.variable}`}
    >
      <body className="min-h-screen bg-ivory font-sans text-ink antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <Providers>{children}</Providers>
        <ErrorReporter />
        <PwaInit enabled={process.env.NODE_ENV === "production"} />
        <SiteAnalytics />
        {analyticsUrl ? (
          <Script
            src={analyticsUrl}
            strategy="afterInteractive"
            data-domain={process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN ?? undefined}
          />
        ) : null}
      </body>
    </html>
  );
}
