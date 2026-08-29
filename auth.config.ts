import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config used by proxy.ts. No database / adapter here so
 * route checks stay fast. The full config in auth.ts reuses these callbacks.
 */
export default {
  session: { strategy: "jwt" },
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