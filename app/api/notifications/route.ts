import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { auth } from "@/auth";
import { getNotificationsCollection } from "@/lib/db";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }
  if (!ObjectId.isValid(session.user.id)) {
    return NextResponse.json({ message: "Invalid session." }, { status: 400 });
  }

  const notifications = await getNotificationsCollection();
  const docs = await notifications
    .find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .limit(60)
    .toArray();

  const list = docs.map((n) => ({
    id: String(n._id),
    kind: n.kind,
    title: n.title,
    message: n.message,
    href: n.href,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  }));

  return NextResponse.json({
    notifications: list,
    unread: docs.filter((n) => !n.read).length,
  });
}

const ReadSchema = z.object({
  id: z.string().optional(),
});

/** Marks one notification read ({id}) or all read when no id is given. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }
  if (!ObjectId.isValid(session.user.id)) {
    return NextResponse.json({ message: "Invalid session." }, { status: 400 });
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

  const notifications = await getNotificationsCollection();
  const { id } = parsed.data;

  if (id) {
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid id." }, { status: 400 });
    }
    await notifications.updateOne(
      { _id: new ObjectId(id), userId: session.user.id },
      { $set: { read: true } }
    );
  } else {
    await notifications.updateMany(
      { userId: session.user.id, read: false },
      { $set: { read: true } }
    );
  }

  return NextResponse.json({ ok: true });
}