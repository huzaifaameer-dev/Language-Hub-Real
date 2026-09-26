"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, MessageCircle, Pin, ThumbsDown, ThumbsUp, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { NewsRoleBadge } from "@/components/news/NewsRoleBadge";
import { NewsCommentsPanel } from "@/components/news/NewsCommentsPanel";
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
  myReaction?: Reaction | null;
  publishedAt: string;
}

type Reaction = "like" | "interested" | "not_interested" | null;

const ease = [0.16, 1, 0.3, 1] as const;

export function NewsPostCard({ post, index = 0 }: { post: FeedPost; index?: number }) {
  const [my, setMy] = useState<Reaction>(post.myReaction ?? null);
  const [counts, setCounts] = useState({
    like: post.likeCount ?? 0,
    interested: post.interestedCount ?? 0,
    not_interested: post.notInterestedCount ?? 0,
  });
  const [commentCount, setCommentCount] = useState(post.commentCount ?? 0);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const react = async (type: Exclude<Reaction, null>) => {
    const next: Reaction = my === type ? null : type;
    const prev = my;
    // Optimistic
    setMy(next);
    setCounts((c) => {
      const nextC = { ...c };
      if (prev) nextC[prev] = Math.max(0, nextC[prev] - 1);
      if (next) nextC[next] = nextC[next] + 1;
      return nextC;
    });
    try {
      const res = await fetch(`/api/news/${encodeURIComponent(post.slug)}/reaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: next }),
      });
      const d = await res.json().catch(() => null);
      if (res.ok && d) {
        if (typeof d.myReaction === "string" || d.myReaction === null) setMy(d.myReaction);
        if (d.counts) setCounts(d.counts);
      }
    } catch {
      // server sync failed — count display may drift until refresh
    }
  };

  const reactedBtn = (type: Exclude<Reaction, null>) =>
    cn(
      "flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 font-display text-[0.74rem] font-bold transition-all",
      my === type
        ? type === "like"
          ? "bg-brand-deep text-white shadow-[0_8px_20px_-8px_rgb(79_70_229/0.6)]"
          : type === "interested"
            ? "bg-gold text-white shadow-[0_8px_20px_-8px_rgb(245_158_11/0.6)]"
            : "bg-ink text-white shadow-[0_8px_20px_-8px_rgb(15_23_42/0.5)]"
        : "bg-[#f4f5fb] text-ink-2 hover:bg-ink/[0.06] hover:text-ink"
    );

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5, ease, delay: Math.min(0.15, index * 0.04) }}
        className="relative w-full overflow-hidden rounded-2xl border border-ink/[0.06] bg-white shadow-[0_10px_30px_-16px_rgb(15_23_42/0.15)]"
      >
        {/* Author row */}
        <div className="flex items-center gap-3 p-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-deep to-brand-magenta font-display text-[1rem] font-black text-white shadow-md">
            {(post.author || "L").charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Link href={`/news/${post.slug}`} className="truncate font-display text-[0.92rem] font-extrabold text-ink hover:text-brand-deep">
                {post.author}
              </Link>
              {post.pinned && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-gold/15 px-1.5 py-0.5 text-[0.52rem] font-bold uppercase tracking-wider text-gold-deep">
                  <Pin className="h-2.5 w-2.5" /> Pinned
                </span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <NewsRoleBadge role={post.authorRole} />
              <span className="flex items-center gap-1 font-mono text-[0.58rem] text-ink-3">
                <Clock className="h-3 w-3" />
                {new Date(post.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </span>
            </div>
          </div>
        </div>

        {/* Cover */}
        {post.coverImage ? (
          <Link href={`/news/${post.slug}`} className="block overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverImage}
              alt={post.title}
              loading="lazy"
              className="h-56 w-full object-cover transition-transform duration-500 hover:scale-[1.02] sm:h-72"
            />
          </Link>
        ) : null}

        {/* Title + excerpt */}
        <div className="p-4 pb-3">
          <div className="flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((t) => (
              <span key={t} className="rounded-full border border-brand/15 bg-brand/5 px-2 py-0.5 font-mono text-[0.56rem] font-bold text-brand-deep">
                {t}
              </span>
            ))}
          </div>
          <Link href={`/news/${post.slug}`}>
            <h2 className="mt-2 font-display text-[1.25rem] font-extrabold leading-snug tracking-[-0.01em] text-ink transition-colors hover:text-brand-deep">
              {post.title}
            </h2>
          </Link>
          {post.excerpt ? (
            <p className="mt-2 line-clamp-3 text-[0.9rem] leading-relaxed text-ink-2">{post.excerpt}</p>
          ) : null}
        </div>

        {/* Reaction / action row — Facebook style */}
        <div className="flex items-center gap-1.5 border-t border-ink/[0.06] px-3 py-2.5">
          <button type="button" onClick={() => react("like")} className={reactedBtn("like")}>
            <ThumbsUp className="h-4 w-4" strokeWidth={2.2} />
            Like
            {counts.like > 0 && <span className="font-mono text-[0.66rem] opacity-80">{counts.like}</span>}
          </button>
          <button type="button" onClick={() => react("interested")} className={reactedBtn("interested")}>
            <ThumbsUp className="h-4 w-4 rotate-90" strokeWidth={2.2} />
            Interested
            {counts.interested > 0 && <span className="font-mono text-[0.66rem] opacity-80">{counts.interested}</span>}
          </button>
          <button type="button" onClick={() => react("not_interested")} className={reactedBtn("not_interested")}>
            <ThumbsDown className="h-4 w-4" strokeWidth={2.2} />
            Not interested
            {counts.not_interested > 0 && <span className="font-mono text-[0.66rem] opacity-80">{counts.not_interested}</span>}
          </button>
          <button
            type="button"
            onClick={() => setCommentsOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 font-display text-[0.74rem] font-bold text-ink-2 transition-all hover:bg-ink/[0.06] hover:text-brand-deep"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={2.2} />
            Comment
            {commentCount > 0 && <span className="font-mono text-[0.66rem]">{commentCount}</span>}
          </button>
        </div>

        <div className="flex items-center justify-between border-t border-ink/[0.04] px-4 py-3">
          <span className="font-mono text-[0.56rem] text-ink-3">{post.views} views</span>
          <Link
            href={`/news/${post.slug}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-deep to-brand-magenta px-4 py-2 font-display text-[0.7rem] font-bold uppercase tracking-[0.06em] text-white shadow-[0_10px_22px_-10px_rgb(110_90_224/0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110"
          >
            Read full post <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </motion.article>

      <NewsCommentsPanel
        slug={post.slug}
        postTitle={post.title}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
      />
    </>
  );
}