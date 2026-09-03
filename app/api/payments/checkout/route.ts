import { NextResponse } from "next/server";

import { auth } from "@/auth";
import {
  getDb,
  getEnrollmentsCollection,
  getCoursesCollection,
  ENROLLMENT_ACTIVE_STATUSES,
} from "@/lib/db";
import { getStripe, stripeConfigured, PAYMENT_CURRENCY, amountToSubunits } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * Creates a Stripe Checkout Session for the user's active (AWAITING_PAYMENT)
 * enrollment. The chargeable amount is derived server-side from the course fee
 * in the DB — never from anything the client sends.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  if (!stripeConfigured()) {
    return NextResponse.json(
      { message: "Online payment is not configured yet. Please use the manual flow." },
      { status: 503 }
    );
  }
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ message: "Payment unavailable." }, { status: 503 });
  }

  const db = await getDb();
  const enrollments = await getEnrollmentsCollection();
  const courses = await getCoursesCollection();

  // Find the user's active enrollment awaiting payment.
  const enrollment = await enrollments.findOne({
    userId: session.user.id,
    status: { $in: ENROLLMENT_ACTIVE_STATUSES },
  });
  if (!enrollment) {
    return NextResponse.json({ message: "No active enrollment to pay for." }, { status: 404 });
  }
  if (enrollment.status !== "AWAITING_PAYMENT") {
    return NextResponse.json({ message: "Enrollment is not awaiting payment." }, { status: 409 });
  }

  // Derive total from course fees (server-side, authoritative).
  const coursesDocs = await courses
    .find({ name: { $in: enrollment.subjects }, active: true })
    .toArray();
  const total = coursesDocs.reduce((sum, c) => sum + (c.fee ?? 0), 0);
  if (total <= 0) {
    return NextResponse.json(
      { message: "Could not compute a fee for these courses." },
      { status: 400 }
    );
  }

  const baseUrl =
    (process.env.NEXTAUTH_URL ||
      process.env.AUTH_URL ||
      "http://localhost:3000").replace(/\/+$/, "");

  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: PAYMENT_CURRENCY.toLowerCase(),
          unit_amount: amountToSubunits(total),
          product_data: {
            name: `Language Hub Enrollment`,
            description: `${enrollment.subjects.join(", ")} · Batch ${enrollment.batch}`,
          },
        },
        quantity: 1,
      },
    ],
    customer_email: session.user.email || undefined,
    metadata: {
      enrollmentId: String(enrollment._id),
      userId: String(session.user.id),
    },
    success_url: `${baseUrl}/api/payments/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/dashboard`,
  });

  // Record the payment intent.
  const payments = db.collection("payments");
  const now = new Date();
  const existing = await payments.findOne({
    enrollmentId: String(enrollment._id),
    provider: "stripe",
    status: "PENDING",
  });
  if (existing && existing.providerRef) {
    // Reuse the active session; don't stack duplicates.
    try {
      await stripe.checkout.sessions.retrieve(existing.providerRef);
      return NextResponse.json({ url: checkout.url, sessionId: checkout.id, paymentId: String(existing._id) });
    } catch {
      // old session invalid — fall through and create fresh below
    }
  }

  await payments.insertOne({
    enrollmentId: String(enrollment._id),
    userId: String(session.user.id),
    amount: total,
    currency: PAYMENT_CURRENCY,
    provider: "stripe",
    providerRef: checkout.id,
    status: "PENDING",
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ url: checkout.url, sessionId: checkout.id });
}
