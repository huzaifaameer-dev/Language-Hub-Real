import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-guard";
import { audit } from "@/lib/server/admin";
import { allStudentReviews, studentReviewPhotos } from "@/lib/server/studentReviews";
import { studentReviewsToCsv, studentReviewsToPdf } from "@/lib/student-reviews-export";

export const dynamic = "force-dynamic";

const fileDate = () => new Date().toISOString().slice(0, 10);

/**
 * Download every submitted review as a portable archive:
 *   ?format=csv  → spreadsheet (photo data included as a data-URI column)
 *   ?format=pdf  → printable archive with embedded profile photos
 */
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const format = (new URL(request.url).searchParams.get("format") ?? "csv").toLowerCase();
  if (format !== "csv" && format !== "pdf") {
    return NextResponse.json({ message: "Use format=csv or format=pdf." }, { status: 400 });
  }

  const [reviews, photos] = await Promise.all([allStudentReviews(), studentReviewPhotos()]);

  await audit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "admin.student_reviews_exported",
    targetType: "student_review",
    meta: { format, count: reviews.length },
  }).catch(() => null);

  if (format === "csv") {
    const csv = studentReviewsToCsv(reviews, photos);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="language-hub-student-reviews-${fileDate()}.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  const pdf = await studentReviewsToPdf(reviews, photos);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="language-hub-student-reviews-${fileDate()}.pdf"`,
      "Content-Length": String(pdf.byteLength),
      "Cache-Control": "private, no-store",
    },
  });
}
