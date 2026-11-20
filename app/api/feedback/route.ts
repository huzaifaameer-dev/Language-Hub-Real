import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { botGuardError } from "@/lib/bot-check";
import { createFeedback } from "@/lib/server/learner";
import { FeedbackSchema, fieldErrors } from "@/lib/validate";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Public feedback intake: guests and signed-in learners both work; the row
 *  lands in the admin panel's Feedback inbox. Rate-limited + honeypot-checked. */
export async function POST(request: Request) {
  const session = await auth();

  const rl = await rateLimitDb(
    await clientKey(request, "feedback"),
    5,
    10 * 60 * 1000
  );
  if (!rl.ok) {
    return NextResponse.json(
      { message: `Too many submissions. Try again in ${rl.retryAfter}s.` },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  if (botGuardError(body)) {
    return NextResponse.json({ message: "Submission rejected." }, { status: 400 });
  }

  const parsed = FeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Please review the highlighted fields.", errors: fieldErrors(parsed) },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const row = await createFeedback({
    userId: session?.user?.id ?? null,
    name: d.name.trim(),
    email: d.email?.trim() || null,
    category: d.category,
    rating: d.rating,
    subject: d.subject.trim(),
    message: d.message.trim(),
    contactOk: !!d.contactOk,
  });

  return NextResponse.json({ id: row.id, ok: true }, { status: 201 });
}
