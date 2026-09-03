import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Returns the signed-in user's own payment records (ascending newest first). */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  const db = await getDb();
  const docs = await db
    .collection("payments")
    .find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  const list = docs.map((d) => ({
    id: String(d._id),
    enrollmentId: d.enrollmentId,
    amount: d.amount,
    currency: d.currency,
    provider: d.provider,
    status: d.status,
    createdAt: d.createdAt?.toISOString?.() ?? null,
  }));

  return NextResponse.json({ payments: list });
}
