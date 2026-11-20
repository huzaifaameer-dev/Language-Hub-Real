import { NextResponse } from "next/server";
import { z } from "zod";

import { consumeToken, markEmailVerified } from "@/lib/server/users";
import { q } from "@/lib/server/pg";
import { notify } from "@/lib/notifications";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const VerifySchema = z.object({ token: z.string().min(1) });

export async function POST(request: Request) {
  const rl = await rateLimitDb(await clientKey(request, "verify"), 10, 60 * 60 * 1000);
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

  const parsed = VerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid verification link." }, { status: 400 });
  }

  const userId = await consumeToken(parsed.data.token, "VERIFY_EMAIL");
  if (!userId) {
    return NextResponse.json(
      { message: "This verification link is invalid or has expired." },
      { status: 400 }
    );
  }

  await markEmailVerified(userId);
  await q("DELETE FROM auth_tokens WHERE user_id = $1 AND kind = 'VERIFY_EMAIL'", [
    userId,
  ]);

  await notify(userId, {
    kind: "system",
    title: "Email verified",
    message: "Your email address is now verified.",
    href: "/dashboard",
  });

  return NextResponse.json({ ok: true });
}
