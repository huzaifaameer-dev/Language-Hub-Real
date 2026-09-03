import { redirect } from "next/navigation";
import Stripe from "stripe";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { getStripe, stripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * Redirect target after Stripe Checkout. This endpoint only *confirms* the
 * session is genuinely paid and that it belongs to the signed-in user — it
 * never mutates enrollment state. The signature-verified Stripe webhook is the
 * single source of truth that locks the seat (ENROLLED); this page just sends
 * the student back to the dashboard where the live status updates.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");

  if (!sessionId || !stripeConfigured()) {
    redirect("/dashboard");
  }
  const stripe = getStripe();
  if (!stripe) redirect("/dashboard");

  let checkout: Stripe.Checkout.Session;
  try {
    checkout = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    redirect("/dashboard");
  }

  if (checkout.payment_status !== "paid") {
    redirect("/dashboard?payment=not_paid");
  }

  const enrollmentId = String(checkout.metadata?.enrollmentId ?? "");
  const userId = String(checkout.metadata?.userId ?? "");
  if (!enrollmentId || userId !== session.user.id) {
    redirect("/dashboard");
  }

  // Already confirmed by the webhook → tell the student success right away.
  // If the webhook hasn't landed yet, the dashboard's live status will update
  // the moment it does (no state change from this unverifiable client path).
  try {
    const db = await getDb();
    const payment = await db.collection("payments").findOne({
      enrollmentId,
      providerRef: sessionId,
      status: "PAID",
    });
    if (payment) {
      redirect("/dashboard?payment=paid");
    }
  } catch {
    // DB hiccup — fall through to a neutral redirect.
  }

  redirect("/dashboard?payment=processing");
}