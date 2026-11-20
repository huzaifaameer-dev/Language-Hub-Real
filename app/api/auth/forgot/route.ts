import { NextResponse } from "next/server";
import { z } from "zod";

import { sendResetEmail, emailConfigured } from "@/lib/email";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";
import { findUserByEmail, issueToken } from "@/lib/server/users";
import { q } from "@/lib/server/pg";

export const dynamic = "force-dynamic";

const ForgotSchema = z.object({
  email: z.email("Enter a valid email address.").max(120).trim(),
});

export async function POST(request: Request) {
  // Global per-client cap across every address. Without this, rotating the
  // email in the body would let one caller send unlimited reset mails and
  // burn the SMTP quota (email bombing).
  const burst = await rateLimitDb(await clientKey(request, "forgot"), 12, 60 * 60 * 1000);
  if (!burst.ok) {
    return NextResponse.json(
      { message: "Too many requests. Try again in about an hour." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const parsed = ForgotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Validation failed.",
        errors: { email: ["Enter a valid email address."] },
      },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase();
  // Per-address bucket (global, not per client) so a single inbox cannot be
  // flooded from a botnet, plus the per-client bucket above.
  const rl = await rateLimitDb(`forgot-account:${email}`, 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { message: "Too many requests. Try again in about an hour." },
      { status: 429 }
    );
  }

  // Identical response whether or not the account exists (no enumeration).
  const genericBody = () =>
    NextResponse.json({ ok: true, smtpConfigured: emailConfigured() });

  const user = await findUserByEmail(email);
  if (!user) return genericBody();

  // One live reset link at a time.
  await q("DELETE FROM auth_tokens WHERE user_id = $1 AND kind = 'RESET_PASSWORD'", [
    user.id,
  ]);

  const token = await issueToken(user.id, "RESET_PASSWORD", 30);
  await sendResetEmail({ to: email, name: user.name, token });

  return genericBody();
}
