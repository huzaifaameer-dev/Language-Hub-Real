export const dynamic = "force-dynamic";

import { requireAdmin } from "@/lib/admin-guard";
import { AdminGate } from "@/components/admin-panel/AdminGate";
import { AdminPanel } from "@/components/admin-panel/AdminPanel";
import type { AdminCounts } from "@/components/admin-panel/types";

/**
 * The admin panel shell is deliberately free of database work — it only checks
 * the admin token and streams the UI instantly. Every tab (registrations,
 * students, team, testimonials, …) fetches its own data client-side, so a slow
 * or cold database can never stall the first paint.
 */
const EMPTY_COUNTS: AdminCounts = {
  users: 0,
  courses: 0,
  notifications: 0,
  regTotal: 0,
  regNew: 0,
  regContacted: 0,
  regEnrolled: 0,
};

export default async function AdminPanelPage() {
  const admin = await requireAdmin();
  if (!admin) {
    return <AdminGate />;
  }

  return <AdminPanel adminEmail={admin.email ?? ""} counts={EMPTY_COUNTS} registrations={[]} users={[]} />;
}