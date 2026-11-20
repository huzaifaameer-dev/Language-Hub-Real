import { appBaseUrl } from "@/lib/base-url";
import { listPublishedPosts } from "@/lib/server/blog";

export const dynamic = "force-dynamic";
export const revalidate = 300;

function xml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * RSS 2.0 feed for The Journal. Readers and aggregators can subscribe without
 * scraping the HTML, and each item keeps a stable link back to the site.
 */
export async function GET() {
  const base = appBaseUrl();
  const posts = await listPublishedPosts({ limit: 50 }).catch(() => []);

  const items = posts
    .map((post) => {
      const link = `${base}/blog/${post.slug}`;
      const date = new Date(post.publishedAt ?? Date.now()).toUTCString();
      return `    <item>
      <title>${xml(post.title)}</title>
      <link>${xml(link)}</link>
      <guid isPermaLink="true">${xml(link)}</guid>
      <pubDate>${date}</pubDate>
      <category>${xml(post.category)}</category>
      <description>${xml(post.excerpt)}</description>
    </item>`;
    })
    .join("\n");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>The Language Hub Journal</title>
    <link>${xml(`${base}/blog`)}</link>
    <description>Practical notes on English fluency, IELTS, PTE and confident communication.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${xml(`${base}/blog/rss.xml`)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(feed, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
