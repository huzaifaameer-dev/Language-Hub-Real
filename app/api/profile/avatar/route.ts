import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import sharp, { type Metadata } from "sharp";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";
import { z } from "zod";

const AvatarSchema = z.object({
  dataUrl: z
    .string()
    .min(10, "Empty image.")
    .max(3_500_000, "Image is too large (max 2.5 MB encoded)."),
});

const ALLOWED_PREFIXES = ["data:image/jpeg;base64,", "data:image/png;base64,", "data:image/webp;base64,"];

const AVATAR_SIZE = 196; // px (largest square used in the UI is ~96px; @2x covers it)
const AVATAR_QUALITY = 82;

function uploadsDir(): string {
  return path.join(process.cwd(), "public", "uploads", "avatars");
}

function avatarPath(userId: string): string {
  // userId is a validated ObjectId, safe to use in a filename.
  return path.join(uploadsDir(), `${userId}.webp`);
}

function publicUrl(userId: string): string {
  return `/uploads/avatars/${userId}.webp`;
}

async function removeOldAvatars(userId: string): Promise<void> {
  const dir = uploadsDir();
  await Promise.all([
    unlink(path.join(dir, `${userId}.jpg`)).catch(() => {}),
    unlink(path.join(dir, `${userId}.png`)).catch(() => {}),
    unlink(path.join(dir, `${userId}.webp`)).catch(() => {}),
  ]);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }
  if (!ObjectId.isValid(session.user.id)) {
    return NextResponse.json({ message: "Invalid session." }, { status: 400 });
  }

  const rl = await rateLimitDb(clientKey(request, `avatar:${session.user.id}`), 10, 60 * 60 * 1000);
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

  let input: Buffer;
  try {
    input = Buffer.from(dataUrl.slice(prefix.length), "base64");
  } catch {
    return NextResponse.json({ message: "Invalid image data." }, { status: 400 });
  }

  // Decode with sharp so the format is actually verified, not just claimed.
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

  await mkdir(uploadsDir(), { recursive: true });
  await removeOldAvatars(session.user.id); // clear any jpg/png/webp leftovers
  const filePath = avatarPath(session.user.id);
  const { writeFile } = await import("node:fs/promises");
  await writeFile(filePath, output);

  const url = publicUrl(session.user.id);
  const db = await getDb();
  await db.collection("users").updateOne(
    { _id: new ObjectId(session.user.id) },
    { $set: { image: url, updatedAt: new Date() } }
  );

  return NextResponse.json({ ok: true, image: url });
}