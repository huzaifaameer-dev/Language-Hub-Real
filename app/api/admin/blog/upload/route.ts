import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp, { type Metadata } from "sharp";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

const CoverSchema = z.object({
  dataUrl: z
    .string()
    .min(10, "Empty image.")
    .max(8_000_000, "Image is too large (max 6 MB encoded)."),
});

const ALLOWED_PREFIXES = ["data:image/jpeg;base64,", "data:image/png;base64,", "data:image/webp;base64,", "data:image/avif;base64,"];

const COVER_WIDTH = 1600;
const COVER_QUALITY = 84;

function uploadsDir(): string {
  return path.join(process.cwd(), "public", "uploads", "blog");
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const parsed = CoverSchema.safeParse(body);
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
      { message: "Only JPG, PNG, WebP or AVIF images are allowed." },
      { status: 400 }
    );
  }

  let input: Buffer;
  try {
    input = Buffer.from(dataUrl.slice(prefix.length), "base64");
  } catch {
    return NextResponse.json({ message: "Invalid image data." }, { status: 400 });
  }

  // Verify the format really decodes, not just claims.
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
      .resize(COVER_WIDTH, null, { withoutEnlargement: true })
      .webp({ quality: COVER_QUALITY })
      .toBuffer();
  } catch {
    return NextResponse.json({ message: "Image processing failed." }, { status: 422 });
  }

  // Random filename so re-uploads never collide with a stored cover.
  const name = `${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}.webp`;
  const dir = uploadsDir();
  await mkdir(dir, { recursive: true });
  const { writeFile } = await import("node:fs/promises");
  await writeFile(path.join(dir, name), output);

  return NextResponse.json({ ok: true, url: `/uploads/blog/${name}` });
}