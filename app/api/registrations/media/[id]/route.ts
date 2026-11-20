import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-guard";
import { findUserById } from "@/lib/server/users";
import { getRegistration } from "@/lib/server/learner";
import { auth } from "@/auth";
import { readPrivateFile } from "@/lib/registration-storage";

export const dynamic = "force-dynamic";

const FIELDS = new Set(["photo", "receipt", "pdf"]);

/**
 * Auth-guarded media for a registration. Only the learner who submitted it or
 * an unlocked admin may view the photo, the payment receipt or the PDF.
 * Paths resolve inside the private folder with a traversal guard inside
 * `readPrivateFile`.
 */
export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const [session, admin] = await Promise.all([auth(), requireAdmin()]);
  const sessionUser = session?.user?.id ? await findUserById(session.user.id) : null;

  if (!sessionUser && !admin) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const registration = await getRegistration(id);
  if (!registration) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  const isOwner = !!sessionUser && sessionUser.id === registration.user_id;
  if (!isOwner && !admin) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const url = new URL(request.url);
  const field = url.searchParams.get("field") ?? "photo";
  if (!FIELDS.has(field)) {
    return NextResponse.json({ message: "Bad field." }, { status: 400 });
  }

  const details = (
    typeof registration.details === "string"
      ? JSON.parse(registration.details || "{}")
      : registration.details
  ) as { payment?: { receipt?: string | null }; pdfPath?: string | null };

  let rel: string | null | undefined;
  if (field === "photo") rel = registration.photo_path;
  else if (field === "receipt") rel = details?.payment?.receipt ?? registration.receipt_path;
  else rel = registration.pdf_path ?? details?.pdfPath;

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
