import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import bcrypt from "bcryptjs";

import { clientPromise } from "@/lib/db";
import authConfig from "./auth.config";

const hasKeys = (id: string | undefined, secret: string | undefined) =>
  !!id && !!secret;

const credentialsProvider: Provider = Credentials({
  id: "credentials",
  name: "Email & Password",
  credentials: { email: {}, password: {}, accessCode: {} },
  async authorize(credentials) {
    const email = credentials?.email as string | undefined;
    const password = credentials?.password as string | undefined;
    const accessCode = credentials?.accessCode as string | undefined;
    if (!email || !password) return null;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB ?? "languagehub");
    const users = db.collection("users");
    const user = await users.findOne({ email: email.toLowerCase() });

    if (!user) return null;
    const passwordHash = user.password as string | undefined;
    if (!passwordHash) return null;

    const doc = user as unknown as {
      _id: import("mongodb").ObjectId;
      role?: string;
      failedAttempts?: number;
      lockUntil?: number | null;
    };
    const isAdmin = doc.role === "ADMIN";

    // Admin account: brute-force lockout + second factor (access code).
    if (isAdmin) {
      if (doc.lockUntil && doc.lockUntil > Date.now()) return null;
      if (
        !process.env.ADMIN_ACCESS_CODE ||
        accessCode !== process.env.ADMIN_ACCESS_CODE
      ) {
        await recordAdminFail(users, doc);
        return null;
      }
    }

    const valid = await bcrypt.compare(password, passwordHash);
    if (!valid) {
      if (isAdmin) await recordAdminFail(users, doc);
      return null;
    }

    if (isAdmin) {
      await users.updateOne(
        { _id: doc._id },
        { $set: { failedAttempts: 0, lockUntil: null } }
      );
    }

    const role = isAdmin ? "ADMIN" : "USER";

    return {
      id: String(user._id),
      name: (user.name as string) ?? null,
      email: (user.email as string) ?? null,
      image: (user.image as string | null) ?? null,
      role,
    };
  },
});

const MAX_ADMIN_ATTEMPTS = 5;
const ADMIN_LOCK_MS = 15 * 60 * 1000;

async function recordAdminFail(
  users: import("mongodb").Collection,
  doc: { _id: import("mongodb").ObjectId; failedAttempts?: number }
) {
  const next = (doc.failedAttempts ?? 0) + 1;
  await users.updateOne(
    { _id: doc._id },
    {
      $set: {
        failedAttempts: next,
        lockUntil: next >= MAX_ADMIN_ATTEMPTS ? Date.now() + ADMIN_LOCK_MS : null,
      },
    }
  );
}

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

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: process.env.MONGODB_DB ?? "languagehub",
  }),
  providers,
  callbacks: {
    ...authConfig.callbacks,
    // Admins use the standalone /admin-panel session (hub_admin_token),
    // NEVER a web session. Any web JWT carrying the ADMIN role is stale —
    // invalidate it so the public site can't show/link an admin account.
    jwt: async ({ token, user }) => {
      const next =
        authConfig.callbacks?.jwt?.({ token, user }) ?? token;
      if (next?.role === "ADMIN") return null;
      return next;
    },
  },
});