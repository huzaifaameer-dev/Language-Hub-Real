import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-guard";
import { ensureIndexesAndAdmin, getUsersCollection } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Admin: lightweight student-directory feed (name/email/role/joined only). */
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  await ensureIndexesAndAdmin();
  const { searchParams } = new URL(request.url);
  const limit = Math.min(500, Math.max(1, Number(searchParams.get("limit")) || 300));

  const users = await getUsersCollection();
  const docs = await users
    .find(
      { role: { $nin: ["ADMIN", "TEACHER"] } },
      { projection: { name: 1, email: 1, emailVerified: 1, role: 1, createdAt: 1 } }
    )
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  const safeIso = (d: unknown): string => {
    if (!d) return new Date().toISOString();
    try {
      const date = d instanceof Date ? d : new Date(d as string | number | Date);
      return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
    } catch {
      return new Date().toISOString();
    }
  };

  const list = docs.map((d) => ({
    id: String(d._id),
    name: d.name,
    email: d.email,
    emailVerified: d.emailVerified ? safeIso(d.emailVerified) : null,
    role: d.role ?? "USER",
    createdAt: safeIso(d.createdAt),
  }));

  return NextResponse.json({ users: list });
}