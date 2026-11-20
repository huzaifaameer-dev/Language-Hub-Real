import { NextResponse } from "next/server";

import { botGuardError } from "@/lib/bot-check";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";
import { createStudentReview } from "@/lib/server/studentReviews";
import { normalizePhotoDataUri } from "@/lib/images";
import { StudentReviewSchema, fieldErrors } from "@/lib/validate";

export const dynamic = "force-dynamic";

/**
 * Public intake for student reviews. The row is private (status NEW) until an
 * admin publishes it from the panel. Honeypot + rate limit keep spam out.
 */
export async function POST(request: Request) {
  const rl = await rateLimitDb(await clientKey(request, "student-reviews"), 4, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { message: `Too many submissions. Please try again in ${rl.retryAfter}s.` },
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

  const parsed = StudentReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Please review the highlighted fields.", errors: fieldErrors(parsed) },
      { status: 400 }
    );
  }

  const d = parsed.data;

  // Decode + re-encode the photo rather than storing the raw upload. This
  // verifies the bytes are a real image, strips EXIF/GPS and guarantees the
  // served file can never be a script polyglot.
  const photo = await normalizePhotoDataUri(d.photo, { size: 720, quality: 82 });
  if (!photo) {
    return NextResponse.json(
      {
        message: "Please review the highlighted fields.",
        errors: { photo: ["That photo could not be read. Try another JPG or PNG."] },
      },
      { status: 400 }
    );
  }

  const id = await createStudentReview({
    name: d.name,
    email: d.email?.trim() || null,
    phone: d.phone?.trim() || null,
    course: d.course,
    batch: d.batch?.trim() || null,
    teacher: d.teacher?.trim() || null,
    headline: d.headline,
    body: d.body,
    outcome: d.outcome?.trim() || null,
    rating: d.rating,
    photo,
  });

  return NextResponse.json({ ok: true, id }, { status: 201 });
}
