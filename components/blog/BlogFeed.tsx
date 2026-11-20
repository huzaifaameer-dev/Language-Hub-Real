"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Clock,
  MessageSquare,
  Search,
  Sparkles,
  Tag,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { EASE_EXPO } from "@/lib/motion";
import { formatBlogDate } from "@/lib/blog/format";

export interface BlogCardPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string | null;
  category: string;
  tags: string[];
  author: string;
  authorRole: string;
  featured: boolean;
  readMinutes: number;
  views: number;
  publishedAt: string | null;
  commentCount: number;
}

const COVERS = [
  "linear-gradient(140deg,#0f6b5c 0%,#0a4e43 55%,#063a33 100%)",
  "linear-gradient(140deg,#fb6a47 0%,#d0452a 55%,#9c2f18 100%)",
  "linear-gradient(140deg,#d99a1a 0%,#a86b00 55%,#7a4c00 100%)",
  "linear-gradient(140deg,#14a08c 0%,#0b7f70 55%,#064d44 100%)",
];

export function BlogCover({
  post,
  index = 0,
  className,
  priority = false,
}: {
  post: Pick<BlogCardPost, "coverImage" | "title" | "category">;
  index?: number;
  className?: string;
  priority?: boolean;
}) {
  const cover = COVERS[index % COVERS.length];
  return (
    <div className={cn("relative overflow-hidden bg-[#0a4e43]", className)}>
      {post.coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.coverImage}
          alt=""
          loading={priority ? "eager" : "lazy"}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.045]"
        />
      ) : (
        <>
          <span aria-hidden className="absolute inset-0" style={{ background: cover }} />
          <span
            aria-hidden
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 24px)",
            }}
          />
          <span
            aria-hidden
            className="absolute -right-2 -top-8 select-none font-display text-[7.5rem] font-black leading-none text-white/10"
          >
            {post.category.slice(0, 1).toUpperCase()}
          </span>
          <span className="absolute inset-x-5 bottom-4 flex items-center gap-2 font-display text-[0.58rem] font-bold uppercase tracking-[0.24em] text-white/70">
            <BookOpen className="h-3.5 w-3.5" strokeWidth={2} /> Language Hub Journal
          </span>
        </>
      )}
    </div>
  );
}

function Chip({
  active,
  children,
  onClick,
  count,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 font-display text-[0.76rem] font-semibold transition-all duration-300",
        active
          ? "bg-[#0f6b5c] text-white shadow-[0_12px_24px_-16px_rgba(10,78,67,0.9)]"
          : "border border-[#e3ede9] bg-white text-[#44615a] hover:border-[#cfe3da] hover:text-[#0f6b5c]"
      )}
    >
      {children}
      {typeof count === "number" && (
        <span
          className={cn(
            "rounded-full px-1.5 py-px text-[0.6rem] font-bold",
            active ? "bg-white/20" : "bg-[#f1f8f4] text-[#0d6a58]"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function PostCard({ post, index }: { post: BlogCardPost; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: Math.min(index, 6) * 0.06, ease: EASE_EXPO }}
      className="h-full"
    >
      <Link
        href={`/blog/${post.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-[#eaf3f0] bg-white shadow-[0_24px_50px_-38px_rgba(6,46,40,0.45)] transition-all duration-500 hover:-translate-y-1.5 hover:border-[#cfe8df] hover:shadow-[0_36px_70px_-40px_rgba(6,46,40,0.45)]"
      >
        <BlogCover post={post} index={index} className="aspect-[16/10] w-full" />
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf7f3] px-2.5 py-1 font-display text-[0.58rem] font-bold uppercase tracking-[0.12em] text-[#0a4e43]">
              <Tag className="h-3 w-3" strokeWidth={2.2} /> {post.category}
            </span>
            <span className="inline-flex items-center gap-1.5 font-sans text-[0.68rem] text-ink-3">
              <CalendarDays className="h-3 w-3" strokeWidth={2} />
              {formatBlogDate(post.publishedAt)}
            </span>
          </div>

          <h3 className="mt-3 font-display text-[1.16rem] font-extrabold leading-[1.25] tracking-[-0.02em] text-ink transition-colors duration-300 group-hover:text-[#0f6b5c]">
            {post.title}
          </h3>
          <p className="mt-2 line-clamp-3 font-sans text-[0.84rem] leading-[1.7] text-ink-2">
            {post.excerpt}
          </p>

          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-[#eef5f2] pt-4 text-[0.68rem] text-ink-3">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3 w-3" strokeWidth={2} /> {post.readMinutes} min read
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MessageSquare className="h-3 w-3" strokeWidth={2} /> {post.commentCount}
            </span>
            <span className="ml-auto inline-flex items-center gap-1 font-display text-[0.68rem] font-bold text-[#0f6b5c]">
              Read
              <ArrowUpRight
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                strokeWidth={2.4}
              />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

export function BlogFeed({ posts }: { posts: BlogCardPost[] }) {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of posts) map.set(p.category, (map.get(p.category) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [posts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (category !== "All" && p.category !== category) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [posts, category, query]);

  return (
    <div>
      <div className="flex flex-col gap-4 rounded-[1.4rem] border border-[#eaf3f0] bg-white/80 p-3 shadow-[0_20px_44px_-40px_rgba(6,46,40,0.45)] backdrop-blur-sm sm:flex-row sm:items-center">
        <label className="flex flex-1 items-center gap-2.5 rounded-full border border-[#e3ede9] bg-white px-4 py-2.5 focus-within:border-[#0f6b5c] focus-within:ring-4 focus-within:ring-[#0f6b5c]/10">
          <Search className="h-4 w-4 shrink-0 text-[#8ba19b]" strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the journal — IELTS tips, speaking habits, study plans…"
            aria-label="Search articles"
            className="w-full bg-transparent font-sans text-[0.85rem] text-ink outline-none placeholder:text-ink-3/80"
          />
        </label>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Chip active={category === "All"} onClick={() => setCategory("All")} count={posts.length}>
          All stories
        </Chip>
        {categories.map(([name, count]) => (
          <Chip key={name} active={category === name} onClick={() => setCategory(name)} count={count}>
            {name}
          </Chip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10 rounded-[1.6rem] border border-dashed border-[#cfe3da] bg-white/70 px-6 py-16 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#eaf7f3] text-[#0f6b5c]">
            <Sparkles className="h-6 w-6" strokeWidth={1.9} />
          </span>
          <p className="mt-4 font-display text-[1.05rem] font-extrabold text-ink">
            No articles match that search
          </p>
          <p className="mx-auto mt-1 max-w-sm font-sans text-[0.85rem] text-ink-3">
            Try a different word, or clear the filters to see every story.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("All");
            }}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#0f6b5c] px-5 py-2.5 font-display text-[0.78rem] font-bold text-white transition hover:bg-[#0a4e43]"
          >
            Show everything <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post, i) => (
            <PostCard key={post.id} post={post} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
