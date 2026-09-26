import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

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

// Screenshots arrive as base64 data-URIs (≤5MB raw → ~7MB encoded).
export const bodySizeLimit = "12mb";

const ALLOWED_PREFIXES = ["data:image/jpeg;base64,", "data:image/png;base64,", "data:image/webp;base64,", "data:image/heic;base64,", "data:image/heif;base64,"];

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
      { message: "Only JPG, PNG, WebP, HEIC or HEIF images are allowed." },
      { status: 400 }
    );
  }

  let input: Buffer;
  try {
    input = Buffer.from(dataUrl.slice(prefix.length), "base64");
  } catch {
    return NextResponse.json({ message: "Invalid image data." }, { status: 400 });
  }
  if (input.length === 0) {
    return NextResponse.json({ message: "Invalid image data." }, { status: 400 });
  }

  const contentType = prefix.slice("data:".length, prefix.length - ";base64,".length);
  const output = input;

  const url = publicUrl(enrollmentId);
  await enrollments.updateOne(
    { _id: new ObjectId(enrollmentId) },
    {
      $set: {
        status: "PROOF_SUBMITTED",
        paymentProof: url,
        proofData: output.toString("base64"),
        proofContentType: contentType,
        updatedAt: new Date(),
      },
    }
  );

  // Autonomous AI: proof received → confirm enrollment + record the deposit now.
  void import("@/lib/ai/agent/engine").then(({ processEnrollmentNow }) =>
    processEnrollmentNow(enrollmentId).catch(() => {})
  );

  return NextResponse.json({ ok: true, proof: url, status: "PROOF_SUBMITTED" }, { status: 201 });
}
