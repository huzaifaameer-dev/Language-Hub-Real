import { getDb, type NotificationDoc } from "@/lib/db";
import { publishEvent } from "@/lib/realtime";

export type NotifyInput = {
  kind: string;
  title: string;
  message?: string | null;
  href?: string | null;
};

/**
 * Inserts a notification for a user and pokes their live stream so an open
 * dashboard (or admin panel) refetches instantly.
 */
export async function notify(
  userId: string,
  input: NotifyInput
): Promise<void> {
  const db = await getDb();
  await db.collection<NotificationDoc>("notifications").insertOne({
    userId,
    kind: input.kind,
    title: input.title,
    message: input.message ?? null,
    href: input.href ?? null,
    read: false,
    createdAt: new Date(),
  });
  publishEvent({ table: "notifications", userId, at: Date.now() });
}

/** Notifies every ADMIN account (e.g. when a user submits an application). */
export async function notifyAdmins(input: NotifyInput): Promise<void> {
  const db = await getDb();
  const admins = await db
    .collection("users")
    .find({ role: "ADMIN" }, { projection: { _id: 1 } })
    .toArray();
  await Promise.all(admins.map((a) => notify(String(a._id), input)));
}