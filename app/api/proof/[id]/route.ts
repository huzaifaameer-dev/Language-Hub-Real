import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { readFile } from "node:fs/promises";
import path from "node:path";

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

  const filePath = path.join(process.cwd(), "private", "uploads", "proof", `${id}.webp`);
  let data: Buffer;
  try {
    data = await readFile(filePath);
  } catch {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(data), {
    status: 200,
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
