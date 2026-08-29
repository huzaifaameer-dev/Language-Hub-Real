import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { unlink } from "node:fs/promises";
import path from "node:path";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import {
  ProfileUpdateSchema,
  AccountDeleteSchema,
  fieldErrors,
} from "@/lib/validate";
import { rateLimit, clientKey } from "@/lib/rate-limit";

function uploadsDir(): string {
  return path.join(process.cwd(), "public", "uploads", "avatars");
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }
  if (!ObjectId.isValid(session.user.id)) {
    return NextResponse.json({ message: "Invalid session." }, { status: 400 });
  }

  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(session.user.id) });
  if (!user) {
    return NextResponse.json(
      { message: "Session expired. Sign in again." },
      { status: 401 }
    );
  }

  return NextResponse.json({
    user: {
      name: user.name,
      email: user.email,
      whatsapp: user.whatsapp ?? "",
      role: user.role ?? "USER",
      image: user.image ?? null,
      createdAt: user.createdAt?.toISOString?.() ?? null,
    },
  });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }
  if (!ObjectId.isValid(session.user.id)) {
    return NextResponse.json({ message: "Invalid session." }, { status: 400 });
  }

  const rl = rateLimit(clientKey(request, `profile:${session.user.id}`), 20, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { message: "Too many updates. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const parsed = ProfileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation failed.", errors: fieldErrors(parsed) },
      { status: 400 }
    );
  }

  const { name, whatsapp } = parsed.data;
  const db = await getDb();
  const users = db.collection("users");

  const update: { name?: string; whatsapp?: string; updatedAt: Date } = {
    name: name.trim(),
    updatedAt: new Date(),
  };
  // whatsapp is optional so "leave blank" clears it; omitting keeps the value.
  if (whatsapp !== undefined) update.whatsapp = whatsapp.trim();

  const result = await users.updateOne({ _id: new ObjectId(session.user.id) }, { $set: update });
  if (result.matchedCount === 0) {
    return NextResponse.json(
      { message: "Session expired. Sign in again." },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    user: { name: update.name, whatsapp: update.whatsapp ?? "" },
  });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }
  if (!ObjectId.isValid(session.user.id)) {
    return NextResponse.json({ message: "Invalid session." }, { status: 400 });
  }

  const rl = rateLimit(clientKey(request, `delete:${session.user.id}`), 3, 60 * 60 * 1000);
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

  const parsed = AccountDeleteSchema.safeParse(body);
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

  if (user.role === "ADMIN") {
    // Admins are only ever removed via the database — never through the app.
    return NextResponse.json(
      { message: "Admin accounts cannot be deleted here." },
      { status: 403 }
    );
  }

  const valid = await bcrypt.compare(parsed.data.password, user.password ?? "");
  if (!valid) {
    return NextResponse.json(
      { message: "Incorrect password. Account not deleted." },
      { status: 403 }
    );
  }

  // Remove the stored avatar from disk (best-effort), then cascade deletes.
  await Promise.all([
    unlink(path.join(uploadsDir(), `${session.user.id}.webp`)).catch(() => {}),
    unlink(path.join(uploadsDir(), `${session.user.id}.jpg`)).catch(() => {}),
    unlink(path.join(uploadsDir(), `${session.user.id}.png`)).catch(() => {}),
  ]);

  const userId = session.user.id;
  await Promise.all([
    db.collection("applications").deleteMany({ userId }),
    db.collection("enrollments").deleteMany({ userId }),
    db.collection("notifications").deleteMany({ userId }),
    db.collection("auth_tokens").deleteMany({ userId }),
    // NextAuth adapter tables (orphan cleanup, sessions are validated against
    // the users row by /api/me and the dashboard page).
    db.collection("sessions").deleteMany({ userId }),
    db.collection("accounts").deleteMany({ userId }),
  ]);
  await users.deleteOne({ _id: id });

  return NextResponse.json({ ok: true });
}