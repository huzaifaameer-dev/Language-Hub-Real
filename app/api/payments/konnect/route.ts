import { NextResponse } from "next/server";

import { auth } from "@/auth";
import {
  getDb,
  getEnrollmentsCollection,
  getCoursesCollection,
  ENROLLMENT_ACTIVE_STATUSES,
} from "@/lib/db";
import {
  konnectConfigured,
  createKonnectPayment,
} from "@/lib/konnect";
import { PAYMENT_CURRENCY } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * Creates a Konnect (EasyPaisa / JazzCash / card) payment session for the
 * user's active enrollment. The chargeable amount is derived server-side
 * from the course fee in the DB.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  if (!konnectConfigured()) {
    return NextResponse.json(
      { message: "Local payment is not configured yet. Please use the manual flow." },
      { status: 503 }
    );
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

  const orderId = `LH-${Date.now()}-${String(enrollment._id).slice(-6)}`;

  const paymentResult = await createKonnectPayment({
    merchantOrderID: orderId,
    amount: total,
    currency: "PKR",
    customerName: enrollment.name || session.user.name || "Student",
    customerEmail: enrollment.email || session.user.email || "",
    customerPhone: "",
    productDescription: `Language Hub: ${enrollment.subjects.join(", ")} · Batch ${enrollment.batch}`,
    returnUrl: `${baseUrl}/api/payments/konnect-callback?order=${orderId}`,
    webhookUrl: `${baseUrl}/api/payments/konnect-callback`,
  });

  if (!paymentResult.paymentUrl) {
    return NextResponse.json(
      { message: paymentResult.message || "Could not initiate Konnect payment." },
      { status: 502 }
    );
  }

  // Record the payment intent.
  const payments = db.collection("payments");
  const now = new Date();
  await payments.insertOne({
    enrollmentId: String(enrollment._id),
    userId: String(session.user.id),
    amount: total,
    currency: PAYMENT_CURRENCY,
    provider: "konnect",
    providerRef: paymentResult.paymentId ?? orderId,
    status: "PENDING",
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({
    url: paymentResult.paymentUrl,
    paymentId: paymentResult.paymentId,
    orderId,
  });
}
