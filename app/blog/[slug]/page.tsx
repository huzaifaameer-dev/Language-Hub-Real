import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Eye,
  MessageSquare,
  Quote,
  Share2,
  Tag,
} from "lucide-react";

import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/footer/Footer";
import { Reveal } from "@/components/ui/Reveal";
import { BlogCover } from "@/components/blog/BlogFeed";
import { formatBlogDate } from "@/lib/blog/format";
import { BlogComments, type BlogCommentView } from "@/components/blog/BlogComments";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { appBaseUrl } from "@/lib/base-url";
import {
  bumpViews,
  getApprovedComments,
  getPublishedPost,
  listPublishedPosts,
} from "@/lib/server/blog";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await getPublishedPost(slug);
    if (!post) return { title: "Story not found | Language Hub" };
    return {
      title: `${post.title} | Language Hub Journal`,
      description: post.excerpt,
      openGraph: {
        title: post.title,
        description: post.excerpt,
        type: "article",
        publishedTime: post.publishedAt ?? undefined,
        authors: [post.author],
        images: post.coverImage ? [{ url: post.coverImage }] : undefined,
      },
    };
  } catch {
    return { title: "Language Hub Journal" };
  }
}

const ARTICLE = [
  "font-sans text-[1.02rem] leading-[1.9] text-[#33443f]",
  "[&_p]:mt-5",
  "[&_h1]:mt-10 [&_h1]:font-display [&_h1]:text-[clamp(1.6rem,3.2vw,2.15rem)] [&_h1]:font-extrabold [&_h1]:leading-tight [&_h1]:tracking-[-0.03em] [&_h1]:text-ink",
  "[&_h2]:mt-9 [&_h2]:font-display [&_h2]:text-[clamp(1.3rem,2.6vw,1.7rem)] [&_h2]:font-extrabold [&_h2]:leading-snug [&_h2]:tracking-[-0.02em] [&_h2]:text-ink",
  "[&_h3]:mt-7 [&_h3]:font-display [&_h3]:text-[1.12rem] [&_h3]:font-bold [&_h3]:text-ink",
  "[&_h4]:mt-6 [&_h4]:font-display [&_h4]:text-[1rem] [&_h4]:font-bold [&_h4]:text-ink",
  "[&_strong]:font-bold [&_strong]:text-ink [&_b]:font-bold [&_b]:text-ink",
  "[&_em]:italic [&_i]:italic",
  "[&_u]:underline [&_u]:decoration-[#0f6b5c]/40 [&_u]:underline-offset-4",
  "[&_a]:font-semibold [&_a]:text-[#0f6b5c] [&_a]:underline [&_a]:decoration-[#9bd8c9] [&_a]:underline-offset-[3px] hover:[&_a]:text-[#0a4e43]",
  "[&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_ul]:marker:text-[#14a08c]",
  "[&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_ol]:marker:font-semibold [&_ol]:marker:text-[#0f6b5c]",
  "[&_li]:pl-1",
  "[&_blockquote]:my-7 [&_blockquote]:rounded-r-2xl [&_blockquote]:border-l-4 [&_blockquote]:border-[#14a08c] [&_blockquote]:bg-[#f3fbf8] [&_blockquote]:px-5 [&_blockquote]:py-4 [&_blockquote]:font-serif [&_blockquote]:text-[1.08rem] [&_blockquote]:italic [&_blockquote]:text-[#2c4741]",
  "[&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-[#0b2b26] [&_pre]:px-5 [&_pre]:py-4 [&_pre]:font-mono [&_pre]:text-[0.82rem] [&_pre]:leading-relaxed [&_pre]:text-[#d7f0e9]",
  "[&_code]:rounded-md [&_code]:bg-[#eef7f3] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-[#0a4e43]",
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit",
  "[&_img]:my-7 [&_img]:h-auto [&_img]:w-full [&_img]:rounded-2xl [&_img]:shadow-[0_24px_50px_-34px_rgba(6,46,40,0.5)]",
  "[&_figure]:my-7",
  "[&_figcaption]:mt-2 [&_figcaption]:text-center [&_figcaption]:font-sans [&_figcaption]:text-[0.74rem] [&_figcaption]:text-ink-3",
  "[&_hr]:my-9 [&_hr]:border-[#e6f0ec]",
  "[&_table]:my-6 [&_table]:w-full [&_table]:border-collapse [&_table]:overflow-hidden [&_table]:rounded-xl [&_table]:text-[0.88rem]",
  "[&_th]:bg-[#f3fbf8] [&_th]:px-3 [&_th]:py-2.5 [&_th]:text-left [&_th]:font-display [&_th]:font-bold [&_th]:text-ink",
  "[&_td]:border-t [&_td]:border-[#eef5f2] [&_td]:px-3 [&_td]:py-2.5",
  "[&_mark]:rounded [&_mark]:px-0.5",
].join(" ");

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;

  let post: Awaited<ReturnType<typeof getPublishedPost>> = null;
  try {
    post = await getPublishedPost(slug);
  } catch {
    post = null;
  }
  if (!post) notFound();

  const [comments, siblings] = await Promise.all([
    getApprovedComments(post.id).catch(() => [] as BlogCommentView[]),
    listPublishedPosts({ limit: 24 }).catch(() => []),
  ]);
  void bumpViews(post.id).catch(() => {});

  const related = siblings
    .filter((p) => p.id !== post.id)
    .sort((a, b) => Number(b.category === post.category) - Number(a.category === post.category))
    .slice(0, 3);

  const commentView: BlogCommentView[] = comments.map((c) => ({
    id: c.id,
    name: c.name,
    body: c.body,
    createdAt: c.createdAt,
  }));

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-site pt-[6.4rem]">
        <article className="px-5 pb-16 pt-8 sm:px-8 sm:pt-10">
          <div className="mx-auto max-w-3xl">
            <Link
              href="/blog"
              className="group inline-flex items-center gap-2 font-display text-[0.74rem] font-bold uppercase tracking-[0.14em] text-[#0f6b5c] transition-colors hover:text-[#0a4e43]"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" strokeWidth={2.4} />
              The Journal
            </Link>

            <Reveal>
              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fde9e1] px-3 py-1 font-display text-[0.58rem] font-bold uppercase tracking-[0.14em] text-[#d9532f]">
                  <Tag className="h-3 w-3" strokeWidth={2.4} /> {post.category}
                </span>
                {post.tags.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-[#e3ede9] bg-white px-2.5 py-1 font-sans text-[0.64rem] font-semibold text-[#44615a]"
                  >
                    #{t}
                  </span>
                ))}
              </div>

              <h1 className="mt-4 font-display text-[clamp(1.9rem,5vw,3rem)] font-extrabold leading-[1.08] tracking-[-0.035em] text-ink">
                {post.title}
              </h1>
              <p className="mt-4 max-w-2xl font-serif text-[1.06rem] italic leading-[1.8] text-ink-2">
                {post.excerpt}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-y border-[#eaf3f0] py-4">
                <span className="flex items-center gap-2.5">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[linear-gradient(145deg,#14a08c,#0a4e43)] font-display text-[0.72rem] font-black text-white">
                    {post.author.slice(0, 1).toUpperCase()}
                  </span>
                  <span>
                    <span className="block font-display text-[0.84rem] font-bold text-ink">{post.author}</span>
                    <span className="block font-sans text-[0.66rem] text-ink-3">{post.authorRole}</span>
                  </span>
                </span>
                <span className="flex items-center gap-1.5 font-sans text-[0.74rem] text-ink-3">
                  <Clock className="h-3.5 w-3.5" strokeWidth={2} /> {formatBlogDate(post.publishedAt)}
                </span>
                <span className="flex items-center gap-1.5 font-sans text-[0.74rem] text-ink-3">
                  <Clock className="h-3.5 w-3.5" strokeWidth={2} /> {post.readMinutes} min read
                </span>
                <span className="flex items-center gap-1.5 font-sans text-[0.74rem] text-ink-3">
                  <Eye className="h-3.5 w-3.5" strokeWidth={2} /> {post.views.toLocaleString("en-PK")} reads
                </span>
                <span className="ml-auto flex items-center gap-1.5 font-sans text-[0.74rem] text-ink-3">
                  <MessageSquare className="h-3.5 w-3.5" strokeWidth={2} /> {post.commentCount} comments
                </span>
              </div>
            </Reveal>
          </div>

          <div className="mx-auto mt-8 max-w-4xl">
            <Reveal delay={0.06} y={24}>
              <BlogCover post={post} index={0} priority className="aspect-[16/9] w-full rounded-[1.75rem] shadow-[0_40px_80px_-50px_rgba(6,46,40,0.55)]" />
            </Reveal>
          </div>

          <div className="mx-auto mt-10 max-w-3xl">
            <div className={ARTICLE} dangerouslySetInnerHTML={{ __html: post.content }} />

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-y border-[#eaf3f0] py-3">
              <ShareButtons
                title={post.title}
                url={`${appBaseUrl()}/blog/${post.slug}`}
              />
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 font-display text-[0.72rem] font-bold text-[#0f6b5c] hover:text-[#0a4e43]"
              >
                All stories
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
              </Link>
            </div>

            {/* author card */}
            <div className="mt-14 flex flex-col gap-4 rounded-[1.5rem] border border-[#e6f0ec] bg-[#f7fcfa] p-6 sm:flex-row sm:items-center">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[linear-gradient(145deg,#14a08c,#0a4e43)] font-display text-[1rem] font-black text-white">
                {post.author.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="font-display text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[#0f6b5c]">
                  Written by
                </p>
                <p className="mt-1 font-display text-[1.02rem] font-extrabold text-ink">{post.author}</p>
                <p className="mt-0.5 font-sans text-[0.8rem] leading-relaxed text-ink-2">
                  {post.authorRole} at Language Hub — teaching English that works in real rooms, real
                  interviews and real exams.
                </p>
              </div>
              <Link
                href="/team"
                className="sm:ml-auto inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-[#cfe3da] px-4 font-display text-[0.72rem] font-bold text-[#0a4e43] transition hover:bg-white"
              >
                <Share2 className="h-3.5 w-3.5" strokeWidth={2.2} /> Meet the team
              </Link>
            </div>

            <BlogComments slug={post.slug} initial={commentView} />
          </div>
        </article>

        {related.length > 0 && (
          <section className="border-t border-[#edf5f2] bg-[#f7fcfa] px-5 py-16 sm:px-8">
            <div className="mx-auto max-w-7xl">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <span className="eyebrow-ref">
                    <Quote className="h-3.5 w-3.5" /> Keep reading
                  </span>
                  <h2 className="mt-3 font-display text-[clamp(1.4rem,3vw,1.9rem)] font-extrabold tracking-[-0.02em] text-ink">
                    More from the journal
                  </h2>
                </div>
                <Link
                  href="/blog"
                  className="group inline-flex items-center gap-1.5 font-display text-[0.78rem] font-bold text-[#0f6b5c] hover:text-[#0a4e43]"
                >
                  All stories
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={2.2} />
                </Link>
              </div>

              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r, i) => (
                  <Link
                    key={r.id}
                    href={`/blog/${r.slug}`}
                    className="group flex flex-col overflow-hidden rounded-[1.5rem] border border-[#eaf3f0] bg-white shadow-[0_22px_48px_-40px_rgba(6,46,40,0.45)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_32px_64px_-40px_rgba(6,46,40,0.45)]"
                  >
                    <BlogCover post={r} index={i + 1} className="aspect-[16/9] w-full" />
                    <div className="flex flex-1 flex-col p-5">
                      <span className="font-display text-[0.56rem] font-bold uppercase tracking-[0.18em] text-[#d9532f]">
                        {r.category}
                      </span>
                      <h3 className="mt-2 font-display text-[1rem] font-extrabold leading-snug tracking-[-0.02em] text-ink transition-colors group-hover:text-[#0f6b5c]">
                        {r.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 font-sans text-[0.8rem] leading-relaxed text-ink-2">
                        {r.excerpt}
                      </p>
                      <p className="mt-auto pt-4 font-sans text-[0.66rem] text-ink-3">
                        {formatBlogDate(r.publishedAt)} · {r.readMinutes} min read
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
