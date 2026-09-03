"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import NextImage from "next/image";
import { motion } from "framer-motion";
import { Check, Eye, EyeOff, ImagePlus, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionTitle, SearchBox, StatusPill } from "./ui";

interface BlogRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  author: string;
  tags: string[];
  published: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

const ease = [0.16, 1, 0.3, 1] as const;

export function AdminBlog() {
  const [posts, setPosts] = useState<BlogRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<BlogRow | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchAll = useCallback(() => {
    fetch("/api/admin/blog")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.posts)) {
          setPosts(data.posts);
          setLoaded(true);
        }
      })
      .catch(() => {})
      .finally(() => setBusy(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = useMemo(() => {
    if (!search) return posts;
    const q = search.toLowerCase();
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q))
    );
  }, [posts, search]);

  const togglePublished = async (row: BlogRow) => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/blog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, payload: { published: !row.published } }),
      });
      if (res.ok) fetchAll();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row: BlogRow) => {
    if (!window.confirm(`Delete "${row.title}"?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/blog?id=${row.id}`, { method: "DELETE" });
      if (res.ok) fetchAll();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionTitle kicker="Content · blog" title="Blog Posts" />
        <button
          type="button"
          onClick={() => { setCreating(true); setEditing(null); }}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-deep to-brand-deep px-4 py-2.5 font-display text-[0.72rem] font-bold text-white shadow-[0_14px_30px_-12px_rgb(110_90_224/0.8)] hover:brightness-110"
        >
          <Plus className="h-3.5 w-3.5" /> New post
        </button>
      </div>

      <p className="font-mono text-[0.62rem] uppercase tracking-widest text-ink-3">
        {posts.filter((p) => p.published).length} of {posts.length} published · edits go live instantly
      </p>

      {(creating || editing) && (
        <BlogEditor
          existing={editing}
          onDone={() => { setCreating(false); setEditing(null); fetchAll(); }}
        />
      )}

      <SearchBox value={search} onChange={setSearch} placeholder="Search by title, slug, tag…" />

      {!loaded ? (
        <div className="glass-dash grid place-items-center overflow-hidden rounded-[1.75rem] px-6 py-20 text-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand/25 border-t-brand-deep" />
          <p className="mt-4 font-mono text-[0.72rem] text-ink-3">Loading posts…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-dash grid place-items-center overflow-hidden rounded-[1.75rem] px-6 py-16 text-center">
          <p className="font-display text-4xl font-extrabold text-slate-200">∅</p>
          <p className="mt-3 font-display text-[0.95rem] font-bold text-ink-2">No posts yet</p>
          <p className="font-mono text-[0.7rem] text-ink-3">Create your first blog post to share insights with students.</p>
        </div>
      ) : (
        filtered.map((p, i) => (
          <motion.article
            key={p.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease, delay: Math.min(0.12, i * 0.03) }}
            className={cn(
              "glass-dash flex flex-wrap items-center gap-4 rounded-[1.25rem] p-5 transition-all",
              !p.published && "opacity-55"
            )}
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-[0.98rem] font-extrabold text-ink">{p.title}</h3>
                {p.tags.slice(0, 3).map((t) => (
                  <span key={t} className="rounded-full border border-ink/12 px-2 py-0.5 font-mono text-[0.55rem] text-ink-2">{t}</span>
                ))}
              </div>
              {p.excerpt ? (
                <p className="mt-1 line-clamp-1 text-[0.82rem] text-ink-3">{p.excerpt}</p>
              ) : null}
              <div className="mt-1.5 flex items-center gap-3 font-mono text-[0.58rem] text-ink-3">
                <span>/blog/{p.slug}</span>
                <span>{p.views} views</span>
                <span>{new Date(p.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill status={p.published ? "APPROVED" : "PENDING"} />
              <button
                type="button"
                title={p.published ? "Unpublish" : "Publish"}
                onClick={() => togglePublished(p)}
                disabled={busy}
                className="grid h-9 w-9 place-items-center rounded-full border border-ink/12 text-ink-2 transition-all hover:border-brand/40 hover:text-brand-deep disabled:opacity-50"
              >
                {p.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                type="button"
                title="Edit"
                onClick={() => { setEditing(p); setCreating(false); }}
                className="grid h-9 w-9 place-items-center rounded-full border border-ink/12 text-ink-2 transition-all hover:border-brand/40 hover:text-brand-deep"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                title="Delete"
                onClick={() => remove(p)}
                disabled={busy}
                className="grid h-9 w-9 place-items-center rounded-full border border-rose-200 text-rose-500 transition-all hover:bg-rose-50 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </motion.article>
        ))
      )}
    </section>
  );
}

function BlogEditor({ existing, onDone }: { existing: BlogRow | null; onDone: () => void }) {
  const [title, setTitle] = useState(existing?.title ?? "");
  const [excerpt, setExcerpt] = useState(existing?.excerpt ?? "");
  const [content, setContent] = useState(existing?.content ?? "");
  const [coverImage, setCoverImage] = useState(existing?.coverImage ?? "");
  const [tags, setTags] = useState(existing?.tags.join(", ") ?? "");
  const [published, setPublished] = useState(existing?.published ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverBusy, setCoverBusy] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const uploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setCoverError("Please choose an image (JPG, PNG or WebP).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setCoverError("Image too large (max 8 MB).");
      return;
    }
    setCoverBusy(true);
    setCoverError(null);
    try {
      const dataUrl = await resizeImage(file, 1600);
      const res = await fetch("/api/admin/blog/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCoverError(data.message ?? "Could not upload the image.");
        return;
      }
      setCoverImage(data.url);
    } catch {
      setCoverError("Network error. Please try again.");
    } finally {
      setCoverBusy(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
      const payload = { title, excerpt, content, coverImage, tags: tagList, published };

      if (existing) {
        const res = await fetch("/api/admin/blog", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: existing.id, payload }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.message ?? "Failed to save.");
          return;
        }
      } else {
        const res = await fetch("/api/admin/blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.message ?? "Failed to create.");
          return;
        }
      }
      onDone();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="rounded-2xl border border-brand/20 bg-white/70 p-5 backdrop-blur-md">
      <p className="font-display text-[0.85rem] font-extrabold text-ink">
        {existing ? "Edit blog post" : "New blog post"}
      </p>

      <div className="mt-4 grid gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Post title"
          className="rounded-xl border border-ink/12 bg-white/70 px-4 py-2.5 text-[0.85rem] outline-none focus:border-brand"
        />
        <input
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Short excerpt (shown in list)"
          maxLength={300}
          className="rounded-xl border border-ink/12 bg-white/70 px-4 py-2.5 text-[0.85rem] outline-none focus:border-brand"
        />
        <div>
          <p className="mb-1.5 font-display text-[0.66rem] font-bold uppercase tracking-[0.2em] text-ink-2">
            Cover image
          </p>
          <input
            ref={coverRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={uploadCover}
          />
          {coverImage ? (
            <div className="flex items-center gap-3">
              <NextImage
                src={coverImage}
                alt="Cover preview"
                width={144}
                height={80}
                className="h-20 w-36 rounded-xl border border-ink/10 object-cover"
              />
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => coverRef.current?.click()}
                  disabled={coverBusy}
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-white/70 px-4 py-2 font-display text-[0.68rem] font-bold text-ink-2 transition-all hover:border-brand/45 hover:text-brand-deep disabled:opacity-50"
                >
                  <ImagePlus className="h-3.5 w-3.5" /> Replace
                </button>
                <button
                  type="button"
                  onClick={() => setCoverImage("")}
                  className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 font-display text-[0.68rem] font-bold text-rose-600 transition-all hover:bg-rose-100"
                >
                  <X className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => coverRef.current?.click()}
              disabled={coverBusy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-ink/15 bg-white/60 px-4 py-6 font-display text-[0.78rem] font-bold text-ink-2 transition-all hover:border-brand/50 hover:text-brand-deep disabled:opacity-50"
            >
              {coverBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              {coverBusy ? "Uploading…" : "Click to select cover image"}
            </button>
          )}
          {coverError ? (
            <p className="mt-1.5 text-[0.8rem] font-medium text-rose-600">{coverError}</p>
          ) : null}
        </div>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags (comma-separated: ielts, tips, grammar)"
          className="rounded-xl border border-ink/12 bg-white/70 px-4 py-2.5 text-[0.85rem] outline-none focus:border-brand"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          placeholder="Write your post in Markdown…"
          rows={14}
          className="w-full resize-none rounded-xl border border-ink/12 bg-white/70 px-4 py-3 font-mono text-[0.82rem] leading-relaxed outline-none focus:border-brand"
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-ink/12 bg-white/70 px-4 py-2 font-display text-[0.72rem] font-bold text-ink-2 transition-all hover:border-brand/45">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="accent-brand-deep"
          />
          Publish immediately
        </label>
      </div>

      {error ? <p className="mt-2 text-[0.8rem] font-medium text-rose-600">{error}</p> : null}

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className="inline-flex items-center gap-2 rounded-full border border-ink/12 px-5 py-2.5 font-display text-[0.72rem] font-bold text-ink-2 hover:bg-white"
        >
          <X className="h-4 w-4" /> Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-deep to-brand-deep px-5 py-2.5 font-display text-[0.72rem] font-bold text-white hover:brightness-110 disabled:opacity-50"
        >
          {saving ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Check className="h-4 w-4" />}
          {existing ? "Save changes" : "Create post"}
        </button>
      </div>
    </form>
  );
}

/** Downscale an image client-side to a data URL (max dimension `max` px). */
function resizeImage(file: File, max: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL(file.type === "image/png" ? "image/png" : "image/webp", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Bad image"));
    };
    img.src = url;
  });
}
