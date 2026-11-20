import { NextResponse } from "next/server";
import { z } from "zod";

import { isValidId, requireAdmin } from "@/lib/admin-guard";
import { audit } from "@/lib/server/admin";
import {
  archiveStudentReview,
  deleteStudentReview,
  getStudentReview,
  publishStudentReview,
  restoreStudentReview,
  unpublishStudentReview,
} from "@/lib/server/studentReviews";

export const dynamic = "force-dynamic";

const ActionSchema = z.object({
  action: z.enum(["publish", "unpublish", "archive", "restore"]),
});

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const { id } = await ctx.params;
  if (!isValidId(id)) return NextResponse.json({ message: "Invalid id." }, { status: 400 });

  const parsed = ActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Unknown action." }, { status: 400 });
  }

  const review = await getStudentReview(id);
  if (!review) return NextResponse.json({ message: "Review not found." }, { status: 404 });

  let publicSlug: string | null = review.publishedSlug;
  try {
    if (parsed.data.action === "publish") {
      const result = await publishStudentReview(id);
      publicSlug = result.slug;
    } else if (parsed.data.action === "unpublish") {
      await unpublishStudentReview(id);
      publicSlug = null;
    } else if (parsed.data.action === "archive") {
      await archiveStudentReview(id);
      publicSlug = null;
    } else {
      await restoreStudentReview(id);
    }
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not update the review." },
      { status: 500 }
    );
  }

  await audit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: `admin.student_review_${parsed.data.action}`,
    targetType: "student_review",
    targetId: id,
    meta: { name: review.name, course: review.course },
  });

  return NextResponse.json({ ok: true, publicSlug });
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const { id } = await ctx.params;
  if (!isValidId(id)) return NextResponse.json({ message: "Invalid id." }, { status: 400 });

  const review = await getStudentReview(id);
  if (!review) return NextResponse.json({ message: "Review not found." }, { status: 404 });

  await deleteStudentReview(id);
  await audit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "admin.student_review_deleted",
    targetType: "student_review",
    targetId: id,
    meta: { name: review.name, course: review.course },
  });

  return NextResponse.json({ ok: true });
}
