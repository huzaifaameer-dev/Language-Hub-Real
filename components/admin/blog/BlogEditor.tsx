"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Eraser,
  Eye,
  Heading2,
  Heading3,
  Highlighter,
  ImagePlus,
  Italic,
  Images,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Palette,
  Pencil,
  Plus,
  Quote,
  Redo2,
  Save,
  Send,
  Strikethrough,
  Trash2,
  Type,
  Underline,
  Undo2,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { estimateReadMinutes, sanitizeBlogHtml } from "@/lib/blog/sanitize";

export interface EditorPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  category: string;
  tags: string[];
  author: string;
  authorRole: string;
  status: "DRAFT" | "PUBLISHED";
  featured: boolean;
  readMinutes: number;
  views: number;
  publishedAt: string | null;
}

const CATEGORIES = [
  "Speaking",
  "IELTS",
  "PTE",
  "Study Tips",
  "Student Stories",
  "Academy News",
  "Journal",
];

const field =
  "mt-1.5 w-full rounded-xl border border-[#e3ede9] bg-white px-3.5 py-2.5 font-sans text-[0.84rem] text-[#10231f] outline-none transition placeholder:text-[#9aada7] focus:border-[#0d6a58] focus:ring-4 focus:ring-[#0d6a58]/10";

/* ─────────────────────────── image helpers ─────────────────────────── */

function downscale(file: File, maxWidth: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Only images are supported."));
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      reject(new Error("That image is larger than 12 MB."));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Could not read the image."));
        return;
      }
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/webp", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file could not be read as an image."));
    };
    img.src = url;
  });
}

/* ─────────────────────────── toolbar ───────────────────────────────── */

