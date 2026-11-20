import { NextResponse } from "next/server";
import { z } from "zod";

import { currentUser } from "@/lib/server/session";
import { getProgressForUser, toggleChapter } from "@/lib/server/learner";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }
  return NextResponse.json({ progress: await getProgressForUser(user.id) });
}

const ToggleSchema = z.object({ chapterId: z.string().min(8).max(64) });

/** Marks a syllabus chapter complete / incomplete for the signed-in learner. */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  const parsed = ToggleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const result = await toggleChapter(user.id, parsed.data.chapterId);
  return NextResponse.json({ ok: true, ...result });
}
