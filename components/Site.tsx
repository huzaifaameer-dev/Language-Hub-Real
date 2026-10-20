import { IntroGate } from "@/components/intro/IntroGate";
import { Navbar } from "@/components/navigation/Navbar";
import { Hero } from "@/components/hero/Hero";
import { Stats } from "@/components/about/Stats";
import { Features } from "@/components/philosophy/Features";
import { EnrollmentPath } from "@/components/courses/EnrollmentPath";
import { Courses } from "@/components/courses/Courses";
import { Journey } from "@/components/journey/Journey";
import { Reviews } from "@/components/reviews/Reviews";
import { FounderSpotlight } from "@/components/about/FounderSpotlight";
import { ClosingStrip } from "@/components/contact/ClosingStrip";
import { Footer } from "@/components/footer/Footer";
import { LiveEnrollmentBanner } from "@/components/social-proof/LiveEnrollmentBanner";
import { SupportHelp } from "@/components/support/SupportHelp";

/**
 * Server component: the marketing page is pre-rendered to static HTML.
 * Interactive pieces (intro, nav, per-section motion, live seats/reviews) are
 * client islands — the sections themselves do not ship JS.
 */
export function Site() {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-[130] rounded-full bg-ink px-5 py-2 text-sm text-ivory focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <IntroGate>
        <Navbar />
        <main id="main">
          <Hero />
          <LiveEnrollmentBanner className="mt-6" />
          <Stats />
          <Features />
          <EnrollmentPath />
          <Courses />
          <Journey />
          <Reviews />
          <FounderSpotlight />
          <ClosingStrip />
        </main>
        <SupportHelp />
        <Footer />
      </IntroGate>
    </>
  );
}