function ToolButton({
  label,
  onClick,
  children,
  active,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#44615a] transition hover:bg-[#eaf7f3] hover:text-[#0a4e43]",
        active && "bg-[#e4f6ee] text-[#0d6a58]"
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span aria-hidden className="mx-1 h-6 w-px shrink-0 bg-[#e8f2ed]" />;
}

const FONT_SIZES = [
  { label: "Small", value: "2" },
  { label: "Normal", value: "3" },
  { label: "Large", value: "5" },
  { label: "X-Large", value: "6" },
];

const FONT_FAMILIES = [
  { label: "Display", value: "Poppins, ui-sans-serif, sans-serif" },
  { label: "Body", value: "Inter, ui-sans-serif, sans-serif" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Mono", value: "ui-monospace, SFMono-Regular, Menlo, monospace" },
];

const COLORS = ["#0b1f1b", "#0f6b5c", "#14a08c", "#d0452b", "#a97a10", "#5b4bd6", "#8b5e34", "#6b7f79"];
const HIGHLIGHTS = ["#fff2b8", "#d9f7ea", "#fde2d9", "#e3e6ff", "#f6e7ff", "#e4f0ff", "#f0f0f0"];

/* ───────────────────────── inline figure staging ───────────────────────── */

type DraftImage = {
  id: string;
  data: string;
  name: string;
  alt: string;
  caption: string;
  size: "full" | "medium" | "small";
  align: "center" | "left" | "right";
};

const IMAGE_SIZES: Array<{ value: DraftImage["size"]; label: string; max: string }> = [
  { value: "full", label: "Full width", max: "100%" },
  { value: "medium", label: "Medium", max: "34rem" },
  { value: "small", label: "Small", max: "24rem" },
];

let draftCounter = 0;
function makeDraftId(): string {
  draftCounter += 1;
  return `img-${draftCounter}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Builds a self-contained figure: the sanitizer keeps these inline styles. */
function figureMarkup(img: DraftImage): string {
  const maxWidth = IMAGE_SIZES.find((s) => s.value === img.size)?.max ?? "100%";
  const margin =
    img.align === "center"
      ? "2rem auto"
      : img.align === "right"
        ? "2rem 0 2rem auto"
        : "2rem auto 2rem 0";
  const captionAlign = img.align === "left" ? "left" : img.align === "right" ? "right" : "center";
  const caption = img.caption.trim()
    ? `<figcaption style="margin-top: 0.6rem; font-size: 0.78rem; line-height: 1.55; color: #6b7f79; text-align: ${captionAlign};">${escapeHtml(
        img.caption.trim()
      )}</figcaption>`
    : "";
  return (
    `<figure style="margin: ${margin}; max-width: ${maxWidth};">` +
    `<img src="${img.data}" alt="${escapeHtml(img.alt.trim() || img.caption.trim() || img.name)}" style="width: 100%; height: auto; margin: 0; border-radius: 1rem;" />` +
    caption +
    `</figure><p><br></p>`
  );
}

/* ─────────────────────────── editor modal ──────────────────────────── */

export function BlogEditor({
  post,
  onClose,
  onSaved,
}: {
  post: EditorPost | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = !post;
  const editorRef = useRef<HTMLDivElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const bodyInputRef = useRef<HTMLInputElement>(null);
  const savedRange = useRef<Range | null>(null);

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [category, setCategory] = useState(post?.category ?? "Journal");
  const [tags, setTags] = useState((post?.tags ?? []).join(", "));
  const [author, setAuthor] = useState(post?.author ?? "Javaria Malik");
  const [authorRole, setAuthorRole] = useState(post?.authorRole ?? "Founder & CEO");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [cover, setCover] = useState<string | null>(post?.coverImage ?? null);
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">(post?.status ?? "DRAFT");
  const [featured, setFeatured] = useState(post?.featured ?? false);
  const [publishedAt, setPublishedAt] = useState(() => {
    const d = post?.publishedAt ? new Date(post.publishedAt) : new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [html, setHtml] = useState(post?.content ?? "<p><br></p>");
  const [previewHtml, setPreviewHtml] = useState("");
  const [busy, setBusy] = useState<"draft" | "publish" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"cover" | "body" | null>(null);
  const [drafts, setDrafts] = useState<DraftImage[]>([]);
  const [trayOpen, setTrayOpen] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  /* initialise the editable surface exactly once */
  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = post?.content || "<p><br></p>";
    try {
      document.execCommand("defaultParagraphSeparator", false, "p");
      document.execCommand("styleWithCSS", false, "true");
    } catch {
      /* older engines — defaults are fine */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const readMinutes = useMemo(() => estimateReadMinutes(html), [html]);
  const words = useMemo(
    () => html.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length,
    [html]
  );

  const syncHtml = () => {
    const next = editorRef.current?.innerHTML ?? "";
    setHtml(next);
    return next;
  };

  const cmd = (command: string, value?: string) => {
    editorRef.current?.focus();
    try {
      document.execCommand(command, false, value);
    } catch {
      /* ignore unsupported command */
    }
    syncHtml();
  };

  const block = (tag: string) => cmd("formatBlock", `<${tag}>`);

  const addLink = () => {
    const url = window.prompt("Link URL (https://…)");
    if (!url) return;
    cmd("createLink", url);
  };

  const pickCover = async (file: File | null) => {
    if (!file) return;
    setUploading("cover");
    setError(null);
    try {
      setCover(await downscale(file, 1600, 0.82));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload the image.");
    } finally {
      setUploading(null);
    }
  };

  const insertBodyImage = async (files: FileList | File[] | null) => {
    const list = files
      ? Array.from(files)
          .filter((f) => f.type.startsWith("image/"))
          .slice(0, 12)
      : [];
    if (!list.length) return;

    rememberSelection();
    setError(null);
    setUploading("body");
    setProgress({ done: 0, total: list.length });

    const added: DraftImage[] = [];
    for (const file of list) {
      try {
        const data = await downscale(file, 1200, 0.8);
        added.push({
          id: makeDraftId(),
          data,
          name: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || "Image",
          alt: "",
          caption: "",
          size: "full",
          align: "center",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not upload the image.");
      }
      setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
    }

    setUploading(null);
    setProgress(null);
    if (added.length) {
      setDrafts((d) => [...d, ...added]);
      setTrayOpen(true);
    }
  };

  const rememberSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (editorRef.current?.contains(range.commonAncestorContainer)) {
      savedRange.current = range.cloneRange();
    }
  };

  const updateDraft = (id: string, patch: Partial<DraftImage>) =>
    setDrafts((d) => d.map((img) => (img.id === id ? { ...img, ...patch } : img)));

  const insertDrafts = () => {
    if (!drafts.length) return;
    const html = drafts.map(figureMarkup).join("");
    editorRef.current?.focus();
    try {
      const sel = window.getSelection();
      if (savedRange.current && sel) {
        sel.removeAllRanges();
        sel.addRange(savedRange.current);
      }
      document.execCommand("insertHTML", false, html);
    } catch {
      editorRef.current?.insertAdjacentHTML("beforeend", html);
    }
    savedRange.current = null;
    setDrafts([]);
    setTrayOpen(false);
    syncHtml();
  };

  const insertSingleDraft = (id: string) => {
    const img = drafts.find((d) => d.id === id);
    if (!img) return;
    editorRef.current?.focus();
    try {
      document.execCommand("insertHTML", false, figureMarkup(img));
    } catch {
      editorRef.current?.insertAdjacentHTML("beforeend", figureMarkup(img));
    }
    setDrafts((d) => d.filter((x) => x.id !== id));
    if (drafts.length <= 1) setTrayOpen(false);
    syncHtml();
  };

  const openPreview = () => {
    const current = syncHtml();
    setPreviewHtml(sanitizeBlogHtml(current));
    setMode("preview");
  };

  const save = async (nextStatus: "DRAFT" | "PUBLISHED") => {
    setError(null);
    if (title.trim().length < 3) {
      setError("Give the story a title first.");
      return;
    }
    const content = sanitizeBlogHtml(syncHtml());
    if (nextStatus === "PUBLISHED" && content.replace(/<[^>]*>/g, "").trim().length < 20) {
      setError("Write a little more before publishing.");
      return;
    }

    setBusy(nextStatus === "DRAFT" ? "draft" : "publish");
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        excerpt: excerpt.trim(),
        content,
        coverImage: cover,
        category,
        tags: tags
          .split(",")
          .map((t) => t.trim().replace(/^#/, ""))
          .filter(Boolean)
          .slice(0, 12),
        author: author.trim(),
        authorRole: authorRole.trim(),
        status: nextStatus,
        featured,
        publishedAt: new Date(publishedAt).toISOString(),
        readMinutes,
      };

      const res = await fetch(isNew ? "/api/admin/blog" : `/api/admin/blog/${post.id}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? "Could not save this story.");

      setStatus(nextStatus);
      setSavedFlash(true);
      onSaved();
      window.setTimeout(() => setSavedFlash(false), 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this story.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-[#062e28]/50 backdrop-blur-sm">
      <div className="mx-auto my-3 w-full max-w-6xl px-2 sm:my-6 sm:px-4">
        <div className="overflow-hidden rounded-3xl bg-white shadow-[0_50px_120px_-40px_rgba(6,46,40,0.6)] ring-1 ring-[#eef5f1]">
          {/* header */}
          <div className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-[#f0f6f3] bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#eaf7f3] text-[#0d6a58]">
                <Pencil className="h-4 w-4" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-[0.95rem] font-bold text-[#10231f]">
                  {isNew ? "New journal story" : "Edit story"}
                </p>
                <p className="font-sans text-[0.66rem] text-[#8ba19b]">
                  {status === "PUBLISHED" ? "Published" : "Draft"} · {words} words · ~{readMinutes} min read
                </p>
              </div>
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              {savedFlash && (
                <span className="rounded-full bg-[#e4f6ee] px-3 py-1.5 font-sans text-[0.7rem] font-semibold text-[#0d6a58]">
                  Saved ✓
                </span>
              )}
              <button
                type="button"
                onClick={() => void save("DRAFT")}
                disabled={busy !== null}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#e3ede9] px-4 font-sans text-[0.76rem] font-semibold text-[#44615a] transition hover:border-[#cfe3da] hover:text-[#0d6a58] disabled:opacity-50"
              >
                {busy === "draft" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save draft
              </button>
              <button
                type="button"
                onClick={() => void save("PUBLISHED")}
                disabled={busy !== null}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#0d5c4d] px-4 font-display text-[0.78rem] font-bold text-white shadow-[0_12px_22px_-18px_rgba(13,92,77,0.9)] transition hover:bg-[#0a4e43] disabled:opacity-50"
              >
                {busy === "publish" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                {status === "PUBLISHED" ? "Update" : "Publish"}
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close editor"
                className="grid h-9 w-9 place-items-center rounded-full text-[#8ba19b] transition hover:bg-[#f1f8f4] hover:text-[#10231f]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
            {/* ── main column ── */}
            <div className="min-w-0 p-4 sm:p-6">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give this story a headline…"
                aria-label="Post title"
                className="w-full border-0 bg-transparent font-display text-[clamp(1.4rem,3vw,2rem)] font-extrabold leading-tight tracking-[-0.03em] text-[#10231f] outline-none placeholder:text-[#c3d3ce]"
              />

              <label className="mt-3 flex flex-wrap items-center gap-2 font-sans text-[0.7rem] text-[#8ba19b]">
                <span className="font-semibold text-[#44615a]">/blog/</span>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase())}
                  placeholder="auto-from-title"
                  className="min-w-0 flex-1 bg-transparent font-mono text-[0.72rem] text-[#44615a] outline-none"
                />
              </label>

              {/* toolbar */}
              <div className="mt-5 flex flex-wrap items-center gap-0.5 rounded-xl border border-[#e8f2ed] bg-[#fbfefd] p-1.5">
                <ToolButton label="Bold" onClick={() => cmd("bold")}>
                  <Bold className="h-3.5 w-3.5" strokeWidth={2.6} />
                </ToolButton>
                <ToolButton label="Italic" onClick={() => cmd("italic")}>
                  <Italic className="h-3.5 w-3.5" strokeWidth={2.4} />
                </ToolButton>
                <ToolButton label="Underline" onClick={() => cmd("underline")}>
                  <Underline className="h-3.5 w-3.5" strokeWidth={2.4} />
                </ToolButton>
                <ToolButton label="Strikethrough" onClick={() => cmd("strikeThrough")}>
                  <Strikethrough className="h-3.5 w-3.5" strokeWidth={2.2} />
                </ToolButton>

                <Divider />

                <ToolButton label="Heading 2" onClick={() => block("h2")}>
                  <Heading2 className="h-4 w-4" strokeWidth={2.1} />
                </ToolButton>
                <ToolButton label="Heading 3" onClick={() => block("h3")}>
                  <Heading3 className="h-4 w-4" strokeWidth={2.1} />
                </ToolButton>
                <ToolButton label="Paragraph" onClick={() => block("p")}>
                  <Type className="h-3.5 w-3.5" strokeWidth={2.2} />
                </ToolButton>
                <ToolButton label="Quote" onClick={() => block("blockquote")}>
                  <Quote className="h-3.5 w-3.5" strokeWidth={2.2} />
                </ToolButton>
                <ToolButton label="Code block" onClick={() => block("pre")}>
                  <Code2 className="h-3.5 w-3.5" strokeWidth={2.2} />
                </ToolButton>

                <Divider />

                <ToolButton label="Bulleted list" onClick={() => cmd("insertUnorderedList")}>
                  <List className="h-4 w-4" strokeWidth={2.1} />
                </ToolButton>
                <ToolButton label="Numbered list" onClick={() => cmd("insertOrderedList")}>
                  <ListOrdered className="h-4 w-4" strokeWidth={2.1} />
                </ToolButton>
                <ToolButton label="Align left" onClick={() => cmd("justifyLeft")}>
                  <AlignLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
                </ToolButton>
                <ToolButton label="Align centre" onClick={() => cmd("justifyCenter")}>
                  <AlignCenter className="h-3.5 w-3.5" strokeWidth={2.2} />
                </ToolButton>
                <ToolButton label="Align right" onClick={() => cmd("justifyRight")}>
                  <AlignRight className="h-3.5 w-3.5" strokeWidth={2.2} />
                </ToolButton>

                <Divider />

                <ToolButton label="Add link" onClick={addLink}>
                  <Link2 className="h-3.5 w-3.5" strokeWidth={2.2} />
                </ToolButton>
                <ToolButton
                  label={
                    uploading === "body"
                      ? `Optimising image ${progress?.done ?? 0} of ${progress?.total ?? 0}…`
                      : "Insert images (one or many)"
                  }
                  onClick={() => {
                    rememberSelection();
                    bodyInputRef.current?.click();
                  }}
                >
                  {uploading === "body" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ImagePlus className="h-3.5 w-3.5" strokeWidth={2.2} />
                  )}
                </ToolButton>
                <ToolButton label="Divider line" onClick={() => cmd("insertHorizontalRule")}>
                  <Minus className="h-3.5 w-3.5" strokeWidth={2.4} />
                </ToolButton>

                <Divider />

                <ToolButton label="Undo" onClick={() => cmd("undo")}>
                  <Undo2 className="h-3.5 w-3.5" strokeWidth={2.2} />
                </ToolButton>
                <ToolButton label="Redo" onClick={() => cmd("redo")}>
                  <Redo2 className="h-3.5 w-3.5" strokeWidth={2.2} />
                </ToolButton>
                <ToolButton label="Clear formatting" onClick={() => cmd("removeFormat")}>
                  <Eraser className="h-3.5 w-3.5" strokeWidth={2.2} />
                </ToolButton>
              </div>

              {/* second toolbar row: colour + size */}
              <div className="mt-1.5 flex flex-wrap items-center gap-2 rounded-xl border border-[#e8f2ed] bg-white px-2 py-1.5">
                <span className="inline-flex items-center gap-1 font-sans text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-[#8ba19b]">
                  <Palette className="h-3 w-3" /> Text
                </span>
                <div className="flex items-center gap-1">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      title={`Text colour ${c}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => cmd("foreColor", c)}
                      className="h-4 w-4 rounded-full ring-1 ring-black/10 transition hover:scale-110"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                <Divider />

                <span className="inline-flex items-center gap-1 font-sans text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-[#8ba19b]">
                  <Highlighter className="h-3 w-3" /> Highlight
                </span>
                <div className="flex items-center gap-1">
                  {HIGHLIGHTS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      title={`Highlight ${c}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => cmd("hiliteColor", c)}
                      className="h-4 w-4 rounded-[4px] ring-1 ring-black/10 transition hover:scale-110"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                <Divider />

                <select
                  aria-label="Font family"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) cmd("fontName", e.target.value);
                    e.target.value = "";
                  }}
                  className="h-7 rounded-lg border border-[#e3ede9] bg-white px-2 font-sans text-[0.7rem] text-[#44615a] outline-none"
                >
                  <option value="">Font</option>
                  {FONT_FAMILIES.map((f) => (
                    <option key={f.label} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Font size"
                  defaultValue="3"
                  onChange={(e) => cmd("fontSize", e.target.value)}
                  className="h-7 rounded-lg border border-[#e3ede9] bg-white px-2 font-sans text-[0.7rem] text-[#44615a] outline-none"
                >
                  {FONT_SIZES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>

                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={openPreview}
                    className={cn(
                      "inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 font-sans text-[0.7rem] font-semibold transition",
                      mode === "preview" ? "bg-[#0d5c4d] text-white" : "text-[#44615a] hover:bg-[#eaf7f3]"
                    )}
                  >
                    <Eye className="h-3 w-3" /> Preview
                  </button>
                  {mode === "preview" && (
                    <button
                      type="button"
                      onClick={() => setMode("write")}
                      className="inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 font-sans text-[0.7rem] font-semibold text-[#44615a] transition hover:bg-[#eaf7f3]"
                    >
                      <Pencil className="h-3 w-3" /> Back
                    </button>
                  )}
                </div>
              </div>

              {/* staged inline images — one or many, with captions */}
              {trayOpen && drafts.length > 0 && (
                <div className="mt-2 rounded-2xl border border-[#cfe3da] bg-[#f7fcfa] p-3">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                    <span className="inline-flex items-center gap-1.5 font-display text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#0a4e43]">
                      <Images className="h-3.5 w-3.5" strokeWidth={2.2} /> {drafts.length}{" "}
                      {drafts.length === 1 ? "image" : "images"} ready
                    </span>
                    <span className="hidden font-sans text-[0.66rem] text-[#6b857e] sm:inline">
                      Caption, size and alignment — then insert.
                    </span>
                    <div className="ml-auto flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setDrafts([]);
                          setTrayOpen(false);
                        }}
                        className="rounded-full px-2.5 py-1 font-sans text-[0.68rem] font-semibold text-[#7b918a] transition hover:bg-white hover:text-rose-500"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={insertDrafts}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#0d5c4d] px-3 py-1.5 font-display text-[0.72rem] font-bold text-white shadow-[0_10px_18px_-14px_rgba(13,92,77,0.95)] transition hover:bg-[#0a4e43]"
                      >
                        <Send className="h-3 w-3" /> Insert {drafts.length}
                      </button>
                    </div>
                  </div>

                  <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                    {drafts.map((img) => (
                      <div key={img.id} className="rounded-xl border border-[#e3ede9] bg-white p-2.5">
                        <div className="flex gap-2.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.data}
                            alt=""
                            className="h-[4.5rem] w-[4.5rem] shrink-0 rounded-lg object-cover ring-1 ring-[#e3ede9]"
                          />
                          <div className="min-w-0 flex-1">
                            <input
                              value={img.caption}
                              onChange={(e) => updateDraft(img.id, { caption: e.target.value })}
                              placeholder="Caption (optional)"
                              aria-label="Image caption"
                              className="w-full rounded-md border border-transparent bg-[#f7fcfa] px-2 py-1 font-sans text-[0.72rem] text-[#10231f] outline-none transition placeholder:text-[#9aada7] focus:border-[#0d6a58] focus:bg-white"
                            />
                            <input
                              value={img.alt}
                              onChange={(e) => updateDraft(img.id, { alt: e.target.value })}
                              placeholder="Alt text for accessibility"
                              aria-label="Image alt text"
                              className="mt-1 w-full rounded-md border border-transparent bg-[#f7fcfa] px-2 py-1 font-sans text-[0.68rem] text-[#44615a] outline-none transition placeholder:text-[#9aada7] focus:border-[#0d6a58] focus:bg-white"
                            />
                            <div className="mt-1.5 flex items-center gap-1">
                              <select
                                value={img.size}
                                onChange={(e) => updateDraft(img.id, { size: e.target.value as DraftImage["size"] })}
                                aria-label="Image size"
                                className="h-6 min-w-0 flex-1 rounded-md border border-[#e3ede9] bg-white px-1 font-sans text-[0.65rem] text-[#44615a] outline-none"
                              >
                                {IMAGE_SIZES.map((s) => (
                                  <option key={s.value} value={s.value}>
                                    {s.label}
                                  </option>
                                ))}
                              </select>
                              <select
                                value={img.align}
                                onChange={(e) => updateDraft(img.id, { align: e.target.value as DraftImage["align"] })}
                                aria-label="Image alignment"
                                className="h-6 min-w-0 flex-1 rounded-md border border-[#e3ede9] bg-white px-1 font-sans text-[0.65rem] text-[#44615a] outline-none"
                              >
                                <option value="center">Centre</option>
                                <option value="left">Left</option>
                                <option value="right">Right</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => insertSingleDraft(img.id)}
                                title="Insert this image"
                                aria-label="Insert this image"
                                className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[#eaf7f3] text-[#0d6a58] transition hover:bg-[#d9f2e5]"
                              >
                                <Plus className="h-3 w-3" strokeWidth={2.6} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDrafts((d) => d.filter((x) => x.id !== img.id));
                                  if (drafts.length <= 1) setTrayOpen(false);
                                }}
                                title="Remove"
                                aria-label="Remove this image"
                                className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-[#9aada7] transition hover:bg-rose-50 hover:text-rose-500"
                              >
                                <Trash2 className="h-3 w-3" strokeWidth={2.2} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* editable surface */}
              <div className="mt-3 rounded-xl border border-[#e8f2ed] bg-white">
                <div
                  ref={editorRef}
                  contentEditable={mode === "write"}
                  suppressContentEditableWarning
                  onInput={() => syncHtml()}
                  onBlur={() => syncHtml()}
                  onKeyUp={rememberSelection}
                  onMouseUp={rememberSelection}
                  onDrop={(e) => {
                    if (e.dataTransfer.files?.length) {
                      e.preventDefault();
                      rememberSelection();
                      void insertBodyImage(e.dataTransfer.files);
                    }
                  }}
                  onDragOver={(e) => {
                    if (e.dataTransfer.types.includes("Files")) e.preventDefault();
                  }}
                  data-placeholder="Start writing the story… use the toolbar for headings, colour, images and links. You can drop photos straight in."
                  className={cn(
                    "rich-editor min-h-[24rem] px-5 py-5 outline-none",
                    mode === "preview" && "hidden"
                  )}
                />
                {mode === "preview" && (
                  <div className="min-h-[24rem] px-5 py-5">
                    {previewHtml.replace(/<[^>]*>/g, "").trim() ? (
                      <div
                        className="article-preview"
                        dangerouslySetInnerHTML={{ __html: previewHtml }}
                      />
                    ) : (
                      <p className="font-sans text-[0.85rem] text-[#9aada7]">
                        Nothing to preview yet — write a paragraph first.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {error && (
                <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 font-sans text-[0.82rem] text-rose-600">
                  {error}
                </p>
              )}

              <input
                ref={bodyInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  void insertBodyImage(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>

            {/* ── side panel ── */}
            <aside className="border-t border-[#f0f6f3] bg-[#fbfefd] p-4 sm:p-5 lg:border-l lg:border-t-0">
              <p className="font-display text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[#8ba19b]">
                Story settings
              </p>

              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="font-sans text-[0.7rem] font-semibold text-[#44615a]">Status</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "DRAFT" | "PUBLISHED")}
                    className={field}
                  >
                    <option value="DRAFT">Draft — hidden</option>
                    <option value="PUBLISHED">Published — live</option>
                  </select>
                </label>

                <label className="block">
                  <span className="font-sans text-[0.7rem] font-semibold text-[#44615a]">Category</span>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className={field}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="font-sans text-[0.7rem] font-semibold text-[#44615a]">
                    Tags <span className="font-normal text-[#9aada7]">(comma separated)</span>
                  </span>
                  <input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="ielts, speaking, habits"
                    className={field}
                  />
                </label>

                <label className="block">
                  <span className="font-sans text-[0.7rem] font-semibold text-[#44615a]">Publish date</span>
                  <input
                    type="datetime-local"
                    value={publishedAt}
                    onChange={(e) => setPublishedAt(e.target.value)}
                    className={field}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setFeatured((v) => !v)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition",
                    featured
                      ? "border-[#0d6a58] bg-[#eaf7f3]"
                      : "border-[#e3ede9] bg-white hover:border-[#cfe3da]"
                  )}
                >
                  <span>
                    <span className="block font-sans text-[0.78rem] font-semibold text-[#10231f]">
                      Feature this story
                    </span>
                    <span className="block font-sans text-[0.66rem] text-[#8ba19b]">
                      Pinned to the top of the journal
                    </span>
                  </span>
                  <span
                    className={cn(
                      "relative h-5 w-9 shrink-0 rounded-full transition",
                      featured ? "bg-[#0d5c4d]" : "bg-[#dfe9e5]"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all",
                        featured ? "left-[1.15rem]" : "left-0.5"
                      )}
                    />
                  </span>
                </button>

                <div className="rounded-xl border border-[#e3ede9] bg-white p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[0.7rem] font-semibold text-[#44615a]">Cover image</span>
                    {cover && (
                      <button
                        type="button"
                        onClick={() => setCover(null)}
                        className="font-sans text-[0.66rem] font-semibold text-rose-500 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt="" className="mt-2 h-28 w-full rounded-lg object-cover" />
                  ) : (
                    <div className="mt-2 grid h-28 place-items-center rounded-lg border border-dashed border-[#d8ebe5] bg-[#fbfefd] font-sans text-[0.7rem] text-[#9aada7]">
                      No cover yet
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#e3ede9] py-2 font-sans text-[0.72rem] font-semibold text-[#44615a] transition hover:border-[#cfe3da] hover:text-[#0d6a58]"
                  >
                    {uploading === "cover" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ImagePlus className="h-3.5 w-3.5" />
                    )}
                    {cover ? "Replace cover" : "Upload cover"}
                  </button>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      void pickCover(e.target.files?.[0] ?? null);
                      e.target.value = "";
                    }}
                  />
                </div>

                <label className="block">
                  <span className="font-sans text-[0.7rem] font-semibold text-[#44615a]">Excerpt</span>
                  <textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    rows={4}
                    maxLength={600}
                    placeholder="One or two lines shown on the journal cards…"
                    className={cn(field, "min-h-24 resize-y")}
                  />
                  <span className="mt-1 block font-sans text-[0.64rem] text-[#9aada7]">
                    Leave blank to auto-generate from the story.
                  </span>
                </label>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <label className="block">
                    <span className="font-sans text-[0.7rem] font-semibold text-[#44615a]">Author</span>
                    <input value={author} onChange={(e) => setAuthor(e.target.value)} className={field} />
                  </label>
                  <label className="block">
                    <span className="font-sans text-[0.7rem] font-semibold text-[#44615a]">Author role</span>
                    <input
                      value={authorRole}
                      onChange={(e) => setAuthorRole(e.target.value)}
                      className={field}
                    />
                  </label>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-[#eaf7f3] px-3.5 py-3">
                <p className="font-sans text-[0.7rem] font-semibold text-[#0a4e43]">Editor tips</p>
                <ul className="mt-1.5 list-disc space-y-1 pl-4 font-sans text-[0.68rem] leading-relaxed text-[#44615a]">
                  <li>Select text first, then tap a colour or highlight.</li>
                  <li>Picture icon (or drag &amp; drop) adds one or many photos at once.</li>
                  <li>Each image gets a caption, alt text, size and alignment.</li>
                  <li>Drafts stay private until you press Publish.</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => void save(status === "PUBLISHED" ? "PUBLISHED" : "DRAFT")}
                disabled={busy !== null}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#e3ede9] py-2.5 font-sans text-[0.74rem] font-semibold text-[#44615a] transition hover:border-[#cfe3da] hover:text-[#0d6a58] disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" /> Quick save
              </button>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
