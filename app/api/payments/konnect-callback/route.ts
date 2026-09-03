import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getDb, getEnrollmentsCollection } from "@/lib/db";
import { konnectConfigured, verifyKonnectPayment, verifyKonnectWebhook } from "@/lib/konnect";
import { checkSeatAvailability } from "@/lib/course-stats";
import { publishEvent } from "@/lib/realtime";
import { notify } from "@/lib/notifications";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

/**
 * Konnect callback — handles both webhook (POST) and user redirect (GET).
 *
 * POST: Konnect sends payment status here after the student completes (or
 *        fails) payment. We verify via the Konnect API and lock the seat.
 * GET:  The student is redirected here after payment. We check status and
 *        redirect to dashboard with a query flag.
 */
export async function POST(request: Request) {
  if (!konnectConfigured()) {
    return NextResponse.json({ received: false }, { status: 200 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-konnect-signature");

  if (!verifyKonnectWebhook(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { orderId, paymentId, status } = body as {
    orderId?: string;
    paymentId?: string;
    status?: string;
  };

  if (!orderId || (status !== "SUCCESS" && status !== "PAID" && status !== "COMPLETED")) {
    return NextResponse.json({ received: true });
  }

  // Verify the payment with Konnect API to be sure
  if (paymentId) {
    const verified = await verifyKonnectPayment(paymentId);
    if (!verified.paid) {
      return NextResponse.json({ received: true });
    }
  }

  const db = await getDb();
  const payments = db.collection("payments");

  // Find the payment record
  const payment = await payments.findOne({
    $or: [{ providerRef: paymentId }, { providerRef: orderId }],
    provider: "konnect",
    status: "PENDING",
  });
  if (!payment) {
    return NextResponse.json({ received: true });
  }

  const enrollmentId = String(payment.enrollmentId);
  const userId = String(payment.userId);

  // Mark payment as PAID
  await payments.updateOne(
    { _id: payment._id },
    { $set: { status: "PAID", providerRef: paymentId ?? orderId, updatedAt: new Date() } }
  );

  // Lock the seat
  const enrollments = await getEnrollmentsCollection();
  const enrollment = await enrollments.findOne({ _id: new ObjectId(enrollmentId) });
  if (enrollment) {
    if (enrollment.subjects?.length && enrollment.batch) {
      const gate = await checkSeatAvailability(enrollment.subjects, enrollment.batch);
      if (gate.ok) {
        await enrollments.updateOne(
          { _id: new ObjectId(enrollmentId) },
          { $set: { status: "ENROLLED", updatedAt: new Date() } }
        );
      }
    }
    if (enrollment.userId) {
      await notify(String(enrollment.userId), {
        kind: "enrollment",
        title: "Enrollment confirmed",
        message: "Payment received via EasyPaisa/JazzCash — your seat is locked in.",
        href: "/dashboard",
      });
    }
    publishEvent({ table: "enrollments", userId: userId, at: Date.now() });
  }

  revalidateTag("catalog", { expire: 0 });
  return NextResponse.json({ received: true });
}

/**
 * GET redirect handler — the student lands here after Konnect payment.
 * Checks status and redirects to dashboard with appropriate query flag.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("order");

  if (!orderId || !konnectConfigured()) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/dashboard" },
    });
  }

  // Check if the payment was already confirmed by the webhook
  const db = await getDb();
  const payment = await db.collection("payments").findOne({
    $or: [{ providerRef: orderId }, { providerRef: { $regex: orderId } }],
    provider: "konnect",
  });

  if (payment?.status === "PAID") {
    return new Response(null, {
      status: 302,
      headers: { Location: "/dashboard?payment=paid" },
    });
  }

  // If we have a paymentId, verify with Konnect
  if (payment?.providerRef && payment.providerRef !== orderId) {
    const verified = await verifyKonnectPayment(payment.providerRef);
    if (verified.paid) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/dashboard?payment=paid" },
      });
    }
  }

  return new Response(null, {
    status: 302,
    headers: { Location: "/dashboard?payment=processing" },
  });
}
