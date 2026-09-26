"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Pin, ThumbsUp, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionTitle, SearchBox } from "./ui";

interface CommentRow {
  id: string;
  postSlug: string;
  postTitle: string;
  name: string;
  text: string;
  likes: number;
  adminLiked: boolean;
  pinned: boolean;
  hidden: boolean;
  createdAt: string;
}

const ease = [0.16, 1, 0.3, 1] as const;

export function AdminNewsComments() {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");

  const fetchAll = useCallback(() => {
    fetch("/api/admin/news/comments")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && Array.isArray(d.comments)) { setComments(d.comments); setLoaded(true); } })
      .catch(() => {});
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = useMemo(() => {
    if (!search) return comments;
    const q = search.toLowerCase();
    return comments.filter((c) => c.text.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.postTitle.toLowerCase().includes(q) || c.postSlug.toLowerCase().includes(q));
  }, [comments, search]);

  const patch = async (id: string, payload: Partial<Pick<CommentRow, "pinned" | "adminLiked" | "hidden">>) => {
    setBusy(true);
    try { await fetch(`/api/admin/news/comments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); fetchAll(); }
    finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this comment?")) return;
    setBusy(true);
    try { await fetch(`/api/admin/news/comments/${id}`, { method: "DELETE" }); fetchAll(); }
    finally { setBusy(false); }
  };

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionTitle kicker="Moderation · comments" title="News Comments" />
        <p className="font-mono text-[0.62rem] uppercase tracking-widest text-ink-3">
          {comments.length} comments · {comments.filter((c) => c.pinned).length} pinned
        </p>
      </div>
      <SearchBox value={search} onChange={setSearch} placeholder="Search by name, content, post…" />
      {!loaded ? (
        <div className="glass-dash grid place-items-center overflow-hidden rounded-[1.75rem] px-6 py-20 text-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand/25 border-t-brand-deep" />
          <p className="mt-4 font-mono text-[0.72rem] text-ink-3">Loading comments…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-dash grid place-items-center overflow-hidden rounded-[1.75rem] px-6 py-16 text-center">
          <MessageCircle className="h-8 w-8 text-ink/15" strokeWidth={1.5} />
          <p className="mt-3 font-display text-[0.95rem] font-bold text-ink-2">No comments found</p>
        </div>
      ) : (
        filtered.map((c, i) => (
          <motion.article
            key={c.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease, delay: Math.min(0.12, i * 0.03) }}
            className={cn("glass-dash flex flex-col gap-3 rounded-[1.25rem] p-5 transition-all", c.hidden && "opacity-50")}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-[0.85rem] font-extrabold text-ink">{c.name}</span>
                  {c.pinned && <span className="inline-flex items-center gap-0.5 rounded-full bg-gold/15 px-1.5 py-0.5 font-mono text-[0.52rem] font-bold uppercase tracking-wider text-gold-deep"><Pin className="h-2.5 w-2.5" /> Pinned</span>}
                  {c.adminLiked && <span className="inline-flex items-center gap-0.5 rounded-full bg-brand/[0.08] px-1.5 py-0.5 font-mono text-[0.52rem] font-bold uppercase tracking-wider text-brand-deep"><ThumbsUp className="h-2.5 w-2.5" /> Endorsed</span>}
                  {c.hidden && <span className="rounded-full bg-rose-50 px-1.5 py-0.5 font-mono text-[0.52rem] font-bold text-rose-600">Hidden</span>}
                </div>
                <p className="mt-1 text-[0.82rem] text-ink-3">on <span className="font-semibold text-ink-2">{c.postTitle || c.postSlug}</span></p>
                <p className="mt-2 line-clamp-3 text-[0.88rem] leading-relaxed text-ink-2">{c.text}</p>
                <div className="mt-2 flex items-center gap-3 font-mono text-[0.58rem] text-ink-3">
                  <span>{c.likes} likes</span>
                  <span>{new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                <button type="button" title={c.pinned ? "Unpin" : "Pin"} onClick={() => patch(c.id, { pinned: !c.pinned })} disabled={busy}
                  className={cn("grid h-9 w-9 place-items-center rounded-full border transition-all disabled:opacity-50", c.pinned ? "border-gold/50 bg-gold/10 text-gold-deep" : "border-ink/12 text-ink-2 hover:border-brand/40 hover:text-brand-deep")}>
                  <Pin className="h-4 w-4" />
                </button>
                <button type="button" title={c.adminLiked ? "Remove" : "Endorse"} onClick={() => patch(c.id, { adminLiked: !c.adminLiked })} disabled={busy}
                  className={cn("grid h-9 w-9 place-items-center rounded-full border transition-all disabled:opacity-50", c.adminLiked ? "border-brand/50 bg-brand/10 text-brand-deep" : "border-ink/12 text-ink-2 hover:border-brand/40 hover:text-brand-deep")}>
                  <ThumbsUp className="h-4 w-4" />
                </button>
                <button type="button" title={c.hidden ? "Show" : "Hide"} onClick={() => patch(c.id, { hidden: !c.hidden })} disabled={busy}
                  className={cn("grid h-9 w-9 place-items-center rounded-full border transition-all disabled:opacity-50", c.hidden ? "border-rose-500 bg-rose-50 text-rose-600" : "border-ink/12 text-ink-2 hover:border-rose-300 hover:text-rose-500")}>
                  <span className="sr-only">{c.hidden ? "Show" : "Hide"}</span>●
                </button>
                <button type="button" title="Delete" onClick={() => remove(c.id)} disabled={busy}
                  className="grid h-9 w-9 place-items-center rounded-full border border-rose-200 text-rose-500 transition-all hover:bg-rose-50 disabled:opacity-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.article>
        ))
      )}
    </section>
  );
}