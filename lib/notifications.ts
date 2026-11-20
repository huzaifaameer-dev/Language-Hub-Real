import { publishEvent } from "@/lib/realtime";
import { q } from "@/lib/server/pg";
import { newId } from "@/lib/server/id";

export type NotifyInput = {
  kind: string;
  title: string;
  message?: string | null;
  href?: string | null;
};

/**
 * Inserts a notification for a user and pokes their live stream so an open
 * dashboard refetches instantly.
 */
export async function notify(userId: string, input: NotifyInput): Promise<void> {
  await q(
    `INSERT INTO notifications (id, user_id, title, body, kind, link)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [
      newId(),
      userId,
      input.title,
      input.message ?? "",
      input.kind || "info",
      input.href ?? null,
    ]
  );
  publishEvent({ table: "notifications", userId, at: Date.now() });
}

/** Notifies every ADMIN account (e.g. when a demo class is booked). */
export async function notifyAdmins(input: NotifyInput): Promise<void> {
  const admins = await q<{ id: string }>(
    "SELECT id FROM users WHERE role = 'ADMIN' AND disabled = FALSE"
  );
  await Promise.all(admins.map((a) => notify(a.id, input)));
}

/** Email addresses of all active ADMIN accounts (for alert emails). */
export async function listAdminEmails(): Promise<string[]> {
  const admins = await q<{ email: string }>(
    "SELECT email FROM users WHERE role = 'ADMIN' AND disabled = FALSE"
  );
  return admins.map((a) => a.email.trim()).filter(Boolean);
}
