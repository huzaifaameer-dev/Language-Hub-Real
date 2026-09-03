import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import Stripe from "stripe";

import { getStripe, stripeConfigured } from "@/lib/stripe";
import { getDb, getEnrollmentsCollection } from "@/lib/db";
import { checkSeatAvailability } from "@/lib/course-stats";
import { publishEvent } from "@/lib/realtime";
import { notify } from "@/lib/notifications";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook — the authoritative record of a completed payment.
 * Verifies the request signature, confirms the checkout session, then locks
 * the enrollment's seat. Never trust client-side confirmation alone.
 */
export async function POST(request: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json({ received: false }, { status: 200 });
  }
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ received: false }, { status: 200 });
  }

  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  // Session expired / abandoned before payment — release the pending payment
  // record so a stale PENDING intent never lingers as a blocker.
  if (event.type === "checkout.session.expired") {
    const expired = event.data.object as Stripe.Checkout.Session;
    if (expired.id) {
      const db = await getDb();
      await db
        .collection("payments")
        .updateOne(
          { providerRef: expired.id, status: "PENDING" },
          { $set: { status: "FAILED", updatedAt: new Date() } }
        );
    }
    return NextResponse.json({ received: true });
  }

  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") {
    return NextResponse.json({ received: true });
  }

  const checkout = event.data.object as Stripe.Checkout.Session;
  if (checkout.payment_status !== "paid") {
    return NextResponse.json({ received: true });
  }

  const enrollmentId = String(checkout.metadata?.enrollmentId ?? "");
  const userId = String(checkout.metadata?.userId ?? "");
  if (!ObjectId.isValid(enrollmentId) || !enrollmentId) {
    return NextResponse.json({ received: true });
  }

  const db = await getDb();
  const payments = db.collection("payments");
  const paymentIntentId =
    typeof checkout.payment_intent === "string" ? checkout.payment_intent : null;
  await payments.updateOne(
    { providerRef: checkout.id },
    {
      $set: {
        status: "PAID",
        providerRef: checkout.id,
        paymentIntentId,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        enrollmentId,
        userId,
        amount: checkout.amount_total ?? 0,
        currency: "PKR",
        provider: "stripe",
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );

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
        message: "Payment received — your seat is locked in.",
        href: "/dashboard",
      });
    }
    publishEvent({ table: "enrollments", userId: String(enrollment.userId), at: Date.now() });
  }

  revalidateTag("catalog", { expire: 0 });
  return NextResponse.json({ received: true });
}
