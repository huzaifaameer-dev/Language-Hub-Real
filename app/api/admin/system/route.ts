import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-guard";
import { one } from "@/lib/server/pg";
import { usingRemotePostgres } from "@/lib/pg/driver";

export const dynamic = "force-dynamic";

/**
 * Real environment facts for the Settings tab's "Environment" card.
 *
 * The panel used to print hardcoded values ("PostgreSQL (PGlite)", "Public
 * blog: Paused") that were wrong in production. Everything here is measured:
 * the driver actually in use, a live SELECT 1, and a real post count.
 */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  let dbUp = false;
  let published = 0;

  try {
    const [ping, posts] = await Promise.all([
      one<{ ok: number }>("SELECT 1::INT AS ok"),
      one<{ n: number }>(
        "SELECT COUNT(*)::INT AS n FROM blog_posts WHERE status = 'PUBLISHED'"
      ),
    ]);
    dbUp = ping?.ok === 1;
    published = posts?.n ?? 0;
  } catch {
    dbUp = false;
  }

  return NextResponse.json({
    database: { remote: usingRemotePostgres(), up: dbUp },
    blog: { published, live: published > 0 },
    accessCode: Boolean((process.env.ADMIN_ACCESS_CODE ?? "").trim()),
  });
}
