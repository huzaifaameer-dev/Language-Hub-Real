"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Eye,
  EyeOff,
  Image as ImageIcon,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  Undo2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  api,
  Badge,
  Card,
  Empty,
  ErrorNote,
  FilterChips,
  fmtDateTime,
  GhostButton,
  PrimaryButton,
  SectionHead,
  useApi,
} from "@/components/admin/ui";
import { BlogEditor, type EditorPost } from "@/components/admin/blog/BlogEditor";

interface PostRow extends EditorPost {
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

interface PostPayload {
  posts: PostRow[];
  stats: {
    posts: number;
    published: number;
    drafts: number;
    views: number;
    comments: number;
    pending: number;
  };
}

interface CommentRow {
  id: string;
  postId: string;
  postTitle?: string;
  postSlug?: string;
  name: string;
  email: string;
  body: string;
  approved: boolean;
  createdAt: string;
}

interface CommentPayload {
  comments: CommentRow[];
  stats: PostPayload["stats"];
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "green",
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: typeof Eye;
  tone?: "green" | "amber" | "coral" | "dark";
}) {
  const tones = {
    green: "bg-[#eaf7f3] text-[#0d6a58]",
    amber: "bg-[#fff6dc] text-[#a97a10]",
    coral: "bg-[#fdeee8] text-[#d0452b]",
    dark: "bg-[#0b4f45] text-white",
  };
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#eef5f1] bg-white px-4 py-3.5 shadow-[0_14px_30px_-28px_rgba(13,71,60,0.5)]">
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", tones[tone])}>
        <Icon className="h-[1.05rem] w-[1.05rem]" strokeWidth={1.9} />
      </span>
      <div className="min-w-0">
        <p className="font-display text-[1.15rem] font-extrabold leading-none text-[#10231f]">
          {typeof value === "number" ? value.toLocaleString("en-PK") : value}
        </p>
        <p className="mt-1 truncate font-sans text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-[#8ba19b]">
          {label}
        </p>
        {hint && <p className="font-sans text-[0.64rem] text-[#9aada7]">{hint}</p>}
      </div>
    </div>
  );
}

