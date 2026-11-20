import { NextResponse } from "next/server";

import { currentUser } from "@/lib/server/session";
import { q } from "@/lib/server/pg";

export const dynamic = "force-dynamic";

/**
 * GDPR-style export: every row this app stores about the signed-in learner,
 * as a downloadable JSON file. No password hash, no admin data.
 */
export async function GET() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  const [registrations, enrollments, notifications, certificates] = await Promise.all([
    q<Record<string, unknown>>(
      "SELECT * FROM registrations WHERE user_id = $1 ORDER BY created_at DESC",
      [user.id]
    ),
    q<Record<string, unknown>>(
      "SELECT * FROM enrollments WHERE user_id = $1 ORDER BY created_at DESC",
      [user.id]
    ),
    q<Record<string, unknown>>(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC",
      [user.id]
    ),
    q<Record<string, unknown>>(
      "SELECT * FROM certificates WHERE user_id = $1 ORDER BY issued_at DESC",
      [user.id]
    ),
  ]);

  const data = {
    exportedAt: new Date().toISOString(),
    profile: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      bio: user.bio,
      image: user.image,
      role: user.role,
      emailVerified: Boolean(user.email_verified),
      referralCode: user.referral_code,
      createdAt: new Date(user.created_at).toISOString(),
    },
    registrations,
    enrollments,
    certificates,
    notifications,
  };

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="language-hub-export-${user.id}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
