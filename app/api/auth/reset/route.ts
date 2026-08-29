import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { getDb, getAuthTokensCollection, ensureIndexesAndAdmin } from "@/lib/db";
import { PasswordSchema } from "@/lib/validate";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { hashToken } from "@/lib/tokens";

const BCRYPT_COST = 12;

export async function POST(request: Request) {
  const rl = rateLimit(clientKey(request, "reset"), 10, 60 * 60 * 1000);
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

  const bodySchema = z.object({ token: z.string().min(1), password: z.string() });
  const bodyParsed = bodySchema.safeParse(body);
  if (!bodyParsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: { password: ["Reset link is missing."] } },
      { status: 400 }
    );
  }

  const parsed = PasswordSchema.safeParse(bodyParsed.data.password);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Validation failed.",
        errors: { password: [parsed.error.issues[0]?.message ?? "Invalid password."] },
      },
      { status: 400 }
    );
  }
  const { token } = bodyParsed.data;

  const db = await getDb();
  await ensureIndexesAndAdmin();

  const tokens = await getAuthTokensCollection();
  const doc = await tokens.findOne({
    token: hashToken(token),
    purpose: "password-reset",
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!doc || !ObjectId.isValid(doc.userId)) {
    return NextResponse.json(
      { message: "This reset link is invalid or has expired. Request a new one." },
      { status: 400 }
    );
  }

  const users = db.collection("users");
  const user = await users.findOne({ _id: new ObjectId(doc.userId) });
  if (!user) {
    return NextResponse.json(
      { message: "This reset link is invalid or has expired. Request a new one." },
      { status: 400 }
    );
  }

  if (await bcrypt.compare(parsed.data, user.password ?? "")) {
    return NextResponse.json(
      { message: "New password must be different from the current one." },
      { status: 400 }
    );
  }

  const hash = await bcrypt.hash(parsed.data, BCRYPT_COST);
  await users.updateOne(
    { _id: user._id },
    {
      $set: {
        password: hash,
        updatedAt: new Date(),
        failedAttempts: 0,
        lockUntil: null,
      },
    }
  );

  // Consume this token and invalidate any other outstanding reset links.
  await tokens.deleteMany({ userId: doc.userId, purpose: "password-reset" });

  return NextResponse.json({ ok: true });
}