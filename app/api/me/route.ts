import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { auth } from "@/auth";
import { getUsersCollection } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  if (!ObjectId.isValid(session.user.id)) {
    return NextResponse.json({ message: "Invalid session." }, { status: 400 });
  }

  const users = await getUsersCollection();
  const user = await users.findOne({ _id: new ObjectId(session.user.id) });
  if (!user) {
    // The session JWT is valid but the account no longer exists (e.g. it was
    // cleaned up). Treat as an expired session so clients can sign out.
    return NextResponse.json({ message: "Session expired. Sign in again." }, { status: 401 });
  }

  // Academy contact for the dashboard "get in touch" tile.
  const adminRow = await users.findOne(
    { role: "ADMIN" },
    { projection: { email: 1 } }
  );

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
      email: adminRow?.email ?? null,
      // Optional studio WhatsApp, e.g. "923001234567". Cleared by default;
      // set ACADEMY_WHATSAPP in the environment to surface a wa.me button.
      whatsapp: process.env.ACADEMY_WHATSAPP?.replace(/[^\d]/g, "") || null,
    },
  });
}