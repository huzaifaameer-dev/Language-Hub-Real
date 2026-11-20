import { NextResponse } from "next/server";

import { publicCourses } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const courses = await publicCourses();

  return NextResponse.json(
    { courses },
    {
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=15, stale-while-revalidate=30",
      },
    }
  );
}