export function BlogSection() {
  const [view, setView] = useState<"posts" | "comments">("posts");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [editing, setEditing] = useState<PostRow | null>(null);
  const [creating, setCreating] = useState(false);

  const posts = useApi<PostPayload>("/api/admin/blog");
  const comments = useApi<CommentPayload>("/api/admin/blog/comments");

  const rows = useMemo(() => posts.data?.posts ?? [], [posts.data?.posts]);
  const stats = posts.data?.stats;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((p) => {
      if (filter === "PUBLISHED" && p.status !== "PUBLISHED") return false;
      if (filter === "DRAFT" && p.status !== "DRAFT") return false;
      if (filter === "FEATURED" && !p.featured) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q)
      );
    });
  }, [rows, search, filter]);

  const remove = async (post: PostRow) => {
    if (
      !window.confirm(
        `Delete “${post.title}”? The story and its ${post.commentCount} comment(s) are removed permanently.`
      )
    )
      return;
    await api(`/api/admin/blog/${post.id}`, { method: "DELETE" }).catch(() => null);
    posts.reload();
    comments.reload();
  };

  const togglePublish = async (post: PostRow) => {
    await api(`/api/admin/blog/${post.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: post.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" }),
    }).catch(() => null);
    posts.reload();
  };

  const moderate = async (comment: CommentRow, approved: boolean) => {
    await api(`/api/admin/blog/comments/${comment.id}`, {
      method: "PATCH",
      body: JSON.stringify({ approved }),
    }).catch(() => null);
    comments.reload();
    posts.reload();
  };

  const removeComment = async (comment: CommentRow) => {
    if (!window.confirm(`Delete the comment from ${comment.name}?`)) return;
    await api(`/api/admin/blog/comments/${comment.id}`, { method: "DELETE" }).catch(() => null);
    comments.reload();
    posts.reload();
  };

  return (
    <div className="space-y-4">
      {/* stats */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Stories" value={stats?.posts ?? 0} hint={`${stats?.published ?? 0} published`} icon={Sparkles} />
        <StatCard label="Drafts" value={stats?.drafts ?? 0} hint="Waiting in the studio" icon={Pencil} tone="amber" />
        <StatCard label="Total reads" value={stats?.views ?? 0} hint="Across every story" icon={Eye} tone="dark" />
        <StatCard
          label="Comments"
          value={stats?.comments ?? 0}
          hint={`${stats?.pending ?? 0} awaiting review`}
          icon={MessageSquare}
          tone="coral"
        />
      </div>

      <Card>
        <SectionHead
          title="The Journal"
          hint="Write, illustrate and publish stories — they appear on /blog instantly."
          action={
            <div className="flex items-center gap-2">
              <div className="flex rounded-full bg-[#f1f8f4] p-1">
                {(
                  [
                    { key: "posts", label: "Stories" },
                    { key: "comments", label: `Comments${stats?.pending ? ` (${stats.pending})` : ""}` },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setView(tab.key)}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 font-sans text-[0.74rem] font-semibold transition",
                      view === tab.key
                        ? "bg-white text-[#0d6a58] shadow-[0_6px_14px_-10px_rgba(13,71,60,0.6)]"
                        : "text-[#6c837c] hover:text-[#0d6a58]"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <PrimaryButton
                onClick={() => {
                  setEditing(null);
                  setCreating(true);
                }}
              >
                <Plus className="h-4 w-4" /> New story
              </PrimaryButton>
            </div>
          }
        />

        {view === "posts" ? (
          <>
            <div className="flex flex-wrap items-center gap-2 border-b border-[#f0f6f3] px-5 py-3">
              <span className="flex flex-1 items-center gap-2 rounded-lg border border-[#e3ede9] bg-white px-3 py-2 focus-within:border-[#0d6a58] focus-within:ring-2 focus-within:ring-[#0d6a58]/15 sm:max-w-xs">
                <Search className="h-3.5 w-3.5 text-[#9aada7]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search stories"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </span>
              <FilterChips
                value={filter}
                onChange={setFilter}
                options={[
                  { key: "ALL", label: "All", count: rows.length },
                  { key: "PUBLISHED", label: "Published", count: rows.filter((p) => p.status === "PUBLISHED").length },
                  { key: "DRAFT", label: "Drafts", count: rows.filter((p) => p.status === "DRAFT").length },
                  { key: "FEATURED", label: "Featured", count: rows.filter((p) => p.featured).length },
                ]}
              />
            </div>

            {posts.loading && (
              <div className="px-5 py-16 text-center font-sans text-sm text-[#8ba19b]">Loading stories…</div>
            )}
            {posts.error && (
              <div className="p-5">
                <ErrorNote>{posts.error}</ErrorNote>
              </div>
            )}
            {!posts.loading && !posts.error && filtered.length === 0 && (
              <Empty
                title="No stories here yet"
                hint="Open the editor, write the first paragraph and publish — it takes a minute."
                icon={Sparkles}
              />
            )}

            {filtered.length > 0 && (
              <ul className="divide-y divide-[#f2f7f4]">
                {filtered.map((post) => (
                  <li key={post.id} className="flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-[#fbfefd]">
                    <span className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-[#0a4e43] ring-1 ring-[#e6f0ec]">
                      {post.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={post.coverImage} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="grid h-full w-full place-items-center text-white/50">
                          <ImageIcon className="h-5 w-5" />
                        </span>
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-display text-[0.92rem] font-bold text-[#10231f]">
                          {post.title}
                        </span>
                        {post.featured && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#fff6dc] px-2 py-0.5 font-sans text-[0.6rem] font-bold uppercase tracking-[0.08em] text-[#a97a10]">
                            <Star className="h-2.5 w-2.5 fill-current" /> Featured
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-[0.7rem] text-[#8ba19b]">
                        <span className="font-semibold text-[#44615a]">{post.category}</span>
                        <span className="inline-flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {post.views.toLocaleString("en-PK")}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" /> {post.commentCount}
                        </span>
                        <span>{post.author}</span>
                        <span>{fmtDateTime(post.publishedAt ?? post.createdAt)}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge tone={post.status === "PUBLISHED" ? "green" : "amber"}>
                        {post.status === "PUBLISHED" ? "Live" : "Draft"}
                      </Badge>
                      {post.status === "PUBLISHED" && (
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="grid h-8 w-8 place-items-center rounded-full border border-[#e3ede9] text-[#44615a] transition hover:border-[#cfe3da] hover:text-[#0d6a58]"
                          aria-label="Open story on the site"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => void togglePublish(post)}
                        aria-label={post.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                        className="grid h-8 w-8 place-items-center rounded-full border border-[#e3ede9] text-[#44615a] transition hover:border-[#cfe3da] hover:text-[#0d6a58]"
                      >
                        {post.status === "PUBLISHED" ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <GhostButton
                        onClick={() => {
                          setCreating(false);
                          setEditing(post);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </GhostButton>
                      <GhostButton
                        onClick={() => void remove(post)}
                        className="border-rose-200 text-rose-500"
                        aria-label={`Delete ${post.title}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </GhostButton>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <CommentsPanel
            data={comments.data}
            loading={comments.loading}
            error={comments.error}
            onApprove={(c) => void moderate(c, true)}
            onHide={(c) => void moderate(c, false)}
            onDelete={(c) => void removeComment(c)}
          />
        )}
      </Card>

      {(creating || editing) && (
        <BlogEditor
          key={editing?.id ?? "new"}
          post={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            posts.reload();
            comments.reload();
          }}
        />
      )}
    </div>
  );
}

