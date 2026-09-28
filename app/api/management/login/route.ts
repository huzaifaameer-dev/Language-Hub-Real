import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { setStaffCookie } from "@/lib/admin-session";
import { rateLimitDb, clientKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const Body = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

const DUMMY_HASH = "$2b$12$CbtOjVWLrcVQn7uzBxYyBOMOo2g.2rW0baLiNMjJZXdneII6wlz.i";

/** Staff login for /management. Issues a separate staff cookie (never a
 *  NextAuth session), so the public navbar stays clean — like the admin panel. */
export async function POST(request: Request) {
  const rl = await rateLimitDb(await clientKey(request, "staff-login"), 10, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ message: "Too many attempts. Try again shortly." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
  }

  const db = await getDb();
  const user = await db.collection("users").findOne({ email: parsed.data.email.toLowerCase() });
  const role = (user?.role as string | undefined) ?? "";
  const isStaff = role === "ADMIN" || role === "TEACHER";

  if (!user?.password || !isStaff) {
    await bcrypt.compare(parsed.data.password, DUMMY_HASH);
    return NextResponse.json({ message: "Invalid email or password. Staff accounts only." }, { status: 401 });
  }

  const ok = await bcrypt.compare(parsed.data.password, user.password as string);
  if (!ok) {
    return NextResponse.json({ message: "Invalid email or password. Staff accounts only." }, { status: 401 });
  }

  return setStaffCookie(
    NextResponse.json({ ok: true, role }),
    (user.email as string).toLowerCase()
  );
}