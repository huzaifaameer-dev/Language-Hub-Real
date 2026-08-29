import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { z } from "zod";

const AvatarSchema = z.object({
  dataUrl: z
    .string()
    .min(10, "Empty image.")
    .max(3_500_000, "Image is too large (max 2.5 MB)."),
});

const ALLOWED_PREFIXES = ["data:image/jpeg;base64,", "data:image/png;base64,", "data:image/webp;base64,"];

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }
  if (!ObjectId.isValid(session.user.id)) {
    return NextResponse.json({ message: "Invalid session." }, { status: 400 });
  }

  const rl = rateLimit(clientKey(request, "avatar"), 10, 60 * 60 * 1000);
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
  if (!ALLOWED_PREFIXES.some((p) => dataUrl.startsWith(p))) {
    return NextResponse.json(
      { message: "Only JPG, PNG or WebP images are allowed." },
      { status: 400 }
    );
  }

  const db = await getDb();
  await db.collection("users").updateOne(
    { _id: new ObjectId(session.user.id) },
    { $set: { image: dataUrl, updatedAt: new Date() } }
  );

  return NextResponse.json({ ok: true, image: dataUrl });
}