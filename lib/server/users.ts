/**
 * User, referral and auth-token repository.
 *
 * All functions speak plain SQL through the typed layer — no ORM magic. Rows
 * are mapped to camelCase domain objects so route handlers and server
 * components never touch snake_case columns.
 */

import { one, q, tx } from "./pg";
import { newId, newRef, sha256 } from "./id";

export type Role = "USER" | "ADMIN" | "TEACHER";

export interface DbUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  password_hash: string | null;
  role: Role;
  image: string | null;
  bio: string | null;
  email_verified: boolean;
  disabled: boolean;
  /** Incremented on password change / disable to revoke every older session. */
  token_version: number;
  referral_code: string | null;
  referred_by: string | null;
  last_login_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  image: string | null;
  bio: string | null;
  emailVerified: boolean;
  disabled: boolean;
  referralCode: string | null;
  createdAt: string;
}

export function toSafeUser(row: DbUser): SafeUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    image: row.image,
    bio: row.bio,
    emailVerified: Boolean(row.email_verified),
    disabled: Boolean(row.disabled),
    referralCode: row.referral_code,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  return one<DbUser>("SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1", [
    email.trim(),
  ]);
}

export async function findUserById(id: string): Promise<DbUser | null> {
  return one<DbUser>("SELECT * FROM users WHERE id = $1 LIMIT 1", [id]);
}

export async function createUser(input: {
  name: string;
  email: string;
  phone?: string | null;
  passwordHash: string;
  role?: Role;
  referredBy?: string | null;
}): Promise<DbUser> {
  const email = input.email.trim().toLowerCase();
  const id = newId();
  const referralCode = newRef("LH");

  const row = await one<DbUser>(
    `INSERT INTO users
       (id, name, email, phone, password_hash, role, referral_code, referred_by, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
     RETURNING *`,
    [
      id,
      input.name.trim(),
      email,
      input.phone?.trim() || null,
      input.passwordHash,
      input.role ?? "USER",
      referralCode,
      input.referredBy ?? null,
    ]
  );

  if (!row) throw new Error("Could not create user.");

  // Every learner gets a referral row (10% off for friends).
  await q(
    `INSERT INTO referrals (id, user_id, code, discount_percent)
     VALUES ($1,$2,$3,10)
     ON CONFLICT (user_id) DO NOTHING`,
    [newId(), row.id, referralCode]
  );

  return row;
}

export async function touchLogin(userId: string): Promise<void> {
  await q("UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1", [userId]);
}

export async function updatePassword(userId: string, passwordHash: string): Promise<void> {
  // Bumping token_version revokes every JWT/admin cookie minted before this
  // change, so a hijacked session cannot survive a password reset.
  await q(
    `UPDATE users
        SET password_hash = $1,
            token_version = token_version + 1,
            updated_at = NOW()
      WHERE id = $2`,
    [passwordHash, userId]
  );
}

export async function updateProfile(
  userId: string,
  patch: { name?: string; phone?: string | null; bio?: string | null; image?: string | null }
): Promise<SafeUser> {
  const row = await one<DbUser>(
    `UPDATE users SET
       name  = COALESCE($1, name),
       phone = COALESCE($2, phone),
       bio   = COALESCE($3, bio),
       image = COALESCE($4, image),
       updated_at = NOW()
     WHERE id = $5
     RETURNING *`,
    [
      patch.name?.trim() || null,
      patch.phone === undefined ? null : patch.phone,
      patch.bio === undefined ? null : patch.bio,
      patch.image === undefined ? null : patch.image,
      userId,
    ]
  );
  if (!row) throw new Error("User not found.");
  return toSafeUser(row);
}

export async function markEmailVerified(userId: string): Promise<void> {
  await q(
    "UPDATE users SET email_verified = TRUE, updated_at = NOW() WHERE id = $1",
    [userId]
  );
}

/* ───────────────────────────── auth tokens ────────────────────────────── */

export async function issueToken(
  userId: string,
  kind: "VERIFY_EMAIL" | "RESET_PASSWORD",
  ttlMinutes: number
): Promise<string> {
  const raw = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
  const hash = sha256(raw);
  const expires = new Date(Date.now() + ttlMinutes * 60_000).toISOString();
  await q(
    `INSERT INTO auth_tokens (id, user_id, kind, token_hash, expires_at)
     VALUES ($1,$2,$3,$4,$5)`,
    [newId(), userId, kind, hash, expires]
  );
  return raw;
}

