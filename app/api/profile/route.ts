import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { unlink } from "node:fs/promises";
import path from "node:path";

import { auth } from "@/auth";
import { findUserById, updateProfile } from "@/lib/server/users";
import { q } from "@/lib/server/pg";
import { ProfileUpdateSchema, AccountDeleteSchema, fieldErrors } from "@/lib/validate";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function uploadsDir(): string {
  return path.join(process.cwd(), "public", "uploads", "avatars");
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  const user = await findUserById(session.user.id);
  if (!user) {
    return NextResponse.json({ message: "Session expired. Sign in again." }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
      whatsapp: user.phone ?? "",
      role: user.role,
      image: user.image,
      bio: user.bio ?? "",
      createdAt: new Date(user.created_at).toISOString(),
    },
  });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  const rl = await rateLimitDb(
    await clientKey(request, `profile:${session.user.id}`),
    20,
    60 * 60 * 1000
  );
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

  const user = await updateProfile(session.user.id, {
    name: name.trim(),
    ...(whatsapp === undefined ? {} : { phone: whatsapp.trim() || null }),
  });

  return NextResponse.json({
    ok: true,
    user: { name: user.name, whatsapp: user.phone ?? "" },
  });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  const rl = await rateLimitDb(
    await clientKey(request, `delete:${session.user.id}`),
    3,
    60 * 60 * 1000
  );
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

  const user = await findUserById(session.user.id);
  if (!user) {
    return NextResponse.json({ message: "Session expired. Sign in again." }, { status: 401 });
  }

  if (user.role === "ADMIN") {
    // Admin accounts are never deleted from the learner UI.
    return NextResponse.json(
      { message: "Admin accounts cannot be deleted here." },
      { status: 403 }
    );
  }

  const valid = await bcrypt.compare(parsed.data.password, user.password_hash ?? "");
  if (!valid) {
    return NextResponse.json(
      { message: "Incorrect password. Account not deleted." },
      { status: 403 }
    );
  }

  // Best-effort disk cleanup, then a single delete (every dependent row is
  // removed by ON DELETE CASCADE / SET NULL in the schema).
  await Promise.all([
    unlink(path.join(uploadsDir(), `${user.id}.webp`)).catch(() => {}),
    unlink(path.join(uploadsDir(), `${user.id}.jpg`)).catch(() => {}),
    unlink(path.join(uploadsDir(), `${user.id}.png`)).catch(() => {}),
  ]);

  await q("DELETE FROM users WHERE id = $1", [user.id]);

  return NextResponse.json({ ok: true });
}
