"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BadgeCheck, MessageCircle, Pin, Send, ThumbsUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBodyScrollLock } from "@/lib/hooks";
import { FocusTrap, useEscapeKey } from "@/components/ui/FocusTrap";

interface CommentItem {
  id: string;
  name: string;
  image: string | null;
  text: string;
  likes: number;
  adminLiked: boolean;
  pinned: boolean;
  createdAt: string;
  likedTmp?: boolean;
}

const ease = [0.16, 1, 0.3, 1] as const;

/** Per-session comment cache — reopening a discussion renders instantly, then
 *  refreshes in the background. */
const commentCache = new Map<string, CommentItem[]>();

export function NewsCommentsPanel({
  slug,
  postTitle,
  open,
  onClose,
  onPosted,
}: {
  slug: string;
  postTitle: string;
  open: boolean;
  onClose: () => void;
  onPosted?: () => void;
}) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const reduce = useReducedMotion();

  useBodyScrollLock(open);
  useEscapeKey(onClose, open);

  const load = useCallback(() => {
    const cached = commentCache.get(slug);
    if (cached) setComments(cached);
    setLoading(!cached);
    fetch(`/api/news/${encodeURIComponent(slug)}/comments`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && Array.isArray(d.comments)) {
          setComments(d.comments);
          commentCache.set(slug, d.comments);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    // Load comments only once the panel opens (data is fetched on demand).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) load();
  }, [open, load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/news/${encodeURIComponent(slug)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), text: text.trim() }),
      });
      const d = await res.json().catch(() => null);
      if (!res.ok) {
        setError((d && (d.message || "Could not post comment.")) ?? "Could not post comment.");
        return;
      }
      if (d?.comment) {
        setComments((c) => {
          const list = [d.comment as CommentItem, ...c];
          commentCache.set(slug, list);
          return list;
        });
        onPosted?.();
      }
      setText("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const toggleLike = async (c: CommentItem) => {
    if (c.likedTmp) return;
    setComments((list) => list.map((x) => (x.id === c.id ? { ...x, likedTmp: true, likes: x.likes + 1 } : x)));
    const res = await fetch(`/api/news/${encodeURIComponent(slug)}/comments/${c.id}/like`, { method: "POST" }).catch(() => null);
    if (!res?.ok) load();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            aria-label="Close comments"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[105] cursor-default bg-ink/40 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: reduce ? 0 : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: reduce ? 0 : "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed inset-y-0 right-0 z-[110] flex w-[min(26rem,94vw)] flex-col bg-ivory shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Comments"
          >
            <FocusTrap active={open} className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-ink/[0.06] px-6 py-4">
                <div className="min-w-0">
                  <p className="font-mono text-[0.58rem] font-bold uppercase tracking-[0.3em] text-brand-deep">
                    Discussion
                  </p>
                  <p className="truncate font-display text-[0.98rem] font-black tracking-tight text-ink">
                    {postTitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-ink/10 bg-white text-ink transition-all hover:bg-ink hover:text-ivory"
                >
                  <X className="h-5 w-5" strokeWidth={1.9} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5">
                {loading ? (
                  <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand/25 border-t-brand-deep" />
                    <p className="font-mono text-[0.68rem] text-ink-3">Loading comments…</p>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="py-12 text-center">
                    <MessageCircle className="mx-auto h-8 w-8 text-ink/20" strokeWidth={1.6} />
                    <p className="mt-4 font-display text-[0.95rem] font-bold text-ink-2">No comments yet</p>
                    <p className="mt-1 font-mono text-[0.66rem] text-ink-3">Be the first to join the conversation.</p>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {comments.map((c) => (
                      <li key={c.id} className={cn("rounded-2xl border p-4", c.pinned ? "border-gold/30 bg-amber-50/40" : "border-ink/[0.06] bg-white")}>
                        <div className="flex items-start gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-brand/15 to-brand-magenta/15 font-display text-sm font-black text-brand-deep">
                            {c.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={c.image} alt="" className="h-full w-full object-cover" />
                            ) : (
                              (c.name.charAt(0) ?? "U").toUpperCase()
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-display text-[0.82rem] font-extrabold text-ink">{c.name}</span>
                              {c.pinned && (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-gold/15 px-1.5 py-0.5 text-[0.52rem] font-bold uppercase tracking-wider text-gold-deep">
                                  <Pin className="h-2.5 w-2.5" /> Pinned
                                </span>
                              )}
                              {c.adminLiked && (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-brand/[0.08] px-1.5 py-0.5 text-[0.52rem] font-bold uppercase tracking-wider text-brand-deep">
                                  <BadgeCheck className="h-2.5 w-2.5" /> Endorsed
                                </span>
                              )}
                            </div>
                            <p className="mt-1 whitespace-pre-wrap text-[0.85rem] leading-relaxed text-ink-2">{c.text}</p>
                            <div className="mt-2.5 flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => toggleLike(c)}
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-display text-[0.64rem] font-bold transition-all",
                                  "border-ink/10 text-ink-3 hover:border-brand/45 hover:text-brand-deep",
                                  c.likedTmp && "border-brand/40 text-brand-deep"
                                )}
                              >
                                <ThumbsUp className="h-3 w-3" strokeWidth={2.2} /> {c.likes}
                              </button>
                              <span className="font-mono text-[0.58rem] text-ink-3">
                                {new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <form onSubmit={submit} className="border-t border-ink/[0.06] bg-white p-5">
                {error ? <p className="mb-2 rounded-lg bg-rose-50 px-3 py-2 text-[0.72rem] font-medium text-rose-600">{error}</p> : null}
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={60}
                  placeholder="Your name"
                  className="w-full rounded-xl border border-ink/10 bg-[#faf8f4] px-4 py-2.5 text-[0.85rem] text-ink outline-none placeholder:text-ink-3/70 focus:border-brand focus:bg-white"
                />
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  required
                  maxLength={2000}
                  rows={3}
                  placeholder={`Comment on "${postTitle}"…`}
                  className="mt-2 w-full resize-none rounded-xl border border-ink/10 bg-[#faf8f4] px-4 py-3 text-[0.85rem] leading-relaxed text-ink outline-none placeholder:text-ink-3/70 focus:border-brand focus:bg-white"
                />
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="font-mono text-[0.56rem] text-ink-3">{text.length}/2000</span>
                  <button
                    type="submit"
                    disabled={busy || !name.trim() || !text.trim()}
                    className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 font-display text-[0.72rem] font-bold text-ivory transition-all hover:bg-brand-deep disabled:opacity-50"
                  >
                    {busy ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Send className="h-3.5 w-3.5" />}
                    Post comment
                  </button>
                </div>
              </form>
            </FocusTrap>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}