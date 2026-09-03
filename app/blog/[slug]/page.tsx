import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, Eye, User } from "lucide-react";
import { getBlogCollection } from "@/lib/db";
import { appBaseUrl } from "@/lib/base-url";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/footer/Footer";
import { BlogContent } from "@/components/blog/BlogContent";

export const dynamic = "force-dynamic";

const baseUrl = appBaseUrl();

async function getPost(slug: string) {
  const blog = await getBlogCollection();
  const doc = await blog.findOne({ slug, published: true });
  if (!doc) return null;

  // Increment views.
  blog.updateOne({ _id: doc._id }, { $inc: { views: 1 } }).catch(() => {});

  return {
    id: String(doc._id),
    slug: doc.slug,
    title: doc.title,
    excerpt: doc.excerpt,
    content: doc.content,
    coverImage: doc.coverImage ?? null,
    author: doc.author,
    tags: doc.tags,
    views: doc.views + 1,
    publishedAt: doc.publishedAt?.toISOString() ?? doc.createdAt.toISOString(),
  };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post Not Found | Language Hub" };

  return {
    title: `${post.title} | Language Hub Blog`,
    description: post.excerpt || post.title,
    openGraph: {
      title: post.title,
      description: post.excerpt || post.title,
      url: `${baseUrl}/blog/${post.slug}`,
      siteName: "Language Hub",
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author],
      ...(post.coverImage ? { images: [{ url: post.coverImage, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || post.title,
      ...(post.coverImage ? { images: [post.coverImage] } : {}),
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    author: { "@type": "Person", name: post.author },
    datePublished: post.publishedAt,
    publisher: {
      "@type": "Organization",
      name: "Language Hub",
      logo: { "@type": "ImageObject", url: `${baseUrl}/opengraph-image` },
    },
    ...(post.coverImage ? { image: post.coverImage } : {}),
    mainEntityOfPage: `${baseUrl}/blog/${post.slug}`,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${baseUrl}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: `${baseUrl}/blog/${post.slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Navbar />
      <div className="min-h-screen bg-[#faf8f4] pt-[4.25rem]">
        <article className="mx-auto max-w-3xl px-5 py-12 lg:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-white/70 px-4 py-2 font-display text-[0.72rem] font-bold text-ink-2 transition-all hover:border-brand/45 hover:text-brand-deep"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All posts
          </Link>

          {post.coverImage ? (
            <div className="mt-8 overflow-hidden rounded-2xl">
              <Image
                src={post.coverImage}
                alt={post.title}
                width={1600}
                height={900}
                priority
                className="h-auto w-full object-cover"
              />
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
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> {post.author}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(post.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" /> {post.views} views
              </span>
            </div>
          </header>

          <div className="mt-10">
            <BlogContent content={post.content} />
          </div>
        </article>
      </div>
      <Footer />
    </>
  );
}
