import { getDb, type NotificationDoc } from "@/lib/db";
import { publishEvent } from "@/lib/realtime";

/**
 * Inserts a notification for a user and pokes their live stream so an open
 * dashboard (or admin panel) refetches instantly.
 */
export async function notify(
  userId: string,
  input: { kind: string; title: string; message?: string | null; href?: string | null }
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