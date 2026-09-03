import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { getBlogCollection, type BlogPostDoc } from "@/lib/db";
import { appBaseUrl } from "@/lib/base-url";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/footer/Footer";
import { BlogListClient } from "@/components/blog/BlogListClient";

/** Blog content is essentially immutable after publish — cache list reads for
 *  60s and revalidate instantly from the admin when posts change. */
export const revalidate = 60;

const baseUrl = appBaseUrl();

export const metadata: Metadata = {
  title: "Blog | Language Hub",
  description:
    "Tips, guides, and insights for English language learners — IELTS strategies, study plans, and more from Language Hub Academy.",
  openGraph: {
    title: "Blog | Language Hub",
    description:
      "Tips, guides, and insights for English language learners.",
    url: `${baseUrl}/blog`,
    siteName: "Language Hub",
    type: "website",
  },
};

async function getPosts(): Promise<
  Array<{
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    coverImage: string | null;
    author: string;
    tags: string[];
    views: number;
    publishedAt: string;
  }>
> {
  const blog = await getBlogCollection();
  const docs = await blog
    .find({ published: true })
    .project({ content: 0 })
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(50)
    .toArray();

  return docs.map((d) => ({
    id: String(d._id),
    slug: d.slug,
    title: d.title,
    excerpt: d.excerpt,
    coverImage: d.coverImage ?? null,
    author: d.author,
    tags: d.tags,
    views: d.views,
    publishedAt: d.publishedAt?.toISOString() ?? d.createdAt.toISOString(),
  }));
}

const getPostsCached = unstable_cache(getPosts, ["blog-posts"], { revalidate: 60, tags: ["blog"] });

async function getAllTags(): Promise<string[]> {
  const blog = await getBlogCollection();
  const docs = await blog
    .find({ published: true })
    .project<Pick<BlogPostDoc, "tags">>({ tags: 1 })
    .toArray();
  const tagSet = new Set<string>();
  for (const d of docs) {
    for (const t of d.tags ?? []) tagSet.add(t);
  }
  return Array.from(tagSet).sort();
}

const getTagsCached = unstable_cache(getAllTags, ["blog-tags"], { revalidate: 60, tags: ["blog"] });

export default async function BlogPage() {
  const [posts, tags] = await Promise.all([getPostsCached(), getTagsCached()]);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${baseUrl}/blog` },
    ],
  };

  // WebPage schema ties the page metadata together for rich results.
  const webpageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Blog | Language Hub",
    url: `${baseUrl}/blog`,
    description: metadata.description,
    inLanguage: "en",
    isPartOf: { "@type": "WebSite", name: "Language Hub", url: baseUrl },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webpageJsonLd) }}
      />
      <Navbar />
      <div className="min-h-screen bg-[#faf8f4] pt-[4.25rem]">
        <div className="mx-auto max-w-5xl px-5 py-16 lg:px-8">
          <div className="mb-10">
            <p className="flex items-center gap-3 font-display text-[0.62rem] font-bold uppercase tracking-[0.4em] text-brand-deep">
              <span aria-hidden className="h-px w-7 bg-gradient-to-r from-brand/80 to-transparent" />
              Language Hub Blog
            </p>
            <h1 className="mt-3 font-display text-[clamp(2rem,5vw,3.2rem)] font-extrabold tracking-[-0.03em] text-ink">
              INSIGHTS & <span className="bg-gradient-to-r from-brand-deep to-brand-magenta bg-clip-text text-transparent">GUIDES.</span>
            </h1>
            <p className="mt-3 max-w-xl text-[1rem] leading-relaxed text-ink-2">
              Tips, strategies, and stories to help you ace your English language journey.
            </p>
          </div>

          <BlogListClient initialPosts={posts} tags={tags} />
        </div>
      </div>
      <Footer />
    </>
  );
}
