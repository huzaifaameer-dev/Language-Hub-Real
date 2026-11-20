import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { auth } from "@/auth";
import { findUserById, updatePassword } from "@/lib/server/users";
import { PasswordChangeSchema, fieldErrors } from "@/lib/validate";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";

const BCRYPT_COST = 12;

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  const rl = await rateLimitDb(
    await clientKey(request, `password:${session.user.id}`),
    10,
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

  const parsed = PasswordChangeSchema.safeParse(body);
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

  const valid = await bcrypt.compare(parsed.data.current, user.password_hash ?? "");
  if (!valid) {
    return NextResponse.json({ message: "Current password is incorrect." }, { status: 403 });
  }

  if (parsed.data.current === parsed.data.next) {
    return NextResponse.json(
      { message: "New password must be different from the current one." },
      { status: 400 }
    );
  }

  const hash = await bcrypt.hash(parsed.data.next, BCRYPT_COST);
  // Bumps token_version: every session minted with the old password stops
  // working, so the client signs out and asks for the new password once.
  await updatePassword(user.id, hash);

  return NextResponse.json({ ok: true, reauth: true });
}
