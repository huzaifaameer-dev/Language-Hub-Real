import { getAdminSession } from "@/lib/admin-session";
import { findUserByEmail } from "@/lib/server/users";

export interface AdminSession {
  id: string;
  email?: string | null;
  name: string;
}

/**
 * Verifies the request carries a valid standalone admin token (separate from
 * the public NextAuth session) AND that the account still exists in
 * PostgreSQL with the ADMIN role and is not disabled.
 *
 * Called by every admin API route and by the admin panel's server components,
 * so a revoked or demoted operator loses access on their very next request.
 */
export async function requireAdmin(): Promise<AdminSession | null> {
  const token = await getAdminSession();
  if (!token?.email) return null;

  const user = await findUserByEmail(token.email);
  if (!user || user.role !== "ADMIN" || user.disabled) return null;

  // Session epoch: changing the admin password (or disabling the account)
  // bumps users.token_version, which invalidates every cookie minted earlier.
  if (Number(user.token_version ?? 0) !== Number(token.tv ?? 0)) return null;

  return { id: user.id, email: user.email, name: user.name };
}

/** UUID-shaped id check (ids are application-generated v4 UUIDs). */
export function isValidId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
