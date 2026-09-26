import type { Metadata, Viewport } from "next";
import { Caveat, Inter, Manrope, Playfair_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ErrorReporter } from "@/components/ErrorReporter";
import { PwaInit } from "@/components/PwaInit";
import { SiteAnalytics } from "@/components/analytics/SiteAnalytics";
import { CONTACT, COURSE_CARDS, FAQS, OPENING_HOURS } from "@/lib/content";
import { appBaseUrl } from "@/lib/base-url";

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

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  display: "swap",
});

const baseUrl = appBaseUrl();

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
  founder: { "@type": "Person", name: "Javaria Malik" },
  email: CONTACT.email || undefined,
  telephone: CONTACT.phone || undefined,
  ...(CONTACT.address || CONTACT.city
    ? {
        address: {
          "@type": "PostalAddress",
          ...(CONTACT.address ? { streetAddress: CONTACT.address } : {}),
          addressLocality: CONTACT.city,
        },
      }
    : {}),
  knowsAbout: ["Spoken English", "IELTS preparation", "PTE preparation", "Duolingo English Test"],
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: OPENING_HOURS.daysOfWeek,
      opens: OPENING_HOURS.isoFrom,
      closes: OPENING_HOURS.isoTo,
    },
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Programmes",
    itemListElement: COURSE_CARDS.map((c) => ({
      "@type": "Offer",
      name: c.info.name,
      description: c.info.description,
      category: "course",
      price: c.info.fee,
      priceCurrency: c.info.currency,
      eligibleRegion: { "@type": "Country", name: CONTACT.city || "Pakistan" },
    })),
  },
};

const coursesJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Language Hub Programmes",
  itemListElement: COURSE_CARDS.map((c, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Course",
      name: c.info.name,
      description: c.info.description,
      provider: {
        "@type": "EducationalOrganization",
        name: "Language Hub",
        url: baseUrl,
      },
      offers: {
        "@type": "Offer",
        price: c.info.fee,
        priceCurrency: c.info.currency,
        priceValidUntil: new Date(new Date().getFullYear() + 1, 11, 31).toISOString().slice(0, 10),
      },
    },
  })),
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export const metadata: Metadata = {
  title,
  description,
  metadataBase: new URL(baseUrl),
  applicationName: "Language Hub",
  category: "education",
  authors: [{ name: "Javaria Malik" }],
  creator: "Language Hub",
  keywords: [
    "Language Hub",
    "Spoken English",
    "IELTS preparation",
    "PTE preparation",
    "Duolingo English",
    "English fluency",
    "English communication",
    "Javaria Malik",
  ],
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      "en-US": "/",
      ur: "/?lang=ur",
      "ur-PK": "/?lang=ur",
      "x-default": "/",
    },
  },
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
      className={`${inter.variable} ${manrope.variable} ${playfair.variable} ${caveat.variable}`}
    >
      <body className="min-h-screen bg-ivory font-sans text-ink antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){function silent(t){try{var e=new Error(t);if(/reportAllChanges|startTime/.test(t))return true}catch(_){}return false}var d=window.addEventListener||function(){};d.call(window,"error",function(e){var m=e&&e.message?String(e.message):"";if(/reportAllChanges/.test(m)||(m.indexOf("startTime")>-1)){try{e.preventDefault()}catch(_){}}},true)})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(coursesJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <Providers>
          <LanguageProvider>{children}</LanguageProvider>
        </Providers>
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
