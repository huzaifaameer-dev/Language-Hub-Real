import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Play, Star } from "lucide-react";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/footer/Footer";
import { SUCCESS_STORIES } from "@/lib/content";
import { appBaseUrl } from "@/lib/base-url";

const baseUrl = appBaseUrl();

export const metadata: Metadata = {
  title: "Student Success Stories | Language Hub",
  description:
    "Real before/after results from Language Hub students — band scores, DET scores, and speaking confidence transformed. See the measurable outcomes.",
  alternates: { canonical: `${baseUrl}/success-stories` },
  openGraph: {
    title: "Student Success Stories — Language Hub",
    description: "Real before/after results from Language Hub students.",
    url: `${baseUrl}/success-stories`,
    siteName: "Language Hub",
    type: "website",
  },
};

const successJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Language Hub Student Success Stories",
  itemListElement: SUCCESS_STORIES.map((s, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Person",
      name: s.name,
      description: s.headline,
      knowsAbout: s.course,
    },
  })),
};

export default function SuccessStoriesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(successJsonLd) }}
      />
      <Navbar />
      <div className="min-h-screen bg-[#faf8f4] pt-[4.25rem]">
        <div className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
          <header className="text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-4 py-1.5 font-display text-[0.62rem] font-bold uppercase tracking-[0.24em] text-brand-deep">
              <Star className="h-3 w-3" /> Success stories
            </p>
            <h1 className="mt-4 font-display text-[clamp(2rem,5vw,3rem)] font-extrabold tracking-[-0.03em] text-ink">
              Students who <span className="brand-text">made it.</span>
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-[1rem] leading-relaxed text-ink-2">
              Real learners with real, measurable results. Here are the before-and-after stories
              of students who trusted the Language Hub method.
            </p>
          </header>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {SUCCESS_STORIES.map((s) => (
              <Link
                key={s.slug}
                href={`/success-stories/${s.slug}`}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink/[0.08] bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-brand/25 hover:shadow-[0_24px_50px_-30px_rgb(15_23_42/0.3)]"
              >
                {s.videoProvider !== "none" ? (
                  <div className="mb-5 flex items-center gap-1.5">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-brand/10 text-brand-deep">
                      <Play className="h-3.5 w-3.5 fill-current" />
                    </span>
                    <span className="font-mono text-[0.6rem] font-bold uppercase tracking-widest text-brand-deep">
                      Video story
                    </span>
                  </div>
                ) : null}

                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand/20 to-brand-magenta/20 font-display text-sm font-extrabold text-brand-deep">
                    {s.name.charAt(0)}
                  </span>
                  <div>
                    <p className="font-display text-[0.92rem] font-extrabold text-ink">{s.name}</p>
                    <p className="font-display text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-3">{s.course}</p>
                  </div>
                </div>

                <h3 className="mt-4 font-display text-[1.05rem] font-extrabold leading-snug text-ink">
                  “{s.headline}”
                </h3>

                {/* Before / after */}
                <div className="mt-5 flex flex-col gap-2 rounded-xl bg-[#faf8f4] p-4">
                  <div className="flex items-center justify-between gap-2 text-[0.78rem]">
                    <span className="font-display text-[0.58rem] font-bold uppercase tracking-[0.16em] text-rose-500">Before</span>
                    <span className="text-right text-ink-2 line-through decoration-rose-300">{s.before}</span>
                  </div>
                  <div className="h-px w-full bg-ink/[0.08]" />
                  <div className="flex items-center justify-between gap-2 text-[0.78rem]">
                    <span className="font-display text-[0.58rem] font-bold uppercase tracking-[0.16em] text-emerald-600">After</span>
                    <span className="text-right font-semibold text-emerald-700">{s.after}</span>
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between pt-6">
                  <span className="font-display text-[0.78rem] font-bold text-brand-deep group-hover:underline">
                    Read their story
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
