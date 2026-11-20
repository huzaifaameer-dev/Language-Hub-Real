/**
 * Journal (blog) repository — PostgreSQL backed.
 *
 * Posts store sanitized HTML from the admin editor. Public reads only ever
 * see `PUBLISHED` rows whose `published_at` is in the past; the admin console
 * sees everything. Comments start unapproved and are moderated from the
 * admin panel.
 */

import { estimateReadMinutes, makeExcerpt, sanitizeBlogHtml } from "@/lib/blog/sanitize";
import { newId } from "./id";
import { one, q } from "./pg";

export type BlogStatus = "DRAFT" | "PUBLISHED";

export interface BlogPostRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image: string | null;
  category: string;
  tags: string[] | string;
  author: string;
  author_role: string;
  status: BlogStatus;
  featured: boolean;
  read_minutes: number;
  views: number;
  published_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
  comment_count?: number;
}

export interface BlogPost {
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
  status: BlogStatus;
  featured: boolean;
  readMinutes: number;
  views: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
}

export interface BlogPostSummary {
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

export interface BlogComment {
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

function iso(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function tagsOf(value: string[] | string): string[] {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

/**
 * Publish-time resolution. A time supplied by the browser can sit a few
 * milliseconds in the *future* relative to the database's clock, which would
 * hide a freshly published story behind the "published_at <= NOW()" gate.
 * Anything within a minute of now is therefore snapped to a second ago;
 * genuinely future dates are kept so scheduling still works.
 */
function publishTimestamp(value?: string | null): string {
  const now = Date.now();
  /* 2 minutes of clock-skew cushion: browsers, the app server and the database
     can disagree by a few seconds, and the public query compares against the
     database's NOW(). */
  if (value) {
    const ts = Date.parse(value);
    if (!Number.isNaN(ts)) {
      return new Date(ts <= now + 60_000 ? now - 120_000 : ts).toISOString();
    }
  }
  return new Date(now - 120_000).toISOString();
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const root = slugify(base) || `post-${Date.now().toString(36)}`;
  let candidate = root;
  for (let n = 2; n < 200; n += 1) {
    const existing = await one<{ id: string }>(
      `SELECT id FROM blog_posts WHERE slug = $1 LIMIT 1`,
      [candidate]
    );
    if (!existing || existing.id === ignoreId) return candidate;
    candidate = `${root}-${n}`;
  }
  return `${root}-${Date.now().toString(36)}`;
}

function toSummary(row: BlogPostRow): BlogPostSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    coverImage: row.cover_image,
    category: row.category,
    tags: tagsOf(row.tags),
    author: row.author,
    authorRole: row.author_role,
    featured: Boolean(row.featured),
    readMinutes: Number(row.read_minutes),
    views: Number(row.views),
    publishedAt: iso(row.published_at),
    commentCount: Number(row.comment_count ?? 0),
  };
}

function toPost(row: BlogPostRow): BlogPost {
  return {
    ...toSummary(row),
    content: sanitizeBlogHtml(row.content),
    status: row.status,
    createdAt: iso(row.created_at) ?? new Date().toISOString(),
    updatedAt: iso(row.updated_at) ?? new Date().toISOString(),
  };
}

const SELECT_WITH_COMMENTS = `
  SELECT p.*,
         (SELECT COUNT(*)::INT FROM blog_comments c
           WHERE c.post_id = p.id AND c.approved = TRUE) AS comment_count
    FROM blog_posts p`;

/* ───────────────────────────── public reads ───────────────────────────── */

export async function listPublishedPosts(options?: {
  limit?: number;
  category?: string;
  featuredOnly?: boolean;
}): Promise<BlogPostSummary[]> {
  const limit = Math.min(50, Math.max(1, options?.limit ?? 24));
  const params: unknown[] = [limit];
  const filters = ["p.status = 'PUBLISHED'", "COALESCE(p.published_at, p.created_at) <= NOW()"];

  if (options?.category && options.category !== "All") {
    params.push(options.category);
    filters.push(`p.category = $${params.length}`);
  }
  if (options?.featuredOnly) filters.push("p.featured = TRUE");

  const rows = await q<BlogPostRow>(
    `${SELECT_WITH_COMMENTS}
      WHERE ${filters.join(" AND ")}
      ORDER BY p.featured DESC, COALESCE(p.published_at, p.created_at) DESC
      LIMIT $1`,
    params
  );
  return rows.map(toSummary);
}

export async function getPublishedPost(slug: string): Promise<BlogPost | null> {
  const row = await one<BlogPostRow>(
    `${SELECT_WITH_COMMENTS}
      WHERE p.slug = $1 AND p.status = 'PUBLISHED'
        AND COALESCE(p.published_at, p.created_at) <= NOW()
      LIMIT 1`,
    [slug]
  );
  return row ? toPost(row) : null;
}

export async function bumpViews(id: string): Promise<void> {
  await q("UPDATE blog_posts SET views = views + 1 WHERE id = $1", [id]);
}

export async function publishedCategories(): Promise<string[]> {
  const rows = await q<{ category: string }>(
    `SELECT DISTINCT category FROM blog_posts
      WHERE status = 'PUBLISHED' AND COALESCE(published_at, created_at) <= NOW()
      ORDER BY category`
  );
  return rows.map((r) => r.category);
}

export async function getApprovedComments(postId: string): Promise<BlogComment[]> {
  const rows = await q<{
    id: string;
    post_id: string;
    name: string;
    email: string;
    body: string;
    approved: boolean;
    created_at: string | Date;
  }>(
    `SELECT id, post_id, name, email, body, approved, created_at
       FROM blog_comments
      WHERE post_id = $1 AND approved = TRUE
      ORDER BY created_at ASC`,
    [postId]
  );
  return rows.map((row) => ({
    id: row.id,
    postId: row.post_id,
    name: row.name,
    email: row.email,
    body: row.body,
    approved: Boolean(row.approved),
    createdAt: iso(row.created_at) ?? new Date().toISOString(),
  }));
}

export async function createComment(input: {
  postId: string;
  name: string;
  email: string;
  body: string;
}): Promise<string> {
  const id = newId();
  await q(
    `INSERT INTO blog_comments (id, post_id, name, email, body, approved)
     VALUES ($1, $2, $3, $4, $5, FALSE)`,
    [id, input.postId, input.name, input.email, input.body]
  );
  return id;
}

/* ────────────────────────────── admin reads ───────────────────────────── */

export async function listAllPosts(): Promise<Array<BlogPost & { commentCount: number }>> {
  const rows = await q<BlogPostRow>(
    `${SELECT_WITH_COMMENTS} ORDER BY p.created_at DESC`
  );
  return rows.map((row) => ({ ...toPost(row), commentCount: Number(row.comment_count ?? 0) }));
}

export async function getPostById(id: string): Promise<BlogPost | null> {
  const row = await one<BlogPostRow>(`${SELECT_WITH_COMMENTS} WHERE p.id = $1 LIMIT 1`, [id]);
  return row ? toPost(row) : null;
}

export async function listComments(options?: {
  approved?: boolean;
  limit?: number;
}): Promise<BlogComment[]> {
  const params: unknown[] = [];
  const filters: string[] = [];
  if (typeof options?.approved === "boolean") {
    params.push(options.approved);
    filters.push(`c.approved = $${params.length}`);
  }
  const limit = Math.min(200, Math.max(1, options?.limit ?? 100));
  params.push(limit);

  const rows = await q<{
    id: string;
    post_id: string;
    name: string;
    email: string;
    body: string;
    approved: boolean;
    created_at: string | Date;
    title: string;
    slug: string;
  }>(
    `SELECT c.*, p.title, p.slug
       FROM blog_comments c
       JOIN blog_posts p ON p.id = c.post_id
      ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""}
      ORDER BY c.created_at DESC
      LIMIT $${params.length}`,
    params
  );

  return rows.map((row) => ({
    id: row.id,
    postId: row.post_id,
    postTitle: row.title,
    postSlug: row.slug,
    name: row.name,
    email: row.email,
    body: row.body,
    approved: Boolean(row.approved),
    createdAt: iso(row.created_at) ?? new Date().toISOString(),
  }));
}

export async function blogStats(): Promise<{
  posts: number;
  published: number;
  drafts: number;
  views: number;
  comments: number;
  pending: number;
}> {
  const row = await one<Record<string, number>>(
    `SELECT
       (SELECT COUNT(*)::INT FROM blog_posts) AS posts,
       (SELECT COUNT(*)::INT FROM blog_posts WHERE status = 'PUBLISHED') AS published,
       (SELECT COUNT(*)::INT FROM blog_posts WHERE status = 'DRAFT') AS drafts,
       (SELECT COALESCE(SUM(views), 0)::INT FROM blog_posts) AS views,
       (SELECT COUNT(*)::INT FROM blog_comments) AS comments,
       (SELECT COUNT(*)::INT FROM blog_comments WHERE approved = FALSE) AS pending`
  );
  return {
    posts: Number(row?.posts ?? 0),
    published: Number(row?.published ?? 0),
    drafts: Number(row?.drafts ?? 0),
    views: Number(row?.views ?? 0),
    comments: Number(row?.comments ?? 0),
    pending: Number(row?.pending ?? 0),
  };
}

/* ─────────────────────────────── mutations ────────────────────────────── */

export interface BlogInput {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  coverImage?: string | null;
  category?: string;
  tags?: string[];
  author?: string;
  authorRole?: string;
  status?: BlogStatus;
  featured?: boolean;
  publishedAt?: string | null;
  readMinutes?: number;
}

export async function createPost(input: BlogInput): Promise<string> {
  const id = newId();
  const slug = await uniqueSlug(input.slug?.trim() || input.title);
  const content = sanitizeBlogHtml(input.content);
  const excerpt = (input.excerpt ?? "").trim() || makeExcerpt(content);
  const status = input.status ?? "DRAFT";
  const publishedAt =
    status === "PUBLISHED" ? publishTimestamp(input.publishedAt) : input.publishedAt ?? null;

  await q(
    `INSERT INTO blog_posts
      (id, slug, title, excerpt, content, cover_image, category, tags, author, author_role,
       status, featured, read_minutes, published_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13,$14)`,
    [
      id,
      slug,
      input.title.trim(),
      excerpt,
      content,
      input.coverImage ?? null,
      (input.category ?? "Journal").trim() || "Journal",
      JSON.stringify(input.tags ?? []),
      (input.author ?? "Javaria Malik").trim() || "Javaria Malik",
      (input.authorRole ?? "Founder & CEO").trim() || "Founder & CEO",
      status,
      input.featured ?? false,
      input.readMinutes && input.readMinutes > 0 ? input.readMinutes : estimateReadMinutes(content),
      publishedAt,
    ]
  );

  return id;
}

export async function updatePost(id: string, input: Partial<BlogInput>): Promise<void> {
  const current = await getPostById(id);
  if (!current) throw new Error("Post not found.");

  const content = input.content !== undefined ? sanitizeBlogHtml(input.content) : current.content;
  const title = input.title?.trim() || current.title;
  const excerpt =
    input.excerpt !== undefined
      ? input.excerpt.trim() || makeExcerpt(content)
      : current.excerpt || makeExcerpt(content);
  const status = input.status ?? current.status;
  const slug =
    input.slug !== undefined && slugify(input.slug) !== current.slug
      ? await uniqueSlug(input.slug || title, id)
      : current.slug;

  let publishedAt = input.publishedAt !== undefined ? input.publishedAt : current.publishedAt;
  if (status === "PUBLISHED") {
    const wasPublished = current.status === "PUBLISHED";
    const ts = publishedAt ? Date.parse(publishedAt) : Number.NaN;
    if (!wasPublished || Number.isNaN(ts) || ts > Date.now()) {
      publishedAt = publishTimestamp(publishedAt);
    }
  }

  await q(
    `UPDATE blog_posts SET
       slug = $2,
       title = $3,
       excerpt = $4,
       content = $5,
       cover_image = $6,
       category = $7,
       tags = $8::jsonb,
       author = $9,
       author_role = $10,
       status = $11,
       featured = $12,
       read_minutes = $13,
       published_at = $14,
       updated_at = NOW()
     WHERE id = $1`,
    [
      id,
      slug,
      title,
      excerpt,
      content,
      input.coverImage !== undefined ? input.coverImage : current.coverImage,
      (input.category ?? current.category).trim() || "Journal",
      JSON.stringify(input.tags ?? current.tags),
      (input.author ?? current.author).trim() || current.author,
      (input.authorRole ?? current.authorRole).trim() || current.authorRole,
      status,
      input.featured ?? current.featured,
      input.readMinutes && input.readMinutes > 0
        ? input.readMinutes
        : current.readMinutes || estimateReadMinutes(content),
      publishedAt,
    ]
  );
}

export async function deletePost(id: string): Promise<void> {
  await q("DELETE FROM blog_posts WHERE id = $1", [id]);
}

export async function setCommentApproval(id: string, approved: boolean): Promise<void> {
  await q("UPDATE blog_comments SET approved = $2 WHERE id = $1", [id, approved]);
}

export async function deleteComment(id: string): Promise<void> {
  await q("DELETE FROM blog_comments WHERE id = $1", [id]);
}
