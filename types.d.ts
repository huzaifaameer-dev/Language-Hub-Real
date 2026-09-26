import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "USER" | "ADMIN" | "TEACHER";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "USER" | "ADMIN" | "TEACHER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "USER" | "ADMIN" | "TEACHER";
  }
}
