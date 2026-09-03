"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { BookOpen, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string | null;
  author: string;
  tags: string[];
  views: number;
  publishedAt: string;
}

const ease = [0.16, 1, 0.3, 1] as const;

export function BlogListClient({ initialPosts, tags }: { initialPosts: Post[]; tags: string[] }) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const posts = useMemo(() => {
    if (!activeTag) return initialPosts;
    return initialPosts.filter((p) => p.tags.includes(activeTag));
  }, [initialPosts, activeTag]);

  return (
    <>
      {tags.length > 0 ? (
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTag(null)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 font-mono text-[0.68rem] font-bold tracking-widest transition-all",
              !activeTag
                ? "border-brand/80/60 bg-brand-deep text-white shadow-[0_10px_24px_-10px_rgb(110_90_224/0.8)]"
                : "border-ink/12 bg-white/70 text-ink-2 hover:border-brand/45 hover:text-brand-deep"
            )}
          >
            All
          </button>
          {tags.map((t) => (
            <span key={t} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTag(activeTag === t ? null : t)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 font-mono text-[0.68rem] font-bold tracking-widest transition-all",
                  activeTag === t
                    ? "border-brand/80/60 bg-brand-deep text-white shadow-[0_10px_24px_-10px_rgb(110_90_224/0.8)]"
                    : "border-ink/12 bg-white/70 text-ink-2 hover:border-brand/45 hover:text-brand-deep"
                )}
              >
                {t}
              </button>
              <Link
                href={`/blog/tag/${t.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                aria-label={`All ${t} articles`}
                className="font-mono text-[0.6rem] text-brand-deep/70 opacity-0 transition-opacity hover:opacity-100 focus:opacity-100"
              >
                ↗
              </Link>
            </span>
          ))}
        </div>
      ) : null}

      {posts.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-ink/15 py-20 text-center">
          <BookOpen className="h-10 w-10 text-ink-3/40" />
          <p className="mt-4 font-display text-[1.1rem] font-bold text-ink-2">No posts yet</p>
          <p className="mt-1 font-mono text-[0.72rem] text-ink-3">Check back soon — we&apos;re working on new content.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {posts.map((post, i) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease, delay: Math.min(0.2, i * 0.04) }}
            >
              <Link
                href={`/blog/${post.slug}`}
                className="group relative block overflow-hidden rounded-2xl border border-ink/10 bg-white p-5 shadow-[0_8px_24px_-12px_rgb(15_23_42/0.12)] transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_16px_36px_-14px_rgb(110_90_224/0.35)]"
              >
                {post.coverImage ? (
                  <div className="mb-4 overflow-hidden rounded-xl">
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      width={1600}
                      height={900}
                      loading="lazy"
                      className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="mb-4 flex h-44 items-center justify-center rounded-xl bg-gradient-to-br from-brand/10 to-brand-magenta/10">
                    <BookOpen className="h-10 w-10 text-brand/40" />
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {post.tags.slice(0, 3).map((t) => (
                    <span key={t} className="rounded-full border border-brand/15 bg-brand/5 px-2 py-0.5 font-mono text-[0.6rem] font-bold text-brand-deep">
                      {t}
                    </span>
                  ))}
                </div>

                <h2 className="mt-3 font-display text-[1.1rem] font-extrabold leading-snug text-ink transition-colors group-hover:text-brand-deep">
                  {post.title}
                </h2>
                {post.excerpt ? (
                  <p className="mt-2 line-clamp-2 text-[0.85rem] leading-relaxed text-ink-3">{post.excerpt}</p>
                ) : null}

                <div className="mt-4 flex items-center gap-3 border-t border-ink/8 pt-3">
                  <span className="font-mono text-[0.6rem] text-ink-3">
                    {new Date(post.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[0.6rem] text-ink-3">
                    <Eye className="h-3 w-3" /> {post.views}
                  </span>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      )}
    </>
  );
}
