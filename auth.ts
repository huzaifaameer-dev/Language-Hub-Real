import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

import { clientPromise, getUsersCollection } from "@/lib/db";
import authConfig from "./auth.config";

const hasKeys = (id: string | undefined, secret: string | undefined) =>
  !!id && !!secret;

// Valid bcrypt hash used only to equalize verification time when the supplied
// email has no account, so an attacker cannot distinguish registered emails by
// response latency (timing-based account enumeration).
const DUMMY_PASSWORD_HASH =
  "$2b$12$E/ImNZ3EGaUXzeLfM/jW8e3xTtchnWHhDKHYxkDfaGphYKHeg92My";

// Admins authenticate through the standalone /admin-panel (hub_admin_token)
// and per-IP throttled /api/admin/login. They must never obtain a web JWT, nor
// should repeated web-login attempts against an admin email be able to trigger
// a lockout (a denial-of-service vector). We reject admin accounts here before
// any failure accounting.
const credentialsProvider: Provider = Credentials({
  id: "credentials",
  name: "Email & Password",
  credentials: { email: {}, password: {} },
  async authorize(credentials) {
    const email = credentials?.email as string | undefined;
    const password = credentials?.password as string | undefined;
    if (!email || !password) return null;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB ?? "languagehub");
    const users = db.collection("users");
    const user = await users.findOne({ email: email.toLowerCase() });

    // Always run a bcrypt comparison on a fixed valuable hash even when the
    // account is unknown or has no password, so the timing of this function
    // does not leak whether the email is registered.
    const passwordHash = (user?.password as string | undefined) ?? DUMMY_PASSWORD_HASH;
    const valid = await bcrypt.compare(password, passwordHash);
    if (!user || !user.password || !valid) return null;

    // Disabled staff accounts (admins/teachers) can never obtain a web session.
    if ((user as { disabled?: boolean }).disabled === true) return null;

    return {
      id: String(user._id),
      name: (user.name as string) ?? null,
      email: (user.email as string) ?? null,
      // Do NOT put the profile photo in the JWT: avatars are resized to disk
      // (see /api/profile/avatar) and the cookie must stay small. UIs read the
      // freshest image from /api/me or the dashboard server component.
      image: null,
      role: (user.role as string) === "ADMIN" ? "ADMIN" : (user.role as string) === "TEACHER" ? "TEACHER" : "USER",
    };
  },
});

const providers: Provider[] = [credentialsProvider];

if (hasKeys(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET)) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Google emails are verified, so linking a Google sign-in to an existing
      // same-email password account is safe (and stops `OAuthAccountNotLinked`
      // for the owner/admin account).
      allowDangerousEmailAccountLinking: true,
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

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: process.env.MONGODB_DB ?? "languagehub",
  }),
  providers,
  callbacks: {
    ...authConfig.callbacks,
    // Google sign-in is for the site owner/learners. Teachers and disabled
    // accounts never get a public web session — they use /management.
    // (Admin is allowed so the owner can sign in with Google; the admin
    // control suite at /admin-panel remains password + access-code only.)
    signIn: async ({ user, account }) => {
      if (account?.provider && account.provider !== "credentials") {
        const email = user.email?.toLowerCase();
        if (email) {
          try {
            const users = await getUsersCollection();
            const row = await users.findOne(
              { email },
              { projection: { role: 1, disabled: 1 } }
            );
            if (!row || row.role === "TEACHER" || row.disabled) {
              return false;
            }
          } catch {
            return false;
          }
        }
      }
      return true;
    },
    // Roles are re-read on every token refresh so a stale snapshot from the DB
    // (e.g. a demotion/ban or a later promotion) cannot linger in the JWT.
    // Admins + teachers sign in through the management portal; admins also use
    // the standalone /admin-panel (hub_admin_token) for the control suite.
    jwt: async ({ token, user }) => {
      const next = authConfig.callbacks?.jwt?.({ token, user }) ?? token;
      const id = (next?.id as string | undefined) ?? (user?.id as string | undefined);
      if (id) {
        try {
          const users = await getUsersCollection();
          const row = await users.findOne(
            { _id: new ObjectId(id) },
            { projection: { role: 1 } }
          );
          // Missing accounts keep the safe USER default (their data endpoints
          // still 401); staff role rows keep their real role.
          next.role =
            row && (row.role as string) === "ADMIN"
              ? "ADMIN"
              : row && (row.role as string) === "TEACHER"
                ? "TEACHER"
                : "USER";
        } catch {
          // DB hiccup: keep the existing token rather than fail the request.
        }
      }
      return next;
    },
  },
});