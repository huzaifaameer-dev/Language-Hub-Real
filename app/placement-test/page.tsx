import type { Metadata } from "next";
import { appBaseUrl } from "@/lib/base-url";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/footer/Footer";
import { PlacementTestClient } from "./PlacementTestClient";

const baseUrl = appBaseUrl();

export const metadata: Metadata = {
  title: "Free English Level Test | Language Hub",
  description:
    "Take a free 10-minute English placement test and discover the right course for your level. Grammar, vocabulary, reading and sentence structure assessment.",
  alternates: { canonical: `${baseUrl}/placement-test` },
  openGraph: {
    title: "Free English Level Test — Language Hub",
    description:
      "Take a free 10-minute English placement test and discover the right course for your level.",
    url: `${baseUrl}/placement-test`,
    siteName: "Language Hub",
    type: "website",
  },
};

const placementTestJsonLd = {
  "@context": "https://schema.org",
  "@type": "Quiz",
  name: "Free English Level Placement Test",
  description:
    "A 10-minute self-service English placement test covering grammar, vocabulary, reading comprehension and sentence structure.",
  provider: {
    "@type": "EducationalOrganization",
    name: "Language Hub",
    url: baseUrl,
  },
  educationalLevel: "Beginner to Advanced",
  timeRequired: "PT10M",
  numberOfQuestions: 20,
  assessment: {
    "@type": "EducationalOccupationalCredential",
    credentialCategory: "placement",
  },
};

export default function PlacementTestPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(placementTestJsonLd) }}
      />
      <Navbar />
      <div className="min-h-screen bg-[#faf8f4] pt-[4.25rem]">
        <PlacementTestClient />
      </div>
      <Footer />
    </>
  );
}
