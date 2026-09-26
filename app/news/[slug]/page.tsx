import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { cache } from "react";
import { ArrowLeft, Calendar, Eye, MessageCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import { appBaseUrl } from "@/lib/base-url";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/footer/Footer";
import { NewsContent } from "@/components/news/NewsContent";
import { NewsEngageBar } from "@/components/news/NewsEngageBar";
import { NewsRoleBadge } from "@/components/news/NewsRoleBadge";
import { getNewsPostsCollection } from "@/lib/db";

export const revalidate = 60;

const baseUrl = appBaseUrl();

/** Pre-render EVERY published post at build time so "view full post" is served
 *  straight from the edge cache — zero database on the happy path. New posts
 *  render on first request, then join the static pool via ISR. */
export async function generateStaticParams() {
  try {
    const posts = await getNewsPostsCollection();
    const docs = await posts
      .find({ published: true })
      .project({ slug: 1 })
      .limit(500)
      .toArray();
    return docs.map((d) => ({ slug: d.slug }));
  } catch {
    // DB unreachable at build — the page still works dynamically via ISR.
    return [];
  }
}

/** React cache() dedupes the DB read across generateMetadata and the page so a
 *  single request makes ONE query, not two. */
const getPost = cache(async (slug: string) => {
  const posts = await getNewsPostsCollection();
  const doc = await posts.findOne({ slug, published: true });
  if (!doc) return null;
  posts.updateOne({ _id: doc._id }, { $inc: { views: 1 } }).catch(() => {});
  return {
    id: String(doc._id),
    slug: doc.slug,
    title: doc.title,
    body: doc.body,
    coverImage: doc.coverImage ?? null,
    author: doc.authorName,
    authorRole: doc.authorRole,
    tags: doc.tags,
    views: doc.views + 1,
    likeCount: doc.likeCount ?? 0,
    interestedCount: doc.interestedCount ?? 0,
    notInterestedCount: doc.notInterestedCount ?? 0,
    commentCount: doc.commentCount ?? 0,
    publishedAt: doc.publishedAt?.toISOString() ?? doc.createdAt.toISOString(),
  };
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Not Found | Language Hub" };

  return {
    title: `${post.title} | Daily News`,
    description: post.body.slice(0, 160),
    openGraph: {
      title: post.title,
      description: post.body.slice(0, 200),
      url: `${baseUrl}/news/${post.slug}`,
      siteName: "Language Hub",
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author],
      ...(post.coverImage ? { images: [{ url: post.coverImage, width: 1200, height: 630 }] } : {}),
    },
  };
}

export default async function NewsPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) {
    return (
      <>
        <Navbar />
<div className="min-h-screen bg-site pt-[4.25rem]">
          <div className="mx-auto max-w-3xl px-5 py-20 text-center">
            <p className="font-display text-5xl font-extrabold text-ink/10">404</p>
            <h1 className="mt-4 font-display text-xl font-bold text-ink">Post not found</h1>
            <Link href="/news" className="mt-6 inline-flex items-center gap-1.5 text-brand-deep font-bold">
              ← Back to Daily News
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#faf8f4] pt-[4.25rem]">
        <article className="mx-auto max-w-3xl px-5 py-12 lg:px-8">
          <Link
            href="/news"
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-white/70 px-4 py-2 font-display text-[0.72rem] font-bold text-ink-2 transition-all hover:border-brand/45 hover:text-brand-deep"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Daily News
          </Link>

          {post.coverImage ? (
            <div className="mt-8 overflow-hidden rounded-2xl">
              {post.coverImage.startsWith("data:") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.coverImage} alt={post.title} className="h-auto w-full object-cover" />
              ) : (
                <Image src={post.coverImage} alt={post.title} width={1600} height={900} priority className="h-auto w-full object-cover" />
              )}
            </div>
          ) : null}

          <header className="mt-8">
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((t) => (
                <span key={t} className="rounded-full border border-brand/15 bg-brand/5 px-2.5 py-0.5 font-mono text-[0.6rem] font-bold text-brand-deep">
                  {t}
                </span>
              ))}
            </div>
            <h1 className="mt-4 font-display text-[clamp(1.6rem,4vw,2.4rem)] font-extrabold leading-tight tracking-[-0.02em] text-ink">
              {post.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-4 font-mono text-[0.68rem] text-ink-3">
              <NewsRoleBadge role={post.authorRole} author={post.author} />
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(post.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </span>
              <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> {post.views}</span>
              <span className="flex items-center gap-1.5"><ThumbsUp className="h-3.5 w-3.5" /> {post.likeCount}</span>
              <span className="flex items-center gap-1.5"><ThumbsDown className="h-3.5 w-3.5" /> {(post.interestedCount ?? 0) + (post.notInterestedCount ?? 0)}</span>
              <span className="flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5" /> {post.commentCount}</span>
            </div>
          </header>

          <div className="mt-10">
            <NewsContent content={post.body} />
          </div>

          <NewsEngageBar
            slug={post.slug}
            title={post.title}
            likeCount={post.likeCount}
            interestedCount={post.interestedCount}
            notInterestedCount={post.notInterestedCount}
            commentCount={post.commentCount}
          />
        </article>
      </div>
      <Footer />
    </>
  );
}