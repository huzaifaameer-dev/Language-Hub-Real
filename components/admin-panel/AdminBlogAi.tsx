"use client";

import { useState } from "react";
import { Check, RefreshCw, Sparkles } from "lucide-react";
import { GlassPanel } from "./ui";
import { Markdown } from "@/components/ai/Markdown";

interface AiDraft {
  title: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  tags: string[];
  slug: string;
}

/** "Generate with AI" bar for the Blog tab — draft, preview, then publish. */
export function AdminBlogAi() {
  const [topic, setTopic] = useState("");
  const [draft, setDraft] = useState<AiDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const generate = async () => {
    if (busy || topic.trim().length < 4) return;
    setBusy(true);
    setDraft(null);
    setPublished(null);
    setErr(null);
    try {
      const res = await fetch("/api/ai/agent/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
      });
      if (!res.ok) throw new Error("Generation failed.");
      const d = (await res.json()) as { post: AiDraft };
      setDraft(d.post);
      setTopic("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not generate.");
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (!draft || publishing) return;
    setPublishing(true);
    setErr(null);
    try {
      const res = await fetch("/api/ai/agent/blog/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft }),
      });
      if (!res.ok) throw new Error("Publish failed.");
      const d = (await res.json()) as { article: string };
      setPublished(d.article);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not publish.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <GlassPanel>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-3 font-display text-[0.62rem] font-bold uppercase tracking-[0.4em] text-brand-deep">
            <span aria-hidden className="h-px w-7 bg-gradient-to-r from-brand/80 to-transparent" />
            AI content studio
          </p>
          <h3 className="mt-1 font-display text-[1.2rem] font-extrabold tracking-[-0.02em] text-ink">
            Generate a post with AI — review it, then publish
          </h3>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void generate()}
          placeholder="Topic… e.g. Common mistakes in IELTS Speaking"
          className="h-11 flex-1 rounded-xl border border-ink/12 bg-white/80 px-4 text-[0.9rem] outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/[0.08]"
        />
        <button
          type="button"
          onClick={() => void generate()}
          disabled={busy || topic.trim().length < 4}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-deep to-brand-magenta px-6 font-display text-[0.72rem] font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-40"
        >
          {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {busy ? "Writing…" : "Generate with AI"}
        </button>
      </div>

      {err && <p className="mt-3 font-mono text-[0.72rem] font-bold text-rose-600">{err}</p>}

      {draft && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-ink/10 bg-white">
          {draft.coverImage && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={draft.coverImage} alt="AI cover art" className="h-40 w-full object-cover" />
          )}
          <div className="p-5">
            <p className="font-display text-[1.15rem] font-extrabold leading-tight text-ink">{draft.title}</p>
            <p className="mt-1.5 font-serif text-[0.9rem] italic text-ink-2">{draft.excerpt}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {draft.tags.map((t) => (
                <span key={t} className="rounded-full border border-brand/20 bg-brand/[0.05] px-2.5 py-0.5 font-mono text-[0.58rem] font-bold text-brand-deep">
                  #{t}
                </span>
              ))}
            </div>
            <div className="mt-4 max-h-64 overflow-y-auto rounded-xl border border-ink/[0.07] bg-[#faf8f4] px-4 py-3">
              <Markdown text={draft.content} />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void publish()}
                disabled={publishing}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 font-display text-[0.72rem] font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50"
              >
                {publishing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {publishing ? "Publishing…" : "Publish post"}
              </button>
              <button
                type="button"
                onClick={() => { setDraft(null); setPublished(null); }}
                className="inline-flex h-10 items-center rounded-xl border border-ink/12 px-4 font-display text-[0.7rem] font-bold text-ink-2 transition-all hover:border-rose-300 hover:text-rose-600"
              >
                Discard
              </button>
              {published && (
                <a href={published} className="inline-flex items-center gap-1.5 font-mono text-[0.7rem] font-bold text-emerald-600 hover:underline">
                  Published ✓ View post →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </GlassPanel>
  );
}