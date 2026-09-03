/**
 * Per-client identity cookie.
 *
 * Anonymous rate limits (register, forgot, report, demo bookings…) are keyed
 * on this identity when it is present and valid, so clients cannot rotate
 * their User-Agent to reset the bucket. The real fix for hardened deployments
 * is a trusted reverse proxy + TRUST_PROXY=1 (then the key is bound to the
 * client IP); this cookie is the defense-in-depth layer for direct deploys.
 *
 * The value is `<base64url-random-id>.<hmac-sha256-signature>` signed with
 * AUTH_SECRET/NEXTAUTH_SECRET via Web Crypto (works on Edge middleware and
 * Node route handlers alike).
 */

const COOKIE_NAME = "lh_client";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days
const RANDOM_BYTES = 16;

function signingSecret(): string {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(b64 + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function hmacKey(): Promise<CryptoKey | null> {
  const secret = signingSecret();
  if (!secret) return null;
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function sign(id: string): Promise<string> {
  const key = await hmacKey();
  if (!key) return "";
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(id));
  return `${id}.${toBase64Url(new Uint8Array(sig))}`;
}

export async function verifyClientId(cookieValue: string | undefined): Promise<string | null> {
  if (!cookieValue) return null;
  const dot = cookieValue.lastIndexOf(".");
  if (dot <= 0 || dot === cookieValue.length - 1) return null;
  const id = cookieValue.slice(0, dot);
  const sigText = cookieValue.slice(dot + 1);

  const key = await hmacKey();
  if (!key) return null;

  let signature: Uint8Array;
  try {
    signature = fromBase64Url(sigText);
  } catch {
    return null;
  }

  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    signature as unknown as BufferSource,
    new TextEncoder().encode(id)
  );
  return ok && /^[A-Za-z0-9_-]{16,64}$/.test(id) ? id : null;
}

/** Mint a fresh signed client identity (used on Edge middleware). */
export async function newClientId(): Promise<string> {
  const bytes = new Uint8Array(RANDOM_BYTES);
  crypto.getRandomValues(bytes);
  const id = toBase64Url(bytes);
  const signed = await sign(id);
  return signed || id;
}

export function clientCookieString(id: string): string {
  const secure = process.env.NODE_ENV === "production";
  return `${COOKIE_NAME}=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SECONDS}${secure ? "; Secure" : ""}`;
}

export const CLIENT_COOKIE_NAME = COOKIE_NAME;