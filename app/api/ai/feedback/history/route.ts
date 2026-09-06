import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { listFeedback } from "@/lib/ai/feedback";

export const dynamic = "force-dynamic";

/** GET — the signed-in student's past AI feedback submissions. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }
  const feedback = await listFeedback(session.user.id);
  return NextResponse.json({ feedback });
}