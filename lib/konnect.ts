/**
 * Konnect (by 1Bill / PayPro) payment gateway helper.
 *
 * Konnect is a Pakistani payment gateway that supports EasyPaisa, JazzCash,
 * bank transfers and local debit cards — all in PKR. More relevant for
 * domestic conversions than Stripe card-only flow.
 *
 * Environment variables:
 *   KONNECT_MERCHANT_ID     — merchant identifier from Konnect dashboard
 *   KONNECT_SECRET_KEY      — API secret / auth token
 *   KONNECT_API_URL         — base URL (default: https://api.konnect.one/api/v1)
 *   KONNECT_RETURN_URL      — where the user lands after payment (set dynamically)
 *   KONNECT_WEBHOOK_URL     — Konnect sends payment status here
 *   KONNECT_WEBHOOK_SECRET  — secret used to sign webhook callbacks (fallback:
 *                             KONNECT_SECRET_KEY when not set)
 */

import { createHmac, timingSafeEqual } from "node:crypto";

const KONNECT_API_URL =
  (process.env.KONNECT_API_URL ?? "https://api.konnect.one/api/v1").replace(/\/+$/, "");

const merchantId = process.env.KONNECT_MERCHANT_ID ?? "";
const secretKey = process.env.KONNECT_SECRET_KEY ?? "";

/**
 * True only when Konnect merchant credentials are configured. When false,
 * the UI falls back to the manual (screenshot) payment flow.
 */
export function konnectConfigured(): boolean {
  return !!(merchantId && secretKey && merchantId.length > 3);
}

export function getKonnectHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${secretKey}`,
  };
}

export interface KonnectPaymentRequest {
  /** Unique order reference from your system */
  merchantOrderID: string;
  /** Amount in PKR (whole number, no decimals) */
  amount: number;
  /** Currency — always PKR */
  currency: "PKR";
  /** Student name */
  customerName: string;
  /** Student email */
  customerEmail: string;
  /** Student phone (E.164-ish) */
  customerPhone: string;
  /** What this payment is for */
  productDescription: string;
  /** Where Konnect redirects the user after payment */
  returnUrl: string;
  /** Konnect webhook callback URL */
  webhookUrl?: string;
}

export interface KonnectPaymentResponse {
  /** Konnect's unique payment ID */
  paymentId?: string;
  /** The URL to redirect the user to for payment */
  paymentUrl?: string;
  /** Status from Konnect */
  status?: string;
  /** Error message if any */
  message?: string;
  /** Raw response body for logging */
  raw?: unknown;
}

/**
 * Initiates a Konnect payment. Returns the redirect URL the student should
 * visit to complete payment via EasyPaisa / JazzCash / card.
 */
export async function createKonnectPayment(
  input: KonnectPaymentRequest
): Promise<KonnectPaymentResponse> {
  if (!konnectConfigured()) {
    return { message: "Konnect is not configured." };
  }

  try {
    const res = await fetch(`${KONNECT_API_URL}/inbound/collect`, {
      method: "POST",
      headers: getKonnectHeaders(),
      body: JSON.stringify({
        merchantId,
        paymentMethod: "ALL", // EasyPaisa + JazzCash + Card + Bank
        amount: input.amount,
        currency: input.currency,
        orderId: input.merchantOrderID,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        productDescription: input.productDescription,
        returnUrl: input.returnUrl,
        webhookUrl: input.webhookUrl,
      }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok || body.error) {
      return {
        message: body.error?.message ?? body.message ?? `Konnect returned ${res.status}`,
        raw: body,
      };
    }

    return {
      paymentId: body.paymentId ?? body.id ?? body.data?.paymentId,
      paymentUrl: body.paymentUrl ?? body.data?.paymentUrl ?? body.url,
      status: body.status ?? "PENDING",
      raw: body,
    };
  } catch (err) {
    return {
      message: `Konnect request failed: ${(err as Error).message}`,
    };
  }
}

/**
 * Verifies a Konnect payment status. Used by the success redirect page
 * and the webhook handler to confirm the payment actually went through.
 */
export async function verifyKonnectPayment(
  paymentId: string
): Promise<{ paid: boolean; status: string; raw?: unknown }> {
  if (!konnectConfigured()) {
    return { paid: false, status: "unconfigured" };
  }

  try {
    const res = await fetch(`${KONNECT_API_URL}/inbound/status/${paymentId}`, {
      method: "GET",
      headers: getKonnectHeaders(),
    });

    const body = await res.json().catch(() => ({}));
    const status = body.status ?? body.data?.status ?? "UNKNOWN";
    const paid = status === "SUCCESS" || status === "PAID" || status === "COMPLETED";

    return { paid, status, raw: body };
  } catch {
    return { paid: false, status: "error" };
  }
}

/**
 * Verify a Konnect webhook HMAC signature.
 *
 * Konnect signs each webhook callback with an HMAC-SHA256 of the raw request
 * body, keyed by the merchant secret. The digest is sent in the
 * `x-konnect-signature` header (optionally prefixed `sha256=`), usually base64
 * or hex encoded.
 *
 * We try both encodings and compare in constant time to avoid leaking timing
 * information. If no webhook secret is configured we fail CLOSED (reject) so
 * payment confirmations can never be spoofed by a party that guessed the
 * endpoint; set `KONNECT_WEBHOOK_SECRET` (or `KONNECT_SECRET_KEY`) in prod.
 */
export function verifyKonnectWebhook(
  payload: string,
  signature: string | null
): boolean {
  const secret =
    process.env.KONNECT_WEBHOOK_SECRET ?? process.env.KONNECT_SECRET_KEY ?? "";
  if (!secret || !signature) return false;

  const expected = createHmac("sha256", secret).update(payload, "utf8").digest();
  // Crisp digest bytes.
  if (safeEqual(expected, Buffer.from(signature, "base64"))) return true;
  if (safeEqual(expected, Buffer.from(signature, "hex"))) return true;

  // Some gateways prefix the hex digest with a scheme, e.g. "sha256=abc…".
  const bare = signature.replace(/^sha256[=:]\s*/i, "");
  if (bare !== signature && safeEqual(expected, Buffer.from(bare, "hex"))) {
    return true;
  }
  return false;
}

/** Constant-time buffer comparison (length-safe). */
function safeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
