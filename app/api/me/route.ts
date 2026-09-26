import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { auth } from "@/auth";
import { getUsersCollection } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    // Signed-out visitors get a 200 + null (like /api/auth/session), so the
    // navbar never logs 401 noise for its optional profile-avatar fetch.
    return NextResponse.json({ user: null });
  }

  if (!ObjectId.isValid(session.user.id)) {
    return NextResponse.json({ user: null });
  }

  const users = await getUsersCollection();
  const user = await users.findOne({ _id: new ObjectId(session.user.id) });
  if (!user) {
    // The session JWT is valid but the account no longer exists (e.g. after a
    // database reset). Treat as signed-out so clients can render the guest
    // UI instead of surfacing a 401 error noise.
    return NextResponse.json({ user: null });
  }

  // Support contact for the dashboard "get in touch" tile. The admin's private
  // email is intentionally NOT exposed to regular users; only the env-provided
  // studio WhatsApp is surfaced.
  return NextResponse.json({
    user: {
      name: user.name,
      email: user.email,
      whatsapp: user.whatsapp ?? "",
      role: user.role ?? "USER",
      image: user.image ?? null,
      createdAt: user.createdAt?.toISOString?.() ?? null,
    },
    support: {
      whatsapp:
        (process.env.ACADEMY_WHATSAPP || process.env.NEXT_PUBLIC_ACADEMY_WHATSAPP)?.replace(/[^\d]/g, "") || null,
    },
  });
}