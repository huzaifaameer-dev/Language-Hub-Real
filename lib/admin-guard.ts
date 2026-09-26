import { ObjectId } from "mongodb";

import { getAdminSession } from "@/lib/admin-session";
import { getDb } from "@/lib/db";

export interface AdminSession {
  id: string;
  email?: string | null;
}

/**
 * Verifies the request carries a valid standalone admin token (separate from
 * the client NextAuth session) AND that the admin still exists in the DB.
 * Returns null when unauthorized.
 */
export async function requireAdmin(): Promise<AdminSession | null> {
  const token = await getAdminSession();
  if (!token?.email) return null;

  const db = await getDb();
  const user = await db
    .collection("users")
    .findOne(
      { email: token.email },
      { projection: { role: 1, email: 1, disabled: 1 } }
    );

  if (!user || (user.role as string) !== "ADMIN") return null;
  // Disabled staff accounts are rejected even with a valid token.
  if ((user as unknown as { disabled?: boolean }).disabled === true) return null;

  return { id: String(user._id), email: user.email as string | null };
}

export function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id);
}