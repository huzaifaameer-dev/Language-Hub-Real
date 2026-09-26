import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { auth } from "@/auth";
import { requireAdmin } from "@/lib/admin-guard";
import { getDb } from "@/lib/db";

/**
 * Serves a payment-proof screenshot ONLY to the enrollment's owner or an admin.
 * Proofs live in a private directory (outside /public) so they are never
 * directly reachable by the browser — this route is the only gateway.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // auth() = logged-in learner; requireAdmin() = admin cookie/DB check.
  const session = await auth();
  const admin = await requireAdmin();
  if (!session?.user?.id && !admin) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Invalid file id." }, { status: 400 });
  }

  const db = await getDb();
  const enrollments = db.collection("enrollments");
  const enrollment = await enrollments.findOne({ _id: new ObjectId(id) });

  if (!enrollment) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  // Owner OR admin may view. Nobody else.
  const requesterId = session?.user?.id;
  const isOwner = requesterId && String(enrollment.userId) === String(requesterId);
  if (!admin && !isOwner) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  // Proof image is stored inline on the enrollment (serverless-safe: no disk).
  const proofBase64 = (enrollment as { proofData?: string }).proofData;
  const contentType =
    (enrollment as { proofContentType?: string }).proofContentType ?? "image/webp";
  if (!proofBase64) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  return new NextResponse(Buffer.from(proofBase64, "base64"), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
