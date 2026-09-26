import type { Metadata } from "next";

import { auth } from "@/auth";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/footer/Footer";
import { FeedbackSubmit, FeedbackSidebar } from "@/components/feedback/FeedbackSubmit";
import { appBaseUrl } from "@/lib/base-url";

export const metadata: Metadata = {
  title: "Feedback | Language Hub",
  description:
    "Share your feedback with the Language Hub team — courses, teaching, website, fees and suggestions. Every note is read and shapes what we do.",
  alternates: { canonical: `${appBaseUrl()}/feedback` },
};

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  const session = await auth();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-site pt-[4.25rem]">
        <div className="mx-auto max-w-5xl px-5 py-12 lg:px-8 lg:py-16">
          <header className="max-w-2xl">
            <p className="flex items-center gap-3 font-display text-[0.66rem] font-bold uppercase tracking-[0.36em] text-indigo-600">
              <span aria-hidden className="h-px w-8 bg-indigo-500/50" /> Feedback
            </p>
            <h1 className="mt-3 font-display text-[clamp(2rem,5vw,3rem)] font-extrabold tracking-[-0.03em] text-slate-900">
              We&apos;re <span className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">listening.</span>
            </h1>
            <p className="mt-3 text-[1rem] leading-relaxed text-slate-500">
              A word or two from you — about a class, the courses, the website, anything — goes straight to the
              Language Hub team and genuinely changes how we work.
            </p>
          </header>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
            <FeedbackSubmit name={session?.user?.name ?? undefined} email={session?.user?.email ?? undefined} />
            <FeedbackSidebar />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}