import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp, { type Metadata } from "sharp";

import { auth } from "@/auth";
import { getDb, ENROLLMENT_ACTIVE_STATUSES } from "@/lib/db";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";
import { z } from "zod";

const ProofSchema = z.object({
  enrollmentId: z.string().min(1),
  dataUrl: z
    .string()
    .min(10, "Empty image.")
    .max(7_000_000, "Image is too large (max 5 MB encoded)."),
});

const ALLOWED_PREFIXES = ["data:image/jpeg;base64,", "data:image/png;base64,", "data:image/webp;base64,"];

const PROOF_WIDTH = 1400; // downscale wide screenshots, keep them readable
const PROOF_QUALITY = 82;

function uploadsDir(): string {
  return path.join(process.cwd(), "private", "uploads", "proof");
}

function proofPath(enrollmentId: string): string {
  return path.join(uploadsDir(), `${enrollmentId}.webp`);
}

/** Signed API path to retrieve a proof (never exposed from /public). */
function publicUrl(enrollmentId: string): string {
  return `/api/proof/${enrollmentId}`;
}

/**
 * Student uploads a payment-proof screenshot. Marks the enrollment
 * PROOF_SUBMITTED so the admin can review the money-transfer receipt.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }
  if (!ObjectId.isValid(session.user.id)) {
    return NextResponse.json({ message: "Invalid session." }, { status: 400 });
  }

  const rl = await rateLimitDb(await clientKey(request, `proof:${session.user.id}`), 10, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ message: "Too many uploads. Wait a bit." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const parsed = ProofSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Validation failed." }, { status: 400 });
  }

  const enrollmentId = parsed.data.enrollmentId;
  if (!ObjectId.isValid(enrollmentId)) {
    return NextResponse.json({ message: "Invalid enrollment." }, { status: 400 });
  }

  // The enrollment must belong to this user and be in an active state.
  const db = await getDb();
  const enrollments = db.collection("enrollments");
  const target = await enrollments.findOne({
    _id: new ObjectId(enrollmentId),
    userId: session.user.id,
    status: { $in: ENROLLMENT_ACTIVE_STATUSES },
  });
  if (!target) {
    return NextResponse.json({ message: "Enrollment not found or not active." }, { status: 404 });
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
      .rotate()
      .resize({ width: PROOF_WIDTH, withoutEnlargement: true })
      .webp({ quality: PROOF_QUALITY })
      .toBuffer();
  } catch {
    return NextResponse.json({ message: "Image processing failed." }, { status: 422 });
  }

  await mkdir(uploadsDir(), { recursive: true });
  const filePath = proofPath(enrollmentId);
  const { writeFile } = await import("node:fs/promises");
  await writeFile(filePath, output);

  const url = publicUrl(enrollmentId);
  await enrollments.updateOne(
    { _id: new ObjectId(enrollmentId) },
    {
      $set: {
        status: "PROOF_SUBMITTED",
        paymentProof: url,
        updatedAt: new Date(),
      },
    }
  );

  return NextResponse.json({ ok: true, proof: url, status: "PROOF_SUBMITTED" }, { status: 201 });
}
