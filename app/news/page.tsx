import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { getNewsPostsCollection } from "@/lib/db";
import { appBaseUrl } from "@/lib/base-url";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/footer/Footer";
import { NewsFeed } from "@/components/news/NewsFeed";

/** ISR: cached at the edge, revalidated every 15s + on admin "news" tag changes. */
export const revalidate = 15;

const baseUrl = appBaseUrl();

export const metadata: Metadata = {
  title: "Daily News | Language Hub",
  description: "Latest updates, announcements, and insights from Language Hub Academy.",
  openGraph: {
    title: "Daily News | Language Hub",
    description: "Latest updates, announcements, and insights from Language Hub Academy.",
    url: `${baseUrl}/news`,
    siteName: "Language Hub",
    type: "website",
  },
};

async function getPosts() {
  try {
    const posts = await getNewsPostsCollection();
    const docs = await posts
      .find({ published: true })
      .sort({ pinned: -1, publishedAt: -1, createdAt: -1 })
      .limit(50)
      .toArray();

    return docs.map((d) => {
      const clean = d.body.replace(/!\[[^\]]*\]\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
      return ({
      id: String(d._id),
      slug: d.slug,
      title: d.title,
      excerpt: clean.length > 220 ? clean.slice(0, 220) + "…" : clean,
      coverImage: d.coverImage ?? null,
      author: d.authorName,
      authorRole: d.authorRole,
      tags: d.tags,
      views: d.views,
      likeCount: d.likeCount ?? 0,
      interestedCount: d.interestedCount ?? 0,
      notInterestedCount: d.notInterestedCount ?? 0,
      commentCount: d.commentCount ?? 0,
      pinned: d.pinned,
      publishedAt: d.publishedAt?.toISOString() ?? d.createdAt.toISOString(),
      });
    });
  } catch {
    // Database unreachable (cold Atlas / local build) — degrade to an empty
    // feed. ISR repopulates as soon as the DB is reachable again.
    return [];
  }
}

const getPostsCached = unstable_cache(getPosts, ["news-feed"], { revalidate: 30, tags: ["news"] });

async function getAllTags(): Promise<string[]> {
  try {
    const posts = await getNewsPostsCollection();
    const docs = await posts.find({ published: true }).project({ tags: 1 } as Record<string, 1>).toArray();
    const tagSet = new Set<string>();
    for (const d of docs) {
      for (const t of d.tags ?? []) tagSet.add(t);
    }
    return Array.from(tagSet).sort();
  } catch {
    return [];
  }
}

const getTagsCached = unstable_cache(getAllTags, ["news-tags"], { revalidate: 30, tags: ["news"] });

export default async function NewsFeedPage() {
  const [posts, tags] = await Promise.all([getPostsCached(), getTagsCached()]);

  const webpageJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Daily News | Language Hub",
    url: `${baseUrl}/news`,
    description: metadata.description,
    isPartOf: { "@type": "WebSite", name: "Language Hub", url: baseUrl },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webpageJsonLd) }} />
      <Navbar />
      <div className="min-h-screen bg-site pt-[4.25rem]">
        <div className="mx-auto max-w-5xl px-5 py-16 lg:px-8">
          <div className="mb-10">
            <p className="flex items-center gap-3 font-display text-[0.62rem] font-bold uppercase tracking-[0.4em] text-brand-deep">
              <span aria-hidden className="h-px w-7 bg-gradient-to-r from-brand/80 to-transparent" />
              Daily News
            </p>
            <h1 className="mt-3 font-display text-[clamp(2rem,5vw,3.2rem)] font-extrabold tracking-[-0.03em] text-ink">
              LATEST <span className="bg-gradient-to-r from-brand-deep to-brand-magenta bg-clip-text text-transparent">UPDATES.</span>
            </h1>
            <p className="mt-3 max-w-xl text-[1rem] leading-relaxed text-ink-2">
              Stories, announcements, and insights from Language Hub — straight from the team to you.
            </p>
          </div>

          <NewsFeed initialPosts={posts} tags={tags} />
        </div>
      </div>
      <Footer />
    </>
  );
}