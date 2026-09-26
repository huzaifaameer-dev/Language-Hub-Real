"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import NextImage from "next/image";
import { motion } from "framer-motion";
import { Check, ChevronDown, ChevronUp, Eye, EyeOff, ImagePlus, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NEWS_ROLE_LIST } from "@/lib/news-roles";
import { SectionTitle, SearchBox, StatusPill } from "./ui";

const ease = [0.16, 1, 0.3, 1] as const;

/* ─────────────────────────────────────────────
 *  Block-based News Section Editor
 *
 *  Each block is either a paragraph/heading (text)
 *  or an uploaded image. Admin arranges sections freely;
 *  the rendered article converts blocks to clean markdown.
 * ───────────────────────────────────────────── */

type BlockKind = "p" | "h2" | "h3" | "image";

interface Block {
  id: number;
  kind: BlockKind;
  text?: string;
  imageUrl?: string;
}

/* ─── Markdown ↔ Block conversion ─── */

function blocksToMarkdown(blocks: Block[]): string {
  return blocks
    .map((b) => {
      if (b.kind === "image") return `![Image](${b.imageUrl ?? ""})`;
      return b.text ?? "";
    })
    .join("\n\n");
}

function markdownToBlocks(body: string): Block[] {
  if (!body.trim()) return [{ id: 1, kind: "p", text: "" }];
  const lines = body.split("\n");
  const blocks: Block[] = [];
  let id = 0;
  let buf = "";

  const flush = () => {
    const t = buf.trim();
    if (t) blocks.push({ id: ++id, kind: "p", text: t });
    buf = "";
  };

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.*)$/);
    const h3 = line.match(/^###\s+(.*)$/);
    const img = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (h2) { flush(); blocks.push({ id: ++id, kind: "h2", text: h2[1] }); continue; }
    if (h3) { flush(); blocks.push({ id: ++id, kind: "h3", text: h3[1] }); continue; }
    if (img) { flush(); blocks.push({ id: ++id, kind: "image", imageUrl: img[2] }); continue; }
    if (buf) buf += "\n" + line; else buf = line;
  }
  flush();
  if (blocks.length === 0) blocks.push({ id: 1, kind: "p", text: "" });
  return blocks;
}

/* ─── Image upload helper ─── */

async function uploadImage(file: File): Promise<string | null> {
  if (!file || !file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) return null;
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error("Canvas")); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL(file.type === "image/png" ? "image/png" : "image/webp", 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Bad image")); };
    img.src = url;
  });
  const res = await fetch("/api/admin/news/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl }),
  });
  const data = await res.json().catch(() => null);
  return res.ok ? (data.url as string) : null;
}

/* ─── AdminNews (list + create/edit) ─── */

export function AdminNews() {
  const [posts, setPosts] = useState<NewsRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<NewsRow | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchAll = useCallback(() => {
    fetch("/api/admin/news")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && Array.isArray(d.posts)) { setPosts(d.posts); setLoaded(true); }
      })
      .catch(() => {})
      .finally(() => setBusy(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = useMemo(() => {
    if (!search) return posts;
    const q = search.toLowerCase();
    return posts.filter(
      (p) => p.title.toLowerCase().includes(q) || p.author.toLowerCase().includes(q) || p.tags.some((t) => t.includes(q))
    );
  }, [posts, search]);

  const togglePublished = async (row: NewsRow) => {
    setBusy(true);
    try { await fetch("/api/admin/news", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: row.id, payload: { published: !row.published } }) }); fetchAll(); } finally { setBusy(false); }
  };

  const remove = async (row: NewsRow) => {
    if (!window.confirm(`Delete "${row.title}"?`)) return;
    setBusy(true);
    try { await fetch(`/api/admin/news?id=${row.id}`, { method: "DELETE" }); fetchAll(); } finally { setBusy(false); }
  };

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionTitle kicker="Content · daily news" title="News Posts" />
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

      {(creating || editing) && <NewsEditor existing={editing} onDone={() => { setCreating(false); setEditing(null); fetchAll(); }} />}

      <SearchBox value={search} onChange={setSearch} placeholder="Search by title, author, tag…" />

      {!loaded ? (
        <div className="glass-dash grid place-items-center overflow-hidden rounded-[1.75rem] px-6 py-20 text-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand/25 border-t-brand-deep" />
          <p className="mt-4 font-mono text-[0.72rem] text-ink-3">Loading posts…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-dash grid place-items-center overflow-hidden rounded-[1.75rem] px-6 py-16 text-center">
          <p className="font-display text-4xl font-extrabold text-slate-200">∅</p>
          <p className="mt-3 font-display text-[0.95rem] font-bold text-ink-2">No posts yet</p>
        </div>
      ) : (
        filtered.map((p, i) => (
          <motion.article
            key={p.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease, delay: Math.min(0.12, i * 0.03) }}
            className={cn("glass-dash flex flex-wrap items-center gap-4 rounded-[1.25rem] p-5 transition-all", !p.published && "opacity-55")}
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-[0.98rem] font-extrabold text-ink">{p.title}</h3>
                <span className="rounded-full border border-ink/12 px-2 py-0.5 font-mono text-[0.55rem] text-ink-2">{p.author}</span>
                {p.tags.slice(0, 2).map((t) => <span key={t} className="rounded-full border border-ink/12 px-2 py-0.5 font-mono text-[0.55rem] text-ink-2">{t}</span>)}
              </div>
              <div className="mt-1.5 flex items-center gap-3 font-mono text-[0.58rem] text-ink-3">
                <span>{p.views} views</span><span>{p.commentCount ?? 0} comments</span><span>{new Date(p.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill status={p.published ? "APPROVED" : "PENDING"} />
              <button type="button" title={p.published ? "Unpublish" : "Publish"} onClick={() => togglePublished(p)} disabled={busy}
                className="grid h-9 w-9 place-items-center rounded-full border border-ink/12 text-ink-2 transition-all hover:border-brand/40 hover:text-brand-deep disabled:opacity-50">
                {p.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button type="button" title="Edit" onClick={() => { setEditing(p); setCreating(false); }}
                className="grid h-9 w-9 place-items-center rounded-full border border-ink/12 text-ink-2 transition-all hover:border-brand/40 hover:text-brand-deep">
                <Pencil className="h-4 w-4" />
              </button>
              <button type="button" title="Delete" onClick={() => remove(p)} disabled={busy}
                className="grid h-9 w-9 place-items-center rounded-full border border-rose-200 text-rose-500 transition-all hover:bg-rose-50 disabled:opacity-50">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </motion.article>
        ))
      )}
    </section>
  );
}

/* ─── Block-based News Editor (create / edit) ─── */

interface NewsRow {
  id: string; slug: string; title: string; body: string; coverImage: string | null;
  author: string; authorRole: string; tags: string[]; published: boolean; pinned: boolean;
  views: number; commentCount: number; likeCount: number; createdAt: string; updatedAt: string;
}

function NewsEditor({ existing, onDone }: { existing: NewsRow | null; onDone: () => void }) {
  const [title, setTitle] = useState(existing?.title ?? "");
  const [blocks, setBlocks] = useState<Block[]>(() => existing?.body ? markdownToBlocks(existing.body) : [{ id: 1, kind: "p", text: "" }]);
  const [coverImage, setCoverImage] = useState(existing?.coverImage ?? "");
  const [authorName, setAuthorName] = useState(existing?.author ?? "Admin");
  const [authorRole, setAuthorRole] = useState<string>(existing?.authorRole ?? "teacher");
  const [tags, setTags] = useState(existing?.tags.join(", ") ?? "");
  const [published, setPublished] = useState(existing?.published ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverBusy, setCoverBusy] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [imgBusy, setImgBusy] = useState<number | null>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  /* ─── Cover image ─── */
  const uploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setCoverBusy(true);
    setCoverError(null);
    try {
      const url = await uploadImage(file);
      if (url) setCoverImage(url);
    } catch { setCoverError("Upload failed."); }
    setCoverBusy(false);
  };

  /* ─── Insert new text / image blocks ─── */
  const addBlock = (kind: BlockKind) => setBlocks((b) => [...b, { id: Date.now(), kind, text: kind !== "image" ? "" : undefined }]);

  const removeBlock = (id: number) => setBlocks((b) => b.filter((x) => x.id !== id));

  const moveBlock = (id: number, dir: -1 | 1) =>
    setBlocks((b) => {
      const i = b.findIndex((x) => x.id === id);
      if (i < 0) return b;
      const next = [...b];
      const j = i + dir;
      if (j < 0 || j >= next.length) return b;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const updateText = (id: number, text: string) =>
    setBlocks((b) => b.map((x) => (x.id === id ? { ...x, text } : x)));

  const handleImageUpload = async (blockId: number, file: File) => {
    setImgBusy(blockId);
    try {
      const url = await uploadImage(file);
      if (url) setBlocks((b) => b.map((x) => (x.id === blockId ? { ...x, imageUrl: url } : x)));
    } catch { /* abort */ }
    setImgBusy(null);
  };

  /* ─── Serialize ─── */
  const body = blocksToMarkdown(blocks);

  /* ─── Save ─── */
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("Please write a title first."); return; }
    if (!body.trim()) { setError("Please write your news content first."); return; }
    setSaving(true); setError(null);
    try {
      const payload = { title, body, coverImage, authorName, authorRole, tags: tags.split(",").map((t) => t.trim()).filter(Boolean), published };
      const url = "/api/admin/news";
      const res = await fetch(url, { method: existing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: existing ? JSON.stringify({ id: existing.id, payload }) : JSON.stringify(payload) });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        const first = d?.errors ? Object.values(d.errors).flat()[0] : undefined;
        setError(first ?? d?.message ?? "Failed to save.");
        return;
      }
      onDone();
    } catch { setError("Network error."); }
    setSaving(false);
  };

  return (
    <form onSubmit={save} className="rounded-2xl border border-brand/20 bg-white/70 p-5 backdrop-blur-md">
      <p className="font-display text-[0.85rem] font-extrabold text-ink">{existing ? "Edit news post" : "New news post"}</p>

      <div className="mt-4 grid gap-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Title"
          className="rounded-xl border border-ink/12 bg-white/70 px-4 py-2.5 text-[0.85rem] outline-none focus:border-brand" />

        <div className="grid grid-cols-2 gap-3">
          <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} required placeholder="Author name"
            className="rounded-xl border border-ink/12 bg-white/70 px-4 py-2.5 text-[0.85rem] outline-none focus:border-brand" />
          <select value={authorRole} onChange={(e) => setAuthorRole(e.target.value)}
            className="rounded-xl border border-ink/12 bg-white/70 px-4 py-2.5 text-[0.85rem] outline-none focus:border-brand">
            {NEWS_ROLE_LIST.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
        </div>

        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags (comma-separated)"
          className="rounded-xl border border-ink/12 bg-white/70 px-4 py-2.5 text-[0.85rem] outline-none focus:border-brand" />

        {/* Cover image */}
        <input ref={coverRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={uploadCover} />
        {coverImage ? (
          <div className="flex items-center gap-3">
            <NextImage src={coverImage} alt="Cover" width={160} height={90} className="h-20 w-36 rounded-xl border border-ink/10 object-cover" />
            <div className="flex flex-col gap-2">
              <button type="button" onClick={() => coverRef.current?.click()} disabled={coverBusy}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-white/70 px-3.5 py-2 font-display text-[0.68rem] font-bold text-ink-2 hover:border-brand/45 hover:text-brand-deep disabled:opacity-50">
                {coverBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />} Replace
              </button>
              <button type="button" onClick={() => setCoverImage("")}
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-2 font-display text-[0.68rem] font-bold text-rose-600 hover:bg-rose-100">
                <X className="h-3 w-3" /> Remove
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => coverRef.current?.click()} disabled={coverBusy}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-ink/15 bg-white/60 px-4 py-6 font-display text-[0.78rem] font-bold text-ink-2 hover:border-brand/50 hover:text-brand-deep disabled:opacity-50">
            {coverBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {coverBusy ? "Uploading…" : "Cover image (optional)"}
          </button>
        )}
        {coverError && <p className="text-[0.8rem] font-medium text-rose-600">{coverError}</p>}

        {/* ─── Block-based content sections ─── */}
        <div className="flex items-center justify-between border-t border-ink/[0.06] pt-4">
          <p className="font-display text-[0.66rem] font-bold uppercase tracking-[0.22em] text-ink-3">
            Content sections
          </p>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => addBlock("p")}
              className="inline-flex items-center gap-1 rounded-full border border-ink/12 bg-white px-3 py-1.5 font-display text-[0.64rem] font-bold text-ink-2 hover:border-brand/50 hover:text-brand-deep">
              <Plus className="h-3 w-3" /> Text
            </button>
            <button type="button" onClick={() => addBlock("h2")}
              className="inline-flex items-center gap-1 rounded-full border border-ink/12 bg-white px-3 py-1.5 font-display text-[0.64rem] font-bold text-ink-2 hover:border-brand/50 hover:text-brand-deep">
              <Plus className="h-3 w-3" /> Heading
            </button>
            <button type="button" onClick={() => addBlock("image")}
              className="inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand/[0.06] px-3 py-1.5 font-display text-[0.64rem] font-bold text-brand-deep hover:border-brand/50">
              <ImagePlus className="h-3 w-3" /> Image
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {blocks.map((b, i) => (
            <div key={b.id} className={cn(
              "rounded-xl border p-3 transition-all",
              b.kind === "image" ? "border-brand/20 bg-brand/[0.03]" : "border-ink/10 bg-white"
            )}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[0.55rem] font-bold uppercase tracking-[0.2em] text-ink-3">
                  {b.kind === "image" ? "Image" : b.kind === "h2" ? "Heading" : b.kind === "h3" ? "Subheading" : "Text"} section
                </span>
                <div className="flex items-center gap-1">
                  {i > 0 && <button type="button" onClick={() => moveBlock(b.id, -1)} className="grid h-6 w-6 place-items-center rounded-lg border border-ink/10 text-ink-3 hover:bg-ink/[0.06] hover:text-ink"><ChevronUp className="h-3.5 w-3.5" /></button>}
                  {i < blocks.length - 1 && <button type="button" onClick={() => moveBlock(b.id, 1)} className="grid h-6 w-6 place-items-center rounded-lg border border-ink/10 text-ink-3 hover:bg-ink/[0.06] hover:text-ink"><ChevronDown className="h-3.5 w-3.5" /></button>}
                  {blocks.length > 1 && <button type="button" onClick={() => removeBlock(b.id)} className="grid h-6 w-6 place-items-center rounded-lg border border-rose-200 text-rose-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3 w-3" /></button>}
                </div>
              </div>
              {b.kind === "image" ? (
                <div>
                  {b.imageUrl ? (
                    <div className="relative flex items-center gap-3">
                      <NextImage src={b.imageUrl} alt="Section image" width={160} height={90} className="h-24 w-40 rounded-lg border border-ink/10 object-cover" />
                      <button type="button" onClick={() => setBlocks((bl) => bl.map((x) => (x.id === b.id ? { ...x, imageUrl: undefined } : x)))}
                        className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 font-display text-[0.64rem] font-bold text-rose-600 hover:bg-rose-100">
                        <X className="h-3 w-3" /> Remove
                      </button>
                    </div>
                  ) : (
                    <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-brand/30 bg-white px-4 py-6 font-display text-[0.72rem] font-bold text-brand-deep hover:border-brand/60 hover:bg-brand/[0.03]">
                      {imgBusy === b.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                      {imgBusy === b.id ? "Uploading…" : "Upload image"}
                      <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden"
                        onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) await handleImageUpload(b.id, f); }} />
                    </label>
                  )}
                </div>
              ) : (
                <textarea
                  value={b.text ?? ""}
                  onChange={(e) => updateText(b.id, e.target.value)}
                  placeholder={b.kind === "h2" ? "Section heading…" : b.kind === "h3" ? "Subheading…" : "Write your text…"}
                  rows={b.kind === "h2" || b.kind === "h3" ? 1 : 3}
                  className="w-full resize-none bg-transparent px-1 py-0.5 font-mono text-[0.85rem] leading-relaxed text-ink outline-none focus:ring-1 focus:ring-brand/30 rounded"
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-ink/12 bg-white/70 px-4 py-2 font-display text-[0.72rem] font-bold text-ink-2 hover:border-brand/45">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="accent-brand-deep" />
            Publish immediately
          </label>
        </div>
      </div>
      {error && <p className="mt-2 text-[0.8rem] font-medium text-rose-600">{error}</p>}
      <div className="mt-4 flex items-center justify-end gap-2">
        <button type="button" onClick={onDone} className="inline-flex items-center gap-2 rounded-full border border-ink/12 px-5 py-2.5 font-display text-[0.72rem] font-bold text-ink-2 hover:bg-white">
          <X className="h-4 w-4" /> Cancel
        </button>
        <button type="submit" disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-deep to-brand-deep px-5 py-2.5 font-display text-[0.72rem] font-bold text-white hover:brightness-110 disabled:opacity-50">
          {saving ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Check className="h-4 w-4" />}
          {existing ? "Save" : "Publish"}
        </button>
      </div>
    </form>
  );
}