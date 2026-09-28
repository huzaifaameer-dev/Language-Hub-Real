import { NextResponse } from "next/server";

import { clearStaffCookie } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

/** Clears the separate staff cookie on sign-out. */
export async function POST() {
  return clearStaffCookie(NextResponse.json({ ok: true }));
}