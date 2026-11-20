import { requireAdmin, isValidId } from "@/lib/admin-guard";
import { getStudentReviewPhoto } from "@/lib/server/studentReviews";

export const dynamic = "force-dynamic";

const DATA_URI = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/;

/**
 * Serves a submitted review photo.
 *
 * • Published reviews → publicly cacheable (the review is already on the site).
 * • Unpublished reviews → only the signed-in admin may fetch the photo, so a
 *   pending submission never leaks before moderation.
 */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  if (!isValidId(id)) return new Response("Not found", { status: 404 });

  const row = await getStudentReviewPhoto(id);
  if (!row) return new Response("Not found", { status: 404 });

  const published = row.status === "PUBLISHED";
  if (!published) {
    const admin = await requireAdmin();
    if (!admin) return new Response("Not found", { status: 404 });
  }

  const match = DATA_URI.exec(row.photo);
  if (!match) return new Response("Not found", { status: 404 });

  const body = Uint8Array.from(Buffer.from(match[2], "base64"));

  return new Response(body, {
    headers: {
      "Content-Type": match[1],
      "Content-Length": String(body.byteLength),
      "Cache-Control": published
        ? "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800"
        : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
