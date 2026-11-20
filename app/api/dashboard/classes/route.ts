import { NextResponse } from "next/server";

import { currentUser } from "@/lib/server/session";
import { listUpcomingClasses } from "@/lib/server/learner";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }
  return NextResponse.json({ classes: await listUpcomingClasses(user.id) });
}
