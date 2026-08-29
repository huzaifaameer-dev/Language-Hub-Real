import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import authConfig from "@/auth.config";

// Edge-safe auth wrapper: decodes the JWT session cookie only.
const { auth } = NextAuth({ ...authConfig, trustHost: true });

export default auth((req) => {
  const session = req.auth;
  const path = req.nextUrl.pathname;

  const isAuthed = !!session?.user;

  // Open auth pages only for guests.
  if (path.startsWith("/login") || path.startsWith("/signup")) {
    if (isAuthed) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
    return NextResponse.next();
  }

  // Dashboard is for authenticated users (web clients only).
  // The admin panel is fully decoupled: it has its own session cookie and is
  // open at the edge — the panel page decides gate vs. dashboard server-side.
  if (path.startsWith("/dashboard")) {
    if (!isAuthed) {
      return NextResponse.redirect(new URL("/login", req.nextUrl));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/login/:path*",
    "/signup/:path*",
    "/dashboard/:path*",
  ],
};