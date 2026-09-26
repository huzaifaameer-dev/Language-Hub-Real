import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { auth } from "@/auth";
import { requireAdmin } from "@/lib/admin-guard";
import { getRegistrationsCollection } from "@/lib/db";
import { readPrivateFile } from "@/lib/registration-storage";

export const dynamic = "force-dynamic";

const FIELDS = new Set(["photo", "receipt", "pdf"]);

/**
 * Auth-guarded media for a course registration. Only the student who submitted
 * it (NextAuth session) or an unlocked admin (standalone admin token) may view
 * the photo, the payment receipt or the PDF summary. Files are resolved from
 * the tenant-private folder with a path-traversal guard.
 */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const session = await auth();
  const admin = await requireAdmin();
  if (!session?.user?.id && !admin) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  const url = new URL(_request.url);
  const field = url.searchParams.get("field") ?? "photo";
  if (!FIELDS.has(field)) {
    return NextResponse.json({ message: "Bad field." }, { status: 400 });
  }

  const registrations = await getRegistrationsCollection();
  const doc = await registrations.findOne({ _id: new ObjectId(id) });
  if (!doc) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  const isOwner = !!session?.user?.id && session.user.id === String(doc.userId);
  if (!isOwner && !admin) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  let rel: string | null | undefined;
  if (field === "photo") rel = doc.photo;
  else if (field === "receipt") rel = doc.payment?.receipt;
  else rel = doc.pdfPath;

  if (!rel) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  const file = await readPrivateFile(rel);
  if (!file) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  return new Response(new Uint8Array(file.buffer), {
    headers: {
      "Content-Type": file.mime,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}