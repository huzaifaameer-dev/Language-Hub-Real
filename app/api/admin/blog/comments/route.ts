import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-guard";
import { blogStats, listComments } from "@/lib/server/blog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const state = searchParams.get("state");
  const approved = state === "pending" ? false : state === "approved" ? true : undefined;

  const [comments, stats] = await Promise.all([listComments({ approved }), blogStats()]);
  return NextResponse.json({ comments, stats });
}
