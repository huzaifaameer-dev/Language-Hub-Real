import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { PasswordChangeSchema, fieldErrors } from "@/lib/validate";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";

const BCRYPT_COST = 12;

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }
  if (!ObjectId.isValid(session.user.id)) {
    return NextResponse.json({ message: "Invalid session." }, { status: 400 });
  }

  const rl = await rateLimitDb(await clientKey(request, `password:${session.user.id}`), 10, 60 * 60 * 1000);
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

  const parsed = PasswordChangeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: fieldErrors(parsed) },
      { status: 400 }
    );
  }

  const db = await getDb();
  const users = db.collection("users");
  const id = new ObjectId(session.user.id);

  const user = await users.findOne({ _id: id });
  if (!user) {
    return NextResponse.json(
      { message: "Session expired. Sign in again." },
      { status: 401 }
    );
  }

  const valid = await bcrypt.compare(parsed.data.current, user.password ?? "");
  if (!valid) {
    return NextResponse.json(
      { message: "Current password is incorrect." },
      { status: 403 }
    );
  }

  if (parsed.data.current === parsed.data.next) {
    return NextResponse.json(
      { message: "New password must be different from the current one." },
      { status: 400 }
    );
  }

  const hash = await bcrypt.hash(parsed.data.next, BCRYPT_COST);
  await users.updateOne(
    { _id: id },
    {
      $set: {
        password: hash,
        updatedAt: new Date(),
        // A password change is a natural brute-force reset point.
        failedAttempts: 0,
        lockUntil: null,
      },
    }
  );

  return NextResponse.json({ ok: true });
}