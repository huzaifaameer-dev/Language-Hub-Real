import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-guard";
import {
  listStudentReviews,
  studentReviewCounts,
  type StudentReviewStatus,
} from "@/lib/server/studentReviews";

export const dynamic = "force-dynamic";

const STATUSES: Array<StudentReviewStatus | "ALL"> = ["ALL", "NEW", "PUBLISHED", "ARCHIVED"];

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const url = new URL(request.url);
  const requested = (url.searchParams.get("status") ?? "ALL").toUpperCase();
  const status = STATUSES.includes(requested as StudentReviewStatus) 
    ? (requested as StudentReviewStatus | "ALL")
    : "ALL";
  const page = Number(url.searchParams.get("page") ?? 1) || 1;

  const [data, counts] = await Promise.all([
    listStudentReviews({ status, page, perPage: 10 }),
    studentReviewCounts(),
  ]);

  return NextResponse.json({ ...data, counts });
}
