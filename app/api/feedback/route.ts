import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { botGuardError } from "@/lib/bot-check";
import { ensureIndexesAndAdmin, getFeedbackCollection } from "@/lib/db";
import { FeedbackSchema, fieldErrors } from "@/lib/validate";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Public feedback intake: works for guests and signed-in users; lands in the
 *  admin Feedback tab. Rate-limited and verified against a honeypot. */
export async function POST(request: Request) {
  const session = await auth();

  const rl = await rateLimitDb(await clientKey(request, "feedback"), 5, 10 * 60 * 1000);
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

  const bot = botGuardError(body);
  if (bot) {
    return NextResponse.json({ message: "Submission rejected." }, { status: 400 });
  }

  const parsed = FeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Please review the highlighted fields.", errors: fieldErrors(parsed) },
      { status: 400 }
    );
  }

  await ensureIndexesAndAdmin();
  const col = await getFeedbackCollection();
  const now = new Date();
  const d = parsed.data;

  const result = await col.insertOne({
    name: d.name.trim(),
    email: d.email?.trim() || null,
    userId: session?.user?.id ?? null,
    category: d.category,
    rating: d.rating,
    subject: d.subject.trim(),
    message: d.message.trim(),
    contactOk: !!d.contactOk,
    status: "NEW",
    adminNote: null,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ id: String(result.insertedId), ok: true }, { status: 201 });
}