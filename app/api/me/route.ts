import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { findUserById } from "@/lib/server/users";

export const dynamic = "force-dynamic";

/** The signed-in learner's own profile (freshest data, never from the JWT). */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    // 200 + null keeps optional navbar/avatar fetches free of 401 noise.
    return NextResponse.json({ user: null });
  }

  const user = await findUserById(session.user.id);
  if (!user || user.disabled) {
    // Valid JWT, missing or disabled account: render the guest UI.
    return NextResponse.json({ user: null });
  }

  // The admin's private email is never exposed to learners; only the public
  // studio WhatsApp number is surfaced for the dashboard support tile.
  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
      whatsapp: user.phone ?? "",
      role: user.role,
      image: user.image,
      bio: user.bio ?? "",
      referralCode: user.referral_code,
      emailVerified: Boolean(user.email_verified),
      createdAt: new Date(user.created_at).toISOString(),
    },
    support: {
      whatsapp:
        (process.env.ACADEMY_WHATSAPP || process.env.NEXT_PUBLIC_ACADEMY_WHATSAPP)?.replace(
          /[^\d]/g,
          ""
        ) || null,
    },
  });
}
