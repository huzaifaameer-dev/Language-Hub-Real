import { NextResponse } from "next/server";
import sharp from "sharp";

import { requireAdmin } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";
export const bodySizeLimit = "15mb"; // cover data-URIs up to MAX_INPUT + base64 overhead

const ALLOWED_PREFIXES = [
  "data:image/jpeg;base64,",
  "data:image/png;base64,",
  "data:image/webp;base64,",
];
const MAX_INPUT = 10 * 1024 * 1024;

/** Admin: accept a base64 data-URI, optimize to a WebP data-URI (no disk writes). */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }
  const dataUrl = (body as { dataUrl?: string })?.dataUrl ?? "";
  if (typeof dataUrl !== "string" || dataUrl.length > MAX_INPUT) {
    return NextResponse.json({ message: "Invalid image." }, { status: 400 });
  }
  const prefix = ALLOWED_PREFIXES.find((p) => dataUrl.startsWith(p));
  if (!prefix) {
    return NextResponse.json({ message: "Unsupported image format." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(dataUrl.slice(prefix.length), "base64");
    const webp = await sharp(buffer).rotate().resize(1280, null, { withoutEnlargement: true }).webp({ quality: 76 }).toBuffer();
    return NextResponse.json({ ok: true, url: `data:image/webp;base64,${webp.toString("base64")}` });
  } catch {
    return NextResponse.json({ message: "Could not process image." }, { status: 500 });
  }
}