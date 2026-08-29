import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { ensureIndexesAndAdmin, getDb } from "@/lib/db";
import { setAdminCookie } from "@/lib/admin-session";

const LoginBody = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
  accessCode: z.string().min(1).max(100),
});

const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  await ensureIndexesAndAdmin();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const parsed = LoginBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Validation failed." }, { status: 400 });
  }

  const { email, password, accessCode } = parsed.data;

  const db = await getDb();
  const users = db.collection("users");
  const user = await users.findOne({ email: email.toLowerCase() });

  if (!user?.password || (user.role as string) !== "ADMIN") {
    return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
  }

  const locks = user as unknown as {
    _id: import("mongodb").ObjectId;
    failedAttempts?: number;
    lockUntil?: number | null;
  };

  if (locks.lockUntil && locks.lockUntil > Date.now()) {
    const minutes = Math.ceil((locks.lockUntil - Date.now()) / 60000);
    return NextResponse.json(
      { message: `ACCOUNT LOCKED — RETRY IN ${minutes} MIN`, locked: minutes },
      { status: 423 }
    );
  }

  const passwordOk = await bcrypt.compare(password, user.password as string);
  const codeOk = accessCode === (process.env.ADMIN_ACCESS_CODE ?? "");

  if (!passwordOk || !codeOk) {
    const failed = (locks.failedAttempts ?? 0) + 1;
    await users.updateOne(
      { _id: locks._id },
      {
        $set: {
          failedAttempts: failed,
          lockUntil: failed >= MAX_ATTEMPTS ? Date.now() + LOCK_MS : null,
        },
      }
    );
    return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
  }

  await users.updateOne(
    { _id: locks._id },
    { $set: { failedAttempts: 0, lockUntil: null } }
  );

  return setAdminCookie(NextResponse.json({ ok: true }), (user.email as string).toLowerCase());
}