export async function consumeToken(
  raw: string,
  kind: "VERIFY_EMAIL" | "RESET_PASSWORD"
): Promise<string | null> {
  const hash = sha256(raw);
  return tx(async (client) => {
    const found = await client.query<{ id: string; user_id: string }>(
      `SELECT id, user_id FROM auth_tokens
        WHERE token_hash = $1 AND kind = $2 AND used_at IS NULL AND expires_at > NOW()
        LIMIT 1
        FOR UPDATE`,
      [hash, kind]
    );
    const row = found.rows[0];
    if (!row) return null;
    await client.query("UPDATE auth_tokens SET used_at = NOW() WHERE id = $1", [row.id]);
    return row.user_id;
  });
}

export async function purgeExpiredTokens(): Promise<void> {
  await q("DELETE FROM auth_tokens WHERE expires_at < NOW() - INTERVAL '1 day'");
}

/* ───────────────────────────── referrals ──────────────────────────────── */

export interface ReferralRow {
  id: string;
  user_id: string;
  code: string;
  discount_percent: number;
  redemptions: number;
  created_at: string | Date;
}

export async function getReferralForUser(userId: string): Promise<ReferralRow | null> {
  const existing = await one<ReferralRow>(
    "SELECT * FROM referrals WHERE user_id = $1 LIMIT 1",
    [userId]
  );
  if (existing) return existing;

  const user = await findUserById(userId);
  if (!user) return null;
  const code = user.referral_code || newRef("LH");
  await q(
    `INSERT INTO referrals (id, user_id, code, discount_percent)
     VALUES ($1,$2,$3,10)
     ON CONFLICT (user_id) DO NOTHING`,
    [newId(), userId, code]
  );
  return one<ReferralRow>("SELECT * FROM referrals WHERE user_id = $1 LIMIT 1", [userId]);
}

export async function referralByCode(code: string): Promise<ReferralRow | null> {
  return one<ReferralRow>(
    "SELECT * FROM referrals WHERE UPPER(code) = UPPER($1) LIMIT 1",
    [code.trim()]
  );
}

export async function redeemReferral(code: string, userId: string): Promise<boolean> {
  const ref = await referralByCode(code);
  if (!ref || ref.user_id === userId) return false;
  return tx(async (client) => {
    const already = await client.query<{ id: string }>(
      "SELECT id FROM referral_redemptions WHERE referral_id = $1 AND used_by_user_id = $2 LIMIT 1",
      [ref.id, userId]
    );
    if (already.rows[0]) return false;
    await client.query(
      "INSERT INTO referral_redemptions (id, referral_id, used_by_user_id) VALUES ($1,$2,$3)",
      [newId(), ref.id, userId]
    );
    await client.query(
      "UPDATE referrals SET redemptions = redemptions + 1 WHERE id = $1",
      [ref.id]
    );
    return true;
  });
}

/* ───────────────────────────── admin user ops ─────────────────────────── */

export interface UserListRow extends DbUser {
  registrations: number;
  enrollments: number;
}

export async function listUsers(input: {
  search?: string;
  role?: Role | "ALL";
  limit?: number;
  offset?: number;
}): Promise<{ rows: UserListRow[]; total: number }> {
  const search = (input.search ?? "").trim();
  const role = input.role && input.role !== "ALL" ? input.role : null;
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 100);
  const offset = Math.max(input.offset ?? 0, 0);
  const like = `%${search.toLowerCase()}%`;

  const where = `
    WHERE ($1 = '' OR LOWER(name) LIKE $1 OR LOWER(email) LIKE $1)
      AND ($2::text IS NULL OR role = $2::text)
  `;
  const params = [like, role];

  const rows = await q<UserListRow>(
    `SELECT u.*,
            (SELECT COUNT(*)::INT FROM registrations r WHERE r.user_id = u.id) AS registrations,
            (SELECT COUNT(*)::INT FROM enrollments e WHERE e.user_id = u.id) AS enrollments
       FROM users u
       ${where}
       ORDER BY u.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
    params
  );
  const total = await one<{ n: number }>(
    `SELECT COUNT(*)::INT AS n FROM users u ${where}`,
    params
  );
  return { rows, total: total?.n ?? 0 };
}

export async function setUserRole(userId: string, role: Role): Promise<void> {
  await q("UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2", [role, userId]);
}

export async function setUserDisabled(userId: string, disabled: boolean): Promise<void> {
  // Disabling also burns every live session, so re-enabling the account later
  // never resurrects a token an attacker may still hold.
  await q(
    `UPDATE users
        SET disabled = $1,
            token_version = token_version + CASE WHEN $1 THEN 1 ELSE 0 END,
            updated_at = NOW()
      WHERE id = $2`,
    [disabled, userId]
  );
}

export async function adminCreateUser(input: {
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: Role;
}): Promise<DbUser> {
  return createUser({ ...input, role: input.role });
}
