import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Feather, PenLine, Sparkles } from "lucide-react";

import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/footer/Footer";
import { Reveal } from "@/components/ui/Reveal";
import { BlogCover, BlogFeed, type BlogCardPost } from "@/components/blog/BlogFeed";
import { formatBlogDate } from "@/lib/blog/format";
import { listPublishedPosts } from "@/lib/server/blog";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "The Journal | Language Hub",
  description:
    "Practical notes on English fluency, IELTS, PTE and confident communication — written by the teachers at Language Hub.",
};

async function getPosts(): Promise<BlogCardPost[]> {
  try {
    return await listPublishedPosts({ limit: 48 });
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getPosts();
  const featured = posts.find((p) => p.featured) ?? posts[0] ?? null;
  const rest = featured ? posts.filter((p) => p.id !== featured.id) : posts;
  const categories = new Set(posts.map((p) => p.category));
  const totalReads = posts.reduce((sum, p) => sum + p.views, 0);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-site pt-[6.4rem]">
        {/* ── hero ─────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-[#edf5f2] bg-[linear-gradient(180deg,#f2fbf7_0%,#f9fdfc_70%,#ffffff_100%)] px-5 pb-14 pt-12 sm:px-8 sm:pb-16 sm:pt-16">
          <span aria-hidden className="pointer-events-none absolute -left-28 -top-20 h-[26rem] w-[26rem] rounded-full bg-[#14a08c]/10 blur-[120px]" />
          <span aria-hidden className="pointer-events-none absolute -right-24 top-24 h-[22rem] w-[22rem] rounded-full bg-[#f5b93c]/12 blur-[120px]" />

          <div className="relative mx-auto max-w-7xl">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <Reveal>
                  <span className="eyebrow-ref">
                    <PenLine className="h-3.5 w-3.5" /> The Language Hub Journal
                  </span>
                </Reveal>
                <Reveal delay={0.06} y={22}>
                  <h1 className="section-title-ref mt-4">
                    Notes from the{" "}
                    <span className="relative inline-block text-[#0f6b5c]">
                      classroom.
                      <svg aria-hidden viewBox="0 0 240 12" fill="none" className="absolute -bottom-1 left-0 h-2 w-full" preserveAspectRatio="none">
                        <path d="M2 8.5C58 4.5 160 4 238 7" stroke="#fb6a47" strokeWidth="2.6" strokeLinecap="round" opacity="0.65" />
                      </svg>
                    </span>
                  </h1>
                </Reveal>
                <Reveal delay={0.12} y={18}>
                  <p className="mt-5 max-w-xl font-sans text-[0.98rem] leading-[1.8] text-ink-2">
                    Practical guidance on fluency, exam strategy and confident communication —
                    written by the teachers who sit beside our learners every week.
                  </p>
                </Reveal>
              </div>

              <Reveal delay={0.16} y={18}>
                <div className="flex flex-wrap gap-3">
                  {[
                    { icon: BookOpen, label: `${posts.length} articles`, note: "Fresh every week" },
                    { icon: Sparkles, label: `${categories.size || 1} topics`, note: "Exam · fluency · life" },
                    { icon: Feather, label: `${totalReads.toLocaleString("en-PK")} reads`, note: "From our community" },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 shadow-[0_18px_40px_-36px_rgba(10,78,67,0.5)]"
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#eaf7f3] text-[#0f6b5c]">
                        <s.icon className="h-4 w-4" strokeWidth={2} />
                      </span>
                      <span>
                        <span className="block font-display text-[0.86rem] font-extrabold text-ink">{s.label}</span>
                        <span className="block font-sans text-[0.66rem] text-ink-3">{s.note}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            {/* featured */}
            {featured && (
              <Reveal delay={0.2} y={26}>
                <Link
                  href={`/blog/${featured.slug}`}
                  className="group mt-10 grid overflow-hidden rounded-[1.9rem] border border-[#e3ede9] bg-white shadow-[0_36px_80px_-50px_rgba(6,46,40,0.5)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_46px_90px_-46px_rgba(6,46,40,0.5)] lg:grid-cols-[1.05fr_1fr]"
                >
                  <BlogCover post={featured} index={0} priority className="min-h-[15rem] lg:h-full" />
                  <div className="flex flex-col justify-center p-6 sm:p-9">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fde9e1] px-3 py-1 font-display text-[0.58rem] font-bold uppercase tracking-[0.14em] text-[#d9532f]">
                        <Sparkles className="h-3 w-3" strokeWidth={2.4} /> Featured
                      </span>
                      <span className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-3">
                        {featured.category}
                      </span>
                    </div>
                    <h2 className="mt-3 font-display text-[clamp(1.4rem,3.4vw,2.1rem)] font-extrabold leading-[1.15] tracking-[-0.03em] text-ink transition-colors group-hover:text-[#0f6b5c]">
                      {featured.title}
                    </h2>
                    <p className="mt-3 line-clamp-3 font-sans text-[0.92rem] leading-[1.8] text-ink-2">
                      {featured.excerpt}
                    </p>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-[linear-gradient(145deg,#14a08c,#0a4e43)] font-display text-[0.66rem] font-black text-white">
                        {featured.author.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-display text-[0.8rem] font-bold text-ink">{featured.author}</span>
                        <span className="block font-sans text-[0.66rem] text-ink-3">
                          {formatBlogDate(featured.publishedAt)} · {featured.readMinutes} min read
                        </span>
                      </span>
                      <span className="ml-auto inline-flex items-center gap-2 rounded-full bg-[#0f6b5c] px-5 py-2.5 font-display text-[0.72rem] font-bold uppercase tracking-[0.12em] text-white transition-all duration-300 group-hover:bg-[#0a4e43]">
                        Read story
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={2.4} />
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            )}
          </div>
        </section>

        {/* ── feed ─────────────────────────────────────────────────────── */}
        <section className="px-5 pb-20 pt-12 sm:px-8 sm:pb-24 sm:pt-14">
          <div className="mx-auto max-w-7xl">
            {posts.length === 0 ? (
              <div className="mx-auto max-w-xl rounded-[1.6rem] border border-dashed border-[#cfe3da] bg-white/80 px-6 py-16 text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#eaf7f3] text-[#0f6b5c]">
                  <PenLine className="h-6 w-6" strokeWidth={1.9} />
                </span>
                <h2 className="mt-4 font-display text-[1.2rem] font-extrabold text-ink">
                  The first story is being written
                </h2>
                <p className="mx-auto mt-2 max-w-sm font-sans text-[0.88rem] leading-relaxed text-ink-3">
                  Our journal is being prepared in the admin studio — check back soon for practical
                  notes on fluency and exam success.
                </p>
                <Link href="/courses" className="btn-teal mt-6 h-11 px-6 text-[0.8rem]">
                  Explore the programmes <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <BlogFeed posts={rest.length > 0 ? posts : posts} />
            )}
          </div>
        </section>

        {/* ── CTA band ─────────────────────────────────────────────────── */}
        <section className="px-5 pb-20 sm:px-8">
          <Reveal>
            <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-6 overflow-hidden rounded-[1.75rem] bg-[linear-gradient(135deg,#0f6b5c_0%,#0a4e43_55%,#063a33_100%)] px-7 py-9 text-white sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-11">
              <span aria-hidden className="pointer-events-none absolute -right-10 -top-16 h-52 w-52 rounded-full bg-[#7ef0c9]/20 blur-3xl" />
              <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-[linear-gradient(90deg,#7ef0c9,#f5b93c,#fb6a47)]" />
              <div className="relative max-w-xl">
                <p className="font-display text-[0.6rem] font-bold uppercase tracking-[0.3em] text-[#9be8d3]">
                  Ready for the next step?
                </p>
                <h2 className="mt-2 font-display text-[clamp(1.4rem,3vw,2rem)] font-extrabold leading-tight tracking-[-0.02em]">
                  Turn reading into speaking — join a live class.
                </h2>
                <p className="mt-2 font-sans text-[0.9rem] leading-relaxed text-white/70">
                  Small batches, real conversation and a teacher who knows your name.
                </p>
              </div>
              <div className="relative flex flex-wrap gap-3">
                <Link href="/courses" className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 font-display text-[0.8rem] font-bold text-[#0a4e43] transition hover:-translate-y-0.5 hover:bg-[#eaf7f3]">
                  View courses <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
                </Link>
                <Link href="/placement-test" className="inline-flex h-12 items-center gap-2 rounded-full border border-white/25 px-6 font-display text-[0.8rem] font-bold text-white transition hover:-translate-y-0.5 hover:border-[#7ef0c9]/60 hover:text-[#7ef0c9]">
                  Free placement test
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
