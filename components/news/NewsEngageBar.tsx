"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { NewsCommentsPanel } from "@/components/news/NewsCommentsPanel";

type Reaction = "like" | "interested" | "not_interested" | null;

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Reaction + comments bar for a news post. Counts are supplied as props by the
 * server-rendered post page — no extra fetch on load, so opening a post is
 * snappy even on a cold serverless instance.
 */
export function NewsEngageBar({
  slug,
  title,
  likeCount,
  interestedCount,
  notInterestedCount,
  commentCount,
  myReaction = null,
}: {
  slug: string;
  title: string;
  likeCount: number;
  interestedCount: number;
  notInterestedCount: number;
  commentCount: number;
  myReaction?: Reaction | null;
}) {
  const [my, setMy] = useState<Reaction>(myReaction);
  const [counts, setCounts] = useState({
    like: likeCount,
    interested: interestedCount,
    not_interested: notInterestedCount,
  });
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentCountState, setCommentCountState] = useState(commentCount);

  // The post page can be server-rendered/cached, so per-viewer state is fetched
  // client-side: hydrate the "already liked" state + authoritative counts.
  useEffect(() => {
    let on = true;
    fetch(`/api/news/${encodeURIComponent(slug)}/reaction`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!on || !d) return;
        if (typeof d.myReaction === "string" || d.myReaction === null) setMy(d.myReaction);
        if (d.counts) setCounts(d.counts);
      })
      .catch(() => {});
    return () => {
      on = false;
    };
  }, [slug]);

  const react = async (type: Exclude<Reaction, null>) => {
    const next: Reaction = my === type ? null : type;
    const prev = my;
    setMy(next);
    setCounts((c) => {
      const nc = { ...c };
      if (prev) nc[prev] = Math.max(0, nc[prev] - 1);
      if (next) nc[next] = nc[next] + 1;
      return nc;
    });
    try {
      const res = await fetch(`/api/news/${encodeURIComponent(slug)}/reaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: next }),
      });
      const d = await res.json().catch(() => null);
      if (res.ok && d) {
        if (typeof d.myReaction === "string" || d.myReaction === null) setMy(d.myReaction);
        if (d.counts) setCounts(d.counts);
      }
    } catch { /* rely on optimistic */ }
  };

  const btn = (type: Exclude<Reaction, null>) =>
    cn(
      "flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 font-display text-[0.8rem] font-bold transition-all",
      my === type
        ? type === "like"
          ? "bg-brand-deep text-white shadow-[0_8px_20px_-8px_rgba(79,70,229,0.6)]"
          : type === "interested"
            ? "bg-gold text-white shadow-[0_8px_20px_-8px_rgba(245,158,11,0.6)]"
            : "bg-ink text-white shadow-[0_8px_20px_-8px_rgba(15,23,42,0.5)]"
        : "bg-[#f4f5fb] text-ink-2 hover:bg-ink/[0.06] hover:text-ink"
    );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="mt-8 flex flex-col gap-3"
      >
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => react("like")} className={btn("like")}>
            <ThumbsUp className="h-4 w-4" strokeWidth={2.2} /> Like
            {counts.like > 0 && <span className="font-mono text-[0.7rem] opacity-80">{counts.like}</span>}
          </button>
          <button type="button" onClick={() => react("interested")} className={btn("interested")}>
            <ThumbsUp className="h-4 w-4 rotate-90" strokeWidth={2.2} /> Interested
            {counts.interested > 0 && <span className="font-mono text-[0.7rem] opacity-80">{counts.interested}</span>}
          </button>
          <button type="button" onClick={() => react("not_interested")} className={btn("not_interested")}>
            <ThumbsDown className="h-4 w-4" strokeWidth={2.2} /> Skip
            {counts.not_interested > 0 && <span className="font-mono text-[0.7rem] opacity-80">{counts.not_interested}</span>}
          </button>
          <button
            type="button"
            onClick={() => setCommentsOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 font-display text-[0.8rem] font-bold text-ink-2 transition-all hover:bg-ink/[0.06] hover:text-brand-deep"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={2.2} />
            Comments
            {commentCountState > 0 && <span className="font-mono text-[0.7rem]">{commentCountState}</span>}
          </button>
        </div>
      </motion.div>

      <NewsCommentsPanel
        slug={slug}
        postTitle={title}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        onPosted={() => setCommentCountState((c) => c + 1)}
      />
    </>
  );
}