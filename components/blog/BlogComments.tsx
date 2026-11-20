"use client";

import { useState } from "react";
import { Loader2, MessageSquare, Send, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatBlogDate } from "@/lib/blog/format";

export interface BlogCommentView {
  id: string;
  name: string;
  body: string;
  createdAt: string;
}

function initials(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "LH"
  );
}

const field =
  "mt-1.5 w-full rounded-xl border border-[#e3ede9] bg-white px-3.5 py-2.5 font-sans text-[0.86rem] text-ink outline-none transition placeholder:text-[#9aada7] focus:border-[#0f6b5c] focus:ring-4 focus:ring-[#0f6b5c]/10";

export function BlogComments({
  slug,
  initial,
}: {
  slug: string;
  initial: BlogCommentView[];
}) {
  const [comments] = useState(initial);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/blog/${encodeURIComponent(slug)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, body, website }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? "Could not post your comment.");
      setDone(true);
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post your comment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="comments" className="mt-14 border-t border-[#e6f0ec] pt-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-display text-[0.6rem] font-bold uppercase tracking-[0.28em] text-[#0f6b5c]">
            The conversation
          </p>
          <h2 className="mt-2 font-display text-[clamp(1.4rem,3vw,1.9rem)] font-extrabold tracking-[-0.02em] text-ink">
            {comments.length} {comments.length === 1 ? "comment" : "comments"}
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf7f3] px-3 py-1.5 font-sans text-[0.68rem] font-semibold text-[#0a4e43]">
          <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.2} /> Moderated for a calm space
        </span>
      </div>

      <div className="mt-7 flex flex-col gap-4">
        {comments.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#d8ebe5] bg-[#fbfefd] px-5 py-8 text-center font-sans text-[0.88rem] text-ink-3">
            No comments yet — start the conversation below.
          </p>
        ) : (
          comments.map((c) => (
            <article
              key={c.id}
              className="flex gap-3.5 rounded-2xl border border-[#eef5f2] bg-white px-4 py-4 shadow-[0_14px_30px_-30px_rgba(6,46,40,0.5)] sm:px-5"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[linear-gradient(145deg,#14a08c,#0a4e43)] font-display text-[0.72rem] font-black text-white">
                {initials(c.name)}
              </span>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-[0.9rem] font-bold text-ink">{c.name}</span>
                  <span className="font-sans text-[0.68rem] text-ink-3">{formatBlogDate(c.createdAt)}</span>
                </p>
                <p className="mt-1 whitespace-pre-line font-sans text-[0.88rem] leading-[1.75] text-ink-2">
                  {c.body}
                </p>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="mt-8 rounded-[1.5rem] border border-[#e6f0ec] bg-white p-5 shadow-[0_24px_50px_-44px_rgba(6,46,40,0.5)] sm:p-7">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eaf7f3] text-[#0d6a58]">
            <MessageSquare className="h-5 w-5" strokeWidth={1.9} />
          </span>
          <div>
            <h3 className="font-display text-[1.02rem] font-extrabold text-ink">Leave a comment</h3>
            <p className="font-sans text-[0.76rem] text-ink-3">
              Your note appears after a quick review — usually within a few hours.
            </p>
          </div>
        </div>

        {done ? (
          <div className="mt-5 rounded-xl border border-[#cdebE3] bg-[#f3fbf8] px-4 py-4 font-sans text-[0.86rem] text-[#0a4e43]">
            Thank you — your comment is in review and will appear shortly.
            <button
              type="button"
              onClick={() => setDone(false)}
              className="ml-2 font-display font-bold underline decoration-[#7ec9b8] underline-offset-2"
            >
              Write another
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="font-sans text-[0.7rem] font-semibold text-[#44615a]">Your name</span>
                <input
                  required
                  minLength={2}
                  maxLength={60}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ayesha Khan"
                  className={field}
                />
              </label>
              <label className="block">
                <span className="font-sans text-[0.7rem] font-semibold text-[#44615a]">Email (never published)</span>
                <input
                  required
                  type="email"
                  maxLength={160}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={field}
                />
              </label>
            </div>

            {/* honeypot */}
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              aria-hidden="true"
              className="hidden"
            />

            <label className="block">
              <span className="font-sans text-[0.7rem] font-semibold text-[#44615a]">Your comment</span>
              <textarea
                required
                minLength={4}
                maxLength={1500}
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Share a thought, a question, or a tip that helped you."
                className={cn(field, "min-h-28 resize-y")}
              />
            </label>

            {error && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 font-sans text-[0.82rem] text-rose-600">
                {error}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-sans text-[0.68rem] text-ink-3">
                Be kind, stay on topic, no spam or links.
              </p>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[#0f6b5c] px-6 font-display text-[0.78rem] font-bold uppercase tracking-[0.1em] text-white shadow-[0_16px_30px_-18px_rgba(15,107,92,0.9)] transition hover:-translate-y-0.5 hover:bg-[#0a4e43] disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" strokeWidth={2.2} />}
                {busy ? "Posting…" : "Post comment"}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
