import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { getDb, getAuthTokensCollection, ensureIndexesAndAdmin } from "@/lib/db";
import { hashToken } from "@/lib/tokens";
import { notify } from "@/lib/notifications";
import { rateLimit, clientKey } from "@/lib/rate-limit";

const VerifySchema = z.object({
  token: z.string().min(1),
});

export async function POST(request: Request) {
  const rl = rateLimit(clientKey(request, "verify"), 10, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { message: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const parsed = VerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid verification link." },
      { status: 400 }
    );
  }

  await ensureIndexesAndAdmin();
  const db = await getDb();
  const tokens = await getAuthTokensCollection();

  const doc = await tokens.findOne({
    token: hashToken(parsed.data.token),
    purpose: "email-verify",
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!doc || !ObjectId.isValid(doc.userId)) {
    return NextResponse.json(
      { message: "This verification link is invalid or has expired." },
      { status: 400 }
    );
  }

  const users = db.collection("users");
  const result = await users.updateOne(
    { _id: new ObjectId(doc.userId) },
    { $set: { emailVerified: new Date(), updatedAt: new Date() } }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json(
      { message: "This verification link is invalid or has expired." },
      { status: 400 }
    );
  }

  await tokens.deleteMany({ userId: doc.userId, purpose: "email-verify" });

  await notify(doc.userId, {
    kind: "system",
    title: "Email verified",
    message: "Your email address is now verified.",
    href: "/dashboard",
  });

  return NextResponse.json({ ok: true });
}