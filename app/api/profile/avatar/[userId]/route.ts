import { NextResponse } from "next/server";

import { one } from "@/lib/server/pg";
import { isValidId, requireAdmin } from "@/lib/admin-guard";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

/**
 * Streams a learner's stored avatar.
 *
 * Avatars are personal images, so the route is not public: a learner must be
 * signed in (the cookie proves it) and the admin console may read any of them.
 * Unauthenticated callers get the same 404 as a missing file, so UUID probing
 * cannot confirm that an account exists.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const [session, admin] = await Promise.all([auth(), requireAdmin()]);
  if (!session?.user?.id && !admin) {
    return new NextResponse(null, { status: 404 });
  }

  const { userId } = await params;
  if (!isValidId(userId)) {
    return new NextResponse(null, { status: 404 });
  }

  const row = await one<{ avatar_data: string | null }>(
    "SELECT avatar_data FROM users WHERE id = $1",
    [userId]
  );
  if (!row?.avatar_data) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(Buffer.from(row.avatar_data, "base64"), {
    status: 200,
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "private, no-cache, max-age=0, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
