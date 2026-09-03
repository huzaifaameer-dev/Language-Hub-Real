import Stripe from "stripe";

const secret = process.env.STRIPE_SECRET_KEY ?? "";

/**
 * True only when a real Stripe secret key is configured. When false, the UI
 * falls back to the manual (screenshot) payment flow so the app never breaks.
 */
export function stripeConfigured(): boolean {
  return secret.startsWith("sk_") && secret.length > 20;
}

/**
 * Shared Stripe client. Only construct it when keys are present; constructing
 * with an empty key would throw on first call.
 */
export function getStripe(): Stripe | null {
  if (!stripeConfigured()) return null;
  return new Stripe(secret, {
    apiVersion: "2026-08-26.dahlia",
    typescript: true,
  });
}

/** Currency used for all Language Hub payments (uppercase ISO). */
export const PAYMENT_CURRENCY = "PKR";

export function amountToSubunits(amount: number): number {
  // PKR has 0 decimal places in Stripe's zero-decimal handling; treat as is.
  return Math.max(1, Math.round(amount));
}
