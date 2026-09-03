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
  const notWithdrawal = { $or: [{ type: { $ne: "WITHDRAWAL" } }, { type: { $exists: false } }] };
  const [docs, total, paid, failed, refunded, pending, depAgg, witAgg] = await Promise.all([
    db.collection("payments").find({}).sort({ createdAt: -1 }).limit(300).toArray(),
    db.collection("payments").countDocuments({}),
    db.collection("payments").countDocuments({ status: "PAID" }),
    db.collection("payments").countDocuments({ status: "FAILED" }),
    db.collection("payments").countDocuments({ status: "REFUNDED" }),
    db.collection("payments").countDocuments({ status: "PENDING" }),
    db
      .collection("payments")
      .aggregate([
        { $match: { status: "PAID", ...notWithdrawal } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ])
      .toArray(),
    db
      .collection("payments")
      .aggregate([
        { $match: { status: "PAID", type: "WITHDRAWAL" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ])
      .toArray(),
  ]);

  const list = docs.map((d) => ({
    id: String(d._id),
    enrollmentId: d.enrollmentId,
    userId: d.userId,
    amount: d.amount,
    currency: d.currency,
    provider: d.provider,
    status: d.status,
    type: d.type ?? "DEPOSIT",
    method: d.method ?? null,
    note: d.note ?? null,
    studentName: d.studentName ?? null,
    studentEmail: d.studentEmail ?? null,
    providerRef: d.providerRef ?? null,
    createdAt: d.createdAt?.toISOString?.() ?? null,
  }));

  const depositsTotal = depAgg[0]?.total ?? 0;
  const withdrawalsTotal = witAgg[0]?.total ?? 0;

  return NextResponse.json({
    payments: list,
    counts: { total, paid, failed, refunded, pending },
    finance: {
      deposits: depositsTotal,
      withdrawals: withdrawalsTotal,
      balance: depositsTotal - withdrawalsTotal,
    },
  });
}

/**
 * Admin: record a manual payment or withdrawal into the ledger. The admin
 * types in the amount and picks a settlement method (card / EasyPaisa /
 * JazzCash / bank / cash) — no real gateway is hit, this is an offline ledger
 * entry for cash, screenshots and walk-ins.
 */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  const db = await getDb();

  const body = (await request.json().catch(() => null)) as {
    type?: string;
    method?: string;
    amount?: unknown;
    currency?: string;
    note?: string;
    studentName?: string;
    studentEmail?: string;
    enrollmentId?: string;
  } | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const type = body.type === "WITHDRAWAL" ? "WITHDRAWAL" : "DEPOSIT";
  const method =
    body.method === "card" ||
    body.method === "easypaisa" ||
    body.method === "jazzcash" ||
    body.method === "bank" ||
    body.method === "cash"
      ? body.method
      : "cash";

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ message: "A valid amount greater than zero is required." }, { status: 400 });
  }

  const now = new Date();
  const enrollmentId = typeof body.enrollmentId === "string" ? body.enrollmentId : "";

  // A withdrawal must actually be covered by available balance — it reduces the
  // ledger balance (deposits − withdrawals) instead of just being logged.
  if (type === "WITHDRAWAL") {
    const [deposits, withdrawals] = await Promise.all([
      db
        .collection("payments")
        .aggregate([
          { $match: { status: "PAID", $or: [{ type: { $ne: "WITHDRAWAL" } }, { type: { $exists: false } }] } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ])
        .toArray(),
      db
        .collection("payments")
        .aggregate([
          { $match: { status: "PAID", type: "WITHDRAWAL" } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ])
        .toArray(),
    ]);
    const balance = (deposits[0]?.total ?? 0) - (withdrawals[0]?.total ?? 0);
    if (amount > balance) {
      return NextResponse.json(
        {
          message: `Insufficient balance. Available: PKR ${Math.max(0, balance).toLocaleString()}. Cannot withdraw PKR ${amount.toLocaleString()}.`,
        },
        { status: 400 }
      );
    }
  }

  const result = await db.collection("payments").insertOne({
    enrollmentId,
    userId: "",
    amount,
    currency: typeof body.currency === "string" && body.currency ? body.currency.slice(0, 3).toUpperCase() : "PKR",
    provider: "manual",
    status: "PAID",
    type,
    method,
    note: typeof body.note === "string" && body.note ? body.note.slice(0, 300) : null,
    studentName: typeof body.studentName === "string" && body.studentName ? body.studentName.slice(0, 120) : null,
    studentEmail: typeof body.studentEmail === "string" && body.studentEmail ? body.studentEmail.slice(0, 160) : null,
    createdBy: admin.email ?? "admin",
    createdAt: now,
    updatedAt: now,
  });

  void logAdminAction({
    actor: admin.email ?? "admin",
    action: type === "WITHDRAWAL" ? "MANUAL_WITHDRAWAL" : "MANUAL_DEPOSIT",
    targetType: "payment",
    targetLabel: String(result.insertedId),
    detail: `PKR ${amount.toLocaleString()} via ${method}${body.note ? ` (${body.note})` : ""}`,
  });

  return NextResponse.json({ ok: true, id: String(result.insertedId) }, { status: 201 });
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