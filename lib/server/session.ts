import { auth } from "@/auth";
import { findUserById, type DbUser } from "./users";

/**
 * Resolves the signed-in learner from the JWT session and re-reads the row
 * from PostgreSQL, so a disabled or deleted account is locked out immediately
 * even if its JWT has not expired yet.
 */
export async function currentUser(): Promise<DbUser | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  const user = await findUserById(id);
  if (!user || user.disabled) return null;
  return user;
}

/** Same as `currentUser`, but also refuses the admin role (panel-only). */
export async function currentLearner(): Promise<DbUser | null> {
  const user = await currentUser();
  if (!user || user.role === "ADMIN") return null;
  return user;
}
