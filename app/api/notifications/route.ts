import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import {
  listNotifications,
  markNotificationsRead,
} from "@/lib/server/learner";
import { isValidId } from "@/lib/admin-guard";
import { q } from "@/lib/server/pg";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  const rows = await listNotifications(session.user.id, 60);
  const notifications = rows.map((n) => ({
    id: n.id,
    kind: n.kind,
    title: n.title,
    message: n.body,
    href: n.link,
    read: Boolean(n.read),
    createdAt: new Date(n.created_at).toISOString(),
  }));

  return NextResponse.json({
    notifications,
    unread: notifications.filter((n) => !n.read).length,
  });
}

const ReadSchema = z.object({ id: z.string().optional() });

/** Marks one notification read ({id}) or everything read when no id is sent. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // empty body => mark all read
  }

  const parsed = ReadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const { id } = parsed.data;
  if (id) {
    if (!isValidId(id)) {
      return NextResponse.json({ message: "Invalid id." }, { status: 400 });
    }
    await q(
      "UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2",
      [id, session.user.id]
    );
  } else {
    await markNotificationsRead(session.user.id);
  }

  return NextResponse.json({ ok: true });
}
