import { createHash, randomBytes } from "node:crypto";

/** Hash a raw token before storing it, so a DB leak never exposes usable tokens. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Generate a cryptographically secure URL-safe token. */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}