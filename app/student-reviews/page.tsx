import type { Metadata } from "next";
import { BadgeCheck, Camera, Clock3, Sparkles, Star } from "lucide-react";

import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/footer/Footer";
import { ReviewGuidance, StudentReviewForm } from "@/components/reviews/StudentReviewForm";
import { appBaseUrl } from "@/lib/base-url";

export const metadata: Metadata = {
  title: "Share your review | Language Hub",
  description:
    "Studied with Language Hub? Share your honest review with a profile photo and star rating. Every submission is checked by our team and can appear on the website.",
  alternates: { canonical: `${appBaseUrl()}/student-reviews` },
  robots: { index: false, follow: false },
  openGraph: {
    title: "Share your review | Language Hub",
    description:
      "Add your photo, rating and story — real reviews from real students, published on the Language Hub website.",
    url: `${appBaseUrl()}/student-reviews`,
    type: "website",
  },
};

export default function StudentReviewsPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-site pt-[4.25rem]">
        <div className="mx-auto max-w-6xl px-5 py-11 lg:px-8 lg:py-16">
          <header className="mx-auto max-w-3xl text-center">
            <span className="eyebrow-ref eyebrow-ref-center">Student reviews</span>
            <h1 className="mt-4 font-display text-[clamp(2.05rem,5.2vw,3.15rem)] font-extrabold tracking-[-0.035em] text-[#10231f]">
              Your words,{" "}
              <span className="bg-gradient-to-r from-[#0f6b5c] to-[#14a08c] bg-clip-text text-transparent">
                on the record.
              </span>
            </h1>
            <p className="mx-auto mt-3 max-w-2xl font-sans text-[1rem] leading-relaxed text-[#44615a]">
              Tell the next student what studying here was really like. Add a photo, rate your
              experience, and we&apos;ll put your story in front of thousands of learners.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              {[
                { icon: Clock3, label: "About 2 minutes" },
                { icon: Camera, label: "Photo + star rating" },
                { icon: BadgeCheck, label: "Checked by our team" },
                { icon: Star, label: "Published with your name" },
              ].map((chip) => (
                <span
                  key={chip.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#d7f0e9] bg-white px-3.5 py-2 font-sans text-[0.72rem] font-semibold text-[#315a50] shadow-[0_10px_24px_-22px_rgba(10,78,67,0.5)]"
                >
                  <chip.icon className="h-3.5 w-3.5 text-[#0d6a58]" strokeWidth={2.2} />
                  {chip.label}
                </span>
              ))}
            </div>
          </header>

          <div className="mt-11 grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-start">
            <StudentReviewForm />
            <aside className="lg:sticky lg:top-24">
              <div className="mb-4 flex items-center gap-2 rounded-2xl border border-[#f6dfd5] bg-[#fff7f2] px-4 py-3">
                <Sparkles className="h-4 w-4 shrink-0 text-[#d9532f]" />
                <p className="font-sans text-[0.76rem] leading-relaxed text-[#8a4a34]">
                  <b className="text-[#7c3a24]">Reviews with a photo get 4× more reads.</b> It only
                  takes a minute to add one.
                </p>
              </div>
              <ReviewGuidance />
            </aside>
          </div>

          <p className="mx-auto mt-12 max-w-2xl text-center font-sans text-[0.76rem] leading-relaxed text-[#8ba19b]">
            By submitting a review you confirm it reflects your own experience. We may trim
            typos or remove anything abusive. Want it taken down later? Email the team and
            we&apos;ll remove it within one working day.
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
