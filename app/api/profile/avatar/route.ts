import { NextResponse } from "next/server";
import sharp, { type Metadata } from "sharp";
import { z } from "zod";

import { auth } from "@/auth";
import { q } from "@/lib/server/pg";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";

const AvatarSchema = z.object({
  dataUrl: z
    .string()
    .min(10, "Empty image.")
    .max(3_500_000, "Image is too large (max 2.5 MB encoded)."),
});

const ALLOWED_PREFIXES = [
  "data:image/jpeg;base64,",
  "data:image/png;base64,",
  "data:image/webp;base64,",
];

const AVATAR_SIZE = 196;
const AVATAR_QUALITY = 82;

const publicUrl = (userId: string) => `/api/profile/avatar/${userId}`;

export const dynamic = "force-dynamic";

/** Accepts a base64 data-URI, verifies the real format with sharp, re-encodes
 *  to a square WebP and stores it inline (serverless-safe: no disk writes). */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  const rl = await rateLimitDb(
    await clientKey(request, `avatar:${session.user.id}`),
    10,
    60 * 60 * 1000
  );
  if (!rl.ok) {
    return NextResponse.json({ message: "Too many uploads. Wait a bit." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const parsed = AvatarSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 }
    );
  }

  const dataUrl = parsed.data.dataUrl.trim();
  const prefix = ALLOWED_PREFIXES.find((p) => dataUrl.startsWith(p));
  if (!prefix) {
    return NextResponse.json(
      { message: "Only JPG, PNG or WebP images are allowed." },
      { status: 400 }
    );
  }

  const input = Buffer.from(dataUrl.slice(prefix.length), "base64");

  // Decode with sharp so the format is genuinely verified, not just claimed.
  let meta: Metadata;
  try {
    meta = await sharp(input).metadata();
  } catch {
    return NextResponse.json({ message: "Invalid image data." }, { status: 400 });
  }
  if (!meta.width || !meta.height) {
    return NextResponse.json({ message: "Invalid image data." }, { status: 400 });
  }

  let output: Buffer;
  try {
    output = await sharp(input)
      .rotate() // honour EXIF orientation
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover", position: "centre" })
      .webp({ quality: AVATAR_QUALITY })
      .toBuffer();
  } catch {
    return NextResponse.json({ message: "Image processing failed." }, { status: 422 });
  }

  const url = publicUrl(session.user.id);
  await q(
    "UPDATE users SET image = $1, avatar_data = $2, updated_at = NOW() WHERE id = $3",
    [url, output.toString("base64"), session.user.id]
  );

  return NextResponse.json({ ok: true, image: url });
}
