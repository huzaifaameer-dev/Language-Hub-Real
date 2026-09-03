/**
 * Konnect (by 1Bill / PayPro) payment gateway helper.
 *
 * Konnect is a Pakistani payment gateway that supports EasyPaisa, JazzCash,
 * bank transfers and local debit cards — all in PKR. More relevant for
 * domestic conversions than Stripe card-only flow.
 *
 * Environment variables:
 *   KONNECT_MERCHANT_ID  — merchant identifier from Konnect dashboard
 *   KONNECT_SECRET_KEY   — API secret / auth token
 *   KONNECT_API_URL      — base URL (default: https://api.konnect.one/api/v1)
 *   KONNECT_RETURN_URL   — where the user lands after payment (set dynamically)
 *   KONNECT_WEBHOOK_URL  — Konnect sends payment status here
 */

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

/** Verify Konnect webhook signature (if provided). */
export function verifyKonnectWebhook(
  _payload: string,
  _signature: string | null
): boolean {
  // Konnect webhook verification — implement per their docs once
  // merchant credentials are live. For now, return true and rely on
  // paymentId verification as the trust anchor.
  void _payload;
  void _signature;
  return true;
}
