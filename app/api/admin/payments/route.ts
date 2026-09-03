import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { requireAdmin } from "@/lib/admin-guard";
import { getDb, logAdminAction } from "@/lib/db";
import { getStripe, stripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/** Admin payments ledger — list + refund. */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const db = await getDb();
  const [docs, total, paid, failed, refunded, pending] = await Promise.all([
    db.collection("payments").find({}).sort({ createdAt: -1 }).limit(300).toArray(),
    db.collection("payments").countDocuments({}),
    db.collection("payments").countDocuments({ status: "PAID" }),
    db.collection("payments").countDocuments({ status: "FAILED" }),
    db.collection("payments").countDocuments({ status: "REFUNDED" }),
    db.collection("payments").countDocuments({ status: "PENDING" }),
  ]);

  const list = docs.map((d) => ({
    id: String(d._id),
    enrollmentId: d.enrollmentId,
    userId: d.userId,
    amount: d.amount,
    currency: d.currency,
    provider: d.provider,
    status: d.status,
    providerRef: d.providerRef ?? null,
    createdAt: d.createdAt?.toISOString?.() ?? null,
  }));

  return NextResponse.json({
    payments: list,
    counts: { total, paid, failed, refunded, pending },
  });
}

/**
 * Admin: refund a payment.
 *  - Stripe payments get a REAL refund issued through the Stripe API whenever
 *    possible (targets the PaymentIntent captured by the webhook).
 *  - If Stripe is not configured (manual flow) it simply marks the record
 *    REFUNDED so the ledger stays truthful for offline refunds.
 */
export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const body = (await request.json().catch(() => null)) as { id?: string; action?: string } | null;
  const id = body?.id ?? "";
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Invalid id." }, { status: 400 });
  }
  if (body?.action !== "REFUND") {
    return NextResponse.json({ message: "Unknown action." }, { status: 400 });
  }

  const db = await getDb();
  const payments = db.collection("payments");
  const doc = await payments.findOne({ _id: new ObjectId(id) });
  if (!doc) {
    return NextResponse.json({ message: "Payment not found." }, { status: 404 });
  }

  const provider = doc.provider as string;
  const status = doc.status as string;
  if (status !== "PAID" && status !== "REFUNDED") {
    return NextResponse.json(
      { message: "Only paid payments can be refunded." },
      { status: 400 }
    );
  }

  // Real Stripe refund for online (card) payments.
  if (provider === "stripe" && stripeConfigured()) {
    const stripe = getStripe();
    const paymentIntentId =
      (doc.paymentIntentId as string | null) ||
      (typeof doc.providerRef === "string" ? doc.providerRef : null);
    if (!stripe || !paymentIntentId) {
      return NextResponse.json(
        { message: "No charge reference found for this payment." },
        { status: 400 }
      );
    }

    try {
      // PaymentIntent ids (`pi_…`) refund directly; older records may hold the
      // Checkout Session id (`cs_…`) — resolve that to its PaymentIntent first.
      const target: string = paymentIntentId.startsWith("pi_")
        ? paymentIntentId
        : String(
            (await stripe.checkout.sessions.retrieve(paymentIntentId)).payment_intent ?? ""
          );
      if (!target.startsWith("pi_")) {
        throw new Error("Could not resolve payment to a chargeable intent.");
      }
      const refund = await stripe.refunds.create({
        payment_intent: target,
        reason: "requested_by_customer",
      });
      await payments.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            status: "REFUNDED",
            refundedRef: refund.id,
            updatedAt: new Date(),
          },
        }
      );
      void logAdminAction({
        actor: admin.email ?? "admin",
        action: "REFUND",
        targetType: "payment",
        targetLabel: String(id),
        detail: `refund ${refund.id} via Stripe`,
      });
      return NextResponse.json({ ok: true, refundId: refund.id });
    } catch (err) {
      return NextResponse.json(
        { message: `Stripe refund failed: ${(err as Error).message}` },
        { status: 422 }
      );
    }
  }

  // Manual/offline payments (or Stripe not configured): mark refunded in ledger.
  await payments.updateOne(
    { _id: new ObjectId(id) },
    { $set: { status: "REFUNDED", updatedAt: new Date() } }
  );
  void logAdminAction({
    actor: admin.email ?? "admin",
    action: "REFUND",
    targetType: "payment",
    targetLabel: String(id),
    detail: "manual/offline refund",
  });
  return NextResponse.json({ ok: true, manual: true });
}