function CommentsPanel({
  data,
  loading,
  error,
  onApprove,
  onHide,
  onDelete,
}: {
  data: CommentPayload | null;
  loading: boolean;
  error: string | null;
  onApprove: (c: CommentRow) => void;
  onHide: (c: CommentRow) => void;
  onDelete: (c: CommentRow) => void;
}) {
  const [state, setState] = useState("ALL");
  const rows = data?.comments ?? [];
  const filtered = rows.filter((c) =>
    state === "PENDING" ? !c.approved : state === "APPROVED" ? c.approved : true
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b border-[#f0f6f3] px-5 py-3">
        <FilterChips
          value={state}
          onChange={setState}
          options={[
            { key: "ALL", label: "All", count: rows.length },
            { key: "PENDING", label: "Pending", count: rows.filter((c) => !c.approved).length },
            { key: "APPROVED", label: "Approved", count: rows.filter((c) => c.approved).length },
          ]}
        />
        <span className="ml-auto font-sans text-[0.7rem] text-[#8ba19b]">
          New comments wait for approval before they appear on the site.
        </span>
      </div>

      {loading && <div className="px-5 py-16 text-center font-sans text-sm text-[#8ba19b]">Loading comments…</div>}
      {error && (
        <div className="p-5">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <Empty title="Nothing to moderate" hint="Comments appear here the moment a reader posts one." icon={MessageSquare} />
      )}

      {filtered.length > 0 && (
        <ul className="divide-y divide-[#f2f7f4]">
          {filtered.map((c) => (
            <li key={c.id} className="flex flex-wrap items-start gap-3 px-5 py-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[linear-gradient(145deg,#14a08c,#0a4e43)] font-display text-[0.66rem] font-black text-white">
                {c.name.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-[0.86rem] font-bold text-[#10231f]">{c.name}</span>
                  <span className="font-sans text-[0.68rem] text-[#8ba19b]">{c.email}</span>
                  <Badge tone={c.approved ? "green" : "amber"}>{c.approved ? "Approved" : "Pending"}</Badge>
                </p>
                <p className="mt-0.5 font-sans text-[0.66rem] text-[#8ba19b]">
                  on{" "}
                  <Link href={`/blog/${c.postSlug ?? ""}`} target="_blank" className="font-semibold text-[#0d6a58] hover:underline">
                    {c.postTitle ?? "a story"}
                  </Link>{" "}
                  · {fmtDateTime(c.createdAt)}
                </p>
                <p className="mt-2 whitespace-pre-line font-sans text-[0.84rem] leading-relaxed text-[#44615a]">
                  {c.body}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {c.approved ? (
                  <GhostButton onClick={() => onHide(c)}>
                    <EyeOff className="h-3.5 w-3.5" /> Hide
                  </GhostButton>
                ) : (
                  <GhostButton onClick={() => onApprove(c)} className="border-[#b7e4d9] text-[#0d6a58]">
                    <Check className="h-3.5 w-3.5" /> Approve
                  </GhostButton>
                )}
                <GhostButton
                  onClick={() => onDelete(c)}
                  className="border-rose-200 text-rose-500"
                  aria-label="Delete comment"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </GhostButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2 border-t border-[#f2f7f4] px-5 py-3 font-sans text-[0.7rem] text-[#8ba19b]">
        <Undo2 className="h-3.5 w-3.5" /> Hidden comments stay in the database and can be approved again.
      </div>
    </>
  );
}
