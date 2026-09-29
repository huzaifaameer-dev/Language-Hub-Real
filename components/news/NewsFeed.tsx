"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NewsPostCard } from "@/components/news/NewsPostCard";
import type { NewsRole } from "@/lib/news-roles";

interface FeedPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string | null;
  author: string;
  authorRole: NewsRole;
  tags: string[];
  views: number;
  likeCount: number;
  interestedCount: number;
  notInterestedCount: number;
  commentCount: number;
  pinned: boolean;
  myReaction?: "like" | "interested" | "not_interested" | null;
  publishedAt: string;
}

const ease = [0.16, 1, 0.3, 1] as const;
const SORTS = ["latest", "popular"] as const;

export function NewsFeed({ initialPosts, tags }: { initialPosts: FeedPost[]; tags: string[] }) {
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sort, setSort] = useState<(typeof SORTS)[number]>("latest");
  const [refreshing, setRefreshing] = useState(false);

  const visible = useMemo(() => {
    let list = posts;
    if (activeTag) list = list.filter((p) => p.tags.includes(activeTag));
    if (sort === "popular") {
      list = [...list].sort((a, b) => b.likeCount + b.commentCount - (a.likeCount + a.commentCount));
    } else {
      list = [...list].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    }
    return list;
  }, [posts, activeTag, sort]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/news?limit=50", { cache: "no-store" });
      const d = await res.json().catch(() => null);
      if (d && Array.isArray(d.posts)) setPosts(d.posts);
    } catch {
      /* keep current */
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Always hydrate from the live API on mount: the server-rendered page is
    // ISR-cached and cannot know the viewer, so this is what restores each
    // visitor's own like/interested state (and fresh counts) after a refresh —
    // exactly like the per-post page.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {/* Filter + sort bar */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTag(null)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 font-mono text-[0.68rem] font-bold tracking-widest transition-all",
                !activeTag ? "border-brand/60 bg-brand-deep text-white shadow" : "border-ink/12 bg-white/70 text-ink-2 hover:border-brand/45 hover:text-brand-deep"
              )}
            >
              All
            </button>
            {tags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setActiveTag(activeTag === t ? null : t)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 font-mono text-[0.68rem] font-bold tracking-widest transition-all",
                  activeTag === t ? "border-brand/60 bg-brand-deep text-white shadow" : "border-ink/12 bg-white/70 text-ink-2 hover:border-brand/45 hover:text-brand-deep"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-1 rounded-full border border-ink/10 bg-white p-1">
          {SORTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              className={cn(
                "rounded-full px-3.5 py-1.5 font-mono text-[0.62rem] font-bold uppercase tracking-wider transition-all",
                sort === s ? "bg-brand-deep text-white shadow" : "text-ink-3 hover:text-ink"
              )}
            >
              {s}
            </button>
          ))}
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            aria-label="Refresh news"
            className="ml-0.5 grid h-7 w-7 place-items-center rounded-full text-ink-3 transition-colors hover:bg-ink/[0.06] hover:text-brand-deep disabled:opacity-50"
          >
            <Loader2 className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Feed — single column, same layout mobile + desktop */}
      {visible.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-ink/15 py-20 text-center">
          <BookOpen className="h-10 w-10 text-ink-3/40" />
          <p className="mt-4 font-display text-[1.1rem] font-bold text-ink-2">No news yet</p>
          <p className="mt-1 font-mono text-[0.72rem] text-ink-3">Fresh updates are on the way.</p>
        </div>
      ) : (
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          {visible.map((post, i) => (
            <NewsPostCard key={post.id} post={post} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}