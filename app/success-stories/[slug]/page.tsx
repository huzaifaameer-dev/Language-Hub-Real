import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle, Play, Quote, Star } from "lucide-react";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/footer/Footer";
import { SUCCESS_STORIES } from "@/lib/content";
import { appBaseUrl } from "@/lib/base-url";
import { whatsappLink } from "@/lib/content";

const baseUrl = appBaseUrl();

function resolveStory(slug: string) {
  return SUCCESS_STORIES.find((s) => s.slug === slug);
}

export function generateStaticParams() {
  return SUCCESS_STORIES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const story = resolveStory(slug);
  if (!story) return { title: "Success Story Not Found | Language Hub" };

  return {
    title: `${story.name} — ${story.course} Success Story | Language Hub`,
    description: `${story.name} went from "${story.before}" to "${story.after}". Read their full Language Hub success story.`,
    alternates: { canonical: `${baseUrl}/success-stories/${story.slug}` },
    openGraph: {
      title: `${story.name} — ${story.course} Success Story`,
      description: story.headline,
      url: `${baseUrl}/success-stories/${story.slug}`,
      siteName: "Language Hub",
      type: "article",
    },
  };
}

export default async function SuccessStoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const story = resolveStory(slug);
  if (!story) notFound();

  const whatsapp = whatsappLink(
    `Hi Language Hub! I read ${story.name}'s success story about ${story.course} — I'd like to know more about this path.`
  );

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: story.name,
    description: story.headline,
    jobTitle: story.role,
    knowsAbout: story.course,
    review: {
      "@type": "Review",
      reviewBody: story.recommendation,
      reviewRating: {
        "@type": "Rating",
        ratingValue: 5,
        bestRating: 5,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <Navbar />
      <div className="min-h-screen bg-[#faf8f4] pt-[4.25rem]">
        <div className="mx-auto max-w-3xl px-5 py-12 lg:px-8">
          <Link
            href="/success-stories"
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-white/70 px-4 py-2 font-display text-[0.72rem] font-bold text-ink-2 transition-all hover:border-brand/45 hover:text-brand-deep"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All success stories
          </Link>

          {/* Header */}
          <header className="mt-8">
            <div className="flex items-center gap-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-magenta font-display text-xl font-extrabold text-white">
                {story.name.charAt(0)}
              </span>
              <div>
                <p className="font-display text-[0.62rem] font-bold uppercase tracking-[0.3em] text-brand-deep">
                  {story.role}
                </p>
                <h1 className="mt-1 font-display text-[clamp(1.5rem,4vw,2.2rem)] font-extrabold tracking-[-0.02em] text-ink">
                  {story.name}&apos;s {story.course} story
                </h1>
              </div>
            </div>
            <p className="mt-5 font-serif text-[1.15rem] italic leading-relaxed text-ink-2">
              “{story.headline}”
            </p>
          </header>

          {/* Video embed */}
          {story.videoProvider === "youtube" && story.videoUrl ? (
            <section className="mt-8">
              <div className="overflow-hidden rounded-2xl border border-ink/10 bg-ink/5 shadow-[0_20px_60px_-20px_rgb(15_23_42/0.15)]">
                <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                  <iframe
                    src={story.videoUrl}
                    title={`${story.name} video testimonial`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full"
                  />
                </div>
              </div>
            </section>
          ) : story.videoProvider === "mp4" && story.videoUrl ? (
            <section className="mt-8 flex items-center gap-3 rounded-2xl border border-brand/15 bg-brand/[0.04] p-4">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-brand/10 text-brand-deep">
                <Play className="h-5 w-5 fill-current" />
              </span>
              <p className="text-[0.9rem] text-ink-2">
                Video testimonial available — watch {story.name} tell their story.
              </p>
            </section>
          ) : null}

          {/* Before / After */}
          <section className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-6">
              <p className="font-display text-[0.6rem] font-bold uppercase tracking-[0.26em] text-rose-500">Before</p>
              <p className="mt-2 text-[0.95rem] font-medium text-ink-2">{story.before}</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6">
              <p className="font-display text-[0.6rem] font-bold uppercase tracking-[0.26em] text-emerald-600">After</p>
              <p className="mt-2 text-[0.95rem] font-bold text-emerald-800">{story.after}</p>
            </div>
          </section>

          {/* Story narrative */}
          <section className="mt-8">
            <h2 className="font-display text-[1.3rem] font-extrabold text-ink">Their journey</h2>
            <div className="mt-4 flex flex-col gap-4">
              {story.story.map((para, i) => (
                <p key={i} className="text-[1rem] leading-relaxed text-ink-2">
                  {para}
                </p>
              ))}
            </div>
          </section>

          {/* Highlights */}
          <section className="mt-8 rounded-2xl border border-brand/15 bg-white p-6">
            <h2 className="font-display text-[1.1rem] font-extrabold text-ink">Key results</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {story.highlights.map((h) => (
                <li key={h} className="flex items-start gap-3 text-[0.92rem] text-ink-2">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle className="h-3 w-3" />
                  </span>
                  {h}
                </li>
              ))}
            </ul>
          </section>

          {/* Recommendation */}
          <section className="mt-8">
            <div className="flex items-center gap-1 text-gold" aria-hidden>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <blockquote className="relative mt-4 rounded-2xl bg-ink p-7 text-ivory">
              <Quote className="absolute -left-2 -top-4 h-9 w-9 text-gold/40" aria-hidden />
              <p className="font-serif text-[1.1rem] italic leading-relaxed">
                “{story.recommendation}”
              </p>
              <p className="mt-4 font-display text-[0.78rem] font-bold text-gold-light">
                — {story.name}
              </p>
            </blockquote>
          </section>

          {/* CTA */}
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-brand-deep to-brand-magenta px-8 font-display text-[0.9rem] font-bold text-white shadow-[0_16px_40px_-16px_rgb(110_90_224/0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110"
            >
              Start your {story.course} journey <ArrowRight className="h-4 w-4" />
            </Link>
            {whatsapp ? (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-8 font-display text-[0.9rem] font-bold text-emerald-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-100"
              >
                Ask about this path
              </a>
            ) : null}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
