import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Eye } from "lucide-react";
import { unstable_cache } from "next/cache";
import { getBlogCollection } from "@/lib/db";
import { appBaseUrl } from "@/lib/base-url";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/footer/Footer";

export const revalidate = 60;
const baseUrl = appBaseUrl();

interface ArchivePost {
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string | null;
  tags: string[];
  publishedAt: string;
  views: number;
}

async function getTagArchive(tag: string) {
  const blog = await getBlogCollection();
  const docs = await blog
    .find({ published: true, tags: tag })
    .project({ content: 0 })
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(100)
    .toArray();
  return docs.map((d) => ({
    slug: d.slug,
    title: d.title,
    excerpt: d.excerpt,
    coverImage: d.coverImage ?? null,
    tags: d.tags,
    views: d.views,
    publishedAt: d.publishedAt?.toISOString() ?? d.createdAt.toISOString(),
  }));
}

const getArchiveCached = unstable_cache(
  async (tag: string) => getTagArchive(tag),
  ["blog-archive"],
  { revalidate: 60, tags: ["blog"] }
);

function tagSlug(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function tagHome(slug: string, posts: ArchivePost[]): string {
  // Recover the original tag label from any post carrying it.
  for (const p of posts) {
    const match = p.tags?.find((t) => tagSlug(t) === slug);
    if (match) return match;
  }
  return slug.replace(/-/g, " ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  const posts = await getArchiveCached(tag);
  if (!posts.length) return { title: "Category Not Found | Language Hub" };
  const label = tagHome(tag, posts);
  return {
    title: `${label} Articles | Language Hub Blog`,
    description: `Read all Language Hub articles about ${label} — tips and guides for English learners.`,
    alternates: { canonical: `${baseUrl}/blog/tag/${tag}` },
    openGraph: {
      title: `${label} — Language Hub Blog`,
      description: `All ${label} articles from Language Hub.`,
      url: `${baseUrl}/blog/tag/${tag}`,
      siteName: "Language Hub",
      type: "website",
    },
  };
}

export default async function BlogTagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const posts = await getArchiveCached(tag);
  if (!posts.length) notFound();
  const label = tagHome(tag, posts);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${baseUrl}/blog` },
      { "@type": "ListItem", position: 3, name: label, item: `${baseUrl}/blog/tag/${tag}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Navbar />
      <div className="min-h-screen bg-[#faf8f4] pt-[4.25rem]">
        <div className="mx-auto max-w-5xl px-5 py-16 lg:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-white/70 px-4 py-2 font-display text-[0.72rem] font-bold text-ink-2 transition-all hover:border-brand/45 hover:text-brand-deep"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All articles
          </Link>

          <header className="mt-6 mb-10">
            <p className="flex items-center gap-3 font-display text-[0.62rem] font-bold uppercase tracking-[0.4em] text-brand-deep">
              <span aria-hidden className="h-px w-7 bg-gradient-to-r from-brand/80 to-transparent" />
              Blog category
            </p>
            <h1 className="mt-3 font-display text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold tracking-[-0.03em] text-ink capitalize">
              {label}
            </h1>
            <p className="mt-2 text-[0.95rem] text-ink-2">
              {posts.length} article{posts.length !== 1 ? "s" : ""} in this category
            </p>
          </header>

          <div className="flex flex-col gap-6">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col gap-4 overflow-hidden rounded-2xl border border-ink/[0.08] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_16px_36px_-14px_rgb(110_90_224/0.35)] sm:flex-row sm:items-center"
              >
                {post.coverImage ? (
                  <div className="h-36 w-full shrink-0 overflow-hidden rounded-xl sm:w-52">
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      width={208}
                      height={144}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                ) : null}
                <div className="flex-1">
                  <h2 className="font-display text-[1.1rem] font-extrabold leading-snug text-ink group-hover:text-brand-deep">
                    {post.title}
                  </h2>
                  <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-2">{post.excerpt}</p>
                  <div className="mt-3 flex items-center gap-4 font-mono text-[0.62rem] text-ink-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(post.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {post.views}
                    </span>
                  </div>
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
