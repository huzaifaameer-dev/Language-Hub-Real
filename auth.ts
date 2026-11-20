import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import authConfig from "./auth.config";
import {
  createUser,
  findUserByEmail,
  findUserById,
  touchLogin,
  updateProfile,
} from "@/lib/server/users";
import { getDb, q } from "@/lib/server/pg";

const hasKeys = (id: string | undefined, secret: string | undefined) =>
  !!id && !!secret;

// Valid bcrypt hash used only to equalize verification time when the supplied
// email has no account, so an attacker cannot distinguish registered emails by
// response latency (timing-based account enumeration).
const DUMMY_PASSWORD_HASH =
  "$2b$12$E/ImNZ3EGaUXzeLfM/jW8e3xTtchnWHhDKHYxkDfaGphYKHeg92My";

/**
 * Email + password sign-in, verified against the self-hosted PostgreSQL
 * database (bcrypt, cost 12). Admin accounts are rejected here on purpose:
 * the control suite at /admin-panel has its own password + access-code gate,
 * so a web session can never be escalated into admin access.
 */
const credentialsProvider: Provider = Credentials({
  id: "credentials",
  name: "Email & Password",
  credentials: { email: {}, password: {} },
  async authorize(credentials) {
    const email = credentials?.email as string | undefined;
    const password = credentials?.password as string | undefined;
    if (!email || !password) return null;

    // Make sure the schema/seed is up before the very first sign-in.
    await getDb();

    const user = await findUserByEmail(email);

    // Always run a bcrypt comparison on a fixed valid hash even when the
    // account is unknown or has no password (OAuth-only accounts), so the
    // timing of this function does not leak whether an email is registered.
    const passwordHash = user?.password_hash ?? DUMMY_PASSWORD_HASH;
    const valid = await bcrypt.compare(password, passwordHash);
    if (!user || !user.password_hash || !valid) return null;

    // Disabled accounts and admins can never obtain a learner web session.
    if (user.disabled || user.role === "ADMIN") return null;

    await touchLogin(user.id);

    return Object.assign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        // Never put the avatar in the JWT — the cookie must stay small. UIs read
        // the freshest image from /api/me.
        image: null,
        role: user.role,
      },
      // Session epoch carried into the JWT and compared on every request.
      { tokenVersion: Number(user.token_version ?? 0) }
    );
  },
});

const providers: Provider[] = [credentialsProvider];

if (hasKeys(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET)) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

if (hasKeys(process.env.GITHUB_CLIENT_ID, process.env.GITHUB_CLIENT_SECRET)) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    })
  );
}

if (
  hasKeys(process.env.MICROSOFT_CLIENT_ID, process.env.MICROSOFT_CLIENT_SECRET)
) {
  providers.push(
    MicrosoftEntraID({
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    })
  );
}

/**
 * OAuth sign-in: there is no adapter, so the account is provisioned in
 * PostgreSQL from the provider profile (verified email). The local row id is
 * written back onto `user` so the JWT carries our own stable identifier.
 */
async function provisionOAuthUser(profile: {
  email: string;
  name?: string | null;
  image?: string | null;
}): Promise<{
  id: string;
  role: string;
  disabled: boolean;
  tokenVersion: number;
} | null> {
  const email = profile.email.trim().toLowerCase();
  if (!email) return null;

  const existing = await findUserByEmail(email);
  if (existing) {
    const tokenVersion = Number(existing.token_version ?? 0);
    if (existing.disabled || existing.role === "ADMIN") {
      return {
        id: existing.id,
        role: existing.role,
        disabled: existing.disabled,
        tokenVersion,
      };
    }
    if (!existing.image && profile.image) {
      await updateProfile(existing.id, { image: profile.image });
    }
    return { id: existing.id, role: existing.role, disabled: false, tokenVersion };
  }

  const created = await createUser({
    name: profile.name?.trim() || email.split("@")[0],
    email,
    // No password: this account signs in through the provider only.
    passwordHash: "",
    role: "USER",
  });
  await q(
    "UPDATE users SET image = $1, email_verified = TRUE WHERE id = $2",
    [profile.image ?? null, created.id]
  );
  return {
    id: created.id,
    role: created.role,
    disabled: false,
    tokenVersion: Number(created.token_version ?? 0),
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    signIn: async ({ user, account }) => {
      if (account?.provider && account.provider !== "credentials") {
        const email = user.email?.toLowerCase();
        if (!email) return false;
        try {
          const row = await provisionOAuthUser({
            email,
            name: user.name,
            image: user.image,
          });
          // Unknown provisioning failure, disabled or admin account: refuse.
          if (!row || row.disabled || row.role === "ADMIN") return false;
          // Carry our local identity into the JWT callback.
          user.id = row.id;
          (user as { role?: string }).role = row.role;
          (user as { tokenVersion?: number }).tokenVersion = row.tokenVersion;
          return true;
        } catch {
          return false;
        }
      }
      return true;
    },
    // Roles are re-read from PostgreSQL on every token refresh so a stale
    // snapshot (demotion, promotion or ban) cannot linger in the JWT.
    jwt: async ({ token, user }) => {
      const next = authConfig.callbacks?.jwt?.({ token, user }) ?? token;

      // A fresh sign-in stamps the current session epoch onto the token.
      if (user) {
        (next as { tv?: number }).tv = Number(
          (user as { tokenVersion?: number }).tokenVersion ?? 0
        );
      }

      const id =
        (next?.id as string | undefined) ?? (user?.id as string | undefined);

      if (id) {
        try {
          const row = await findUserById(id);
          if (row) {
            const stamped = Number((next as { tv?: number }).tv ?? 0);
            const current = Number(row.token_version ?? 0);

            if (current !== stamped) {
              // Password changed / account disabled after this token was
              // issued. Blank the identity so every API and page that trusts
              // session.user.id treats the visitor as signed out.
              next.id = "";
              next.role = "USER";
              next.disabled = true;
              (next as { revoked?: boolean }).revoked = true;
            } else if (row.disabled) {
              next.id = "";
              next.role = "USER";
              next.disabled = true;
            } else {
              next.role = row.role === "TEACHER" ? "TEACHER" : "USER";
              next.disabled = false;
              (next as { revoked?: boolean }).revoked = false;
            }
          } else {
            // Account removed: the token is worthless.
            next.id = "";
            next.role = "USER";
            next.disabled = true;
            (next as { revoked?: boolean }).revoked = true;
          }
        } catch {
          // Database hiccup: keep the existing snapshot rather than 500.
        }
      }
      return next;
    },
  },
});
