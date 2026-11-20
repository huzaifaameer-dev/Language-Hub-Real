import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin-guard";
import { audit } from "@/lib/server/admin";
import { blogStats, createPost, listAllPosts } from "@/lib/server/blog";
import { BlogCoverImageSchema } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const [posts, stats] = await Promise.all([listAllPosts(), blogStats()]);
  return NextResponse.json({ posts, stats });
}

const CreateSchema = z.object({
  title: z.string().trim().min(3).max(180),
  slug: z.string().trim().max(120).optional(),
  excerpt: z.string().max(600).optional(),
  content: z.string().max(400_000).default(""),
  coverImage: BlogCoverImageSchema.nullable().optional(),
  category: z.string().trim().max(60).optional(),
  tags: z.array(z.string().trim().max(40)).max(12).optional(),
  author: z.string().trim().max(80).optional(),
  authorRole: z.string().trim().max(80).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  featured: z.boolean().optional(),
  publishedAt: z.string().datetime().nullable().optional(),
  readMinutes: z.number().int().min(1).max(120).optional(),
});

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const parsed = CreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 }
    );
  }

  const id = await createPost(parsed.data);
  await audit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "admin.blog_created",
    targetType: "blog_post",
    targetId: id,
    meta: { title: parsed.data.title, status: parsed.data.status ?? "DRAFT" },
  });

  return NextResponse.json({ ok: true, id }, { status: 201 });
}
