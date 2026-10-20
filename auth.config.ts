import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config used by proxy.ts. No database / adapter here so
 * route checks stay fast. The full config in auth.ts reuses these callbacks.
 */
export default {
  session: { strategy: "jwt" },
  // Auth.js v5 reads `AUTH_SECRET`; NextAuth v4 docs pointed at
  // `NEXTAUTH_SECRET`. Accept either so a deployment that still carries the v4
  // name keeps its sessions instead of failing every /api/auth/session with
  // MissingSecret.
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string }).role ?? "USER";
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        (session.user as { role?: string }).role =
          ((token.role as string | undefined) ?? "USER") as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;