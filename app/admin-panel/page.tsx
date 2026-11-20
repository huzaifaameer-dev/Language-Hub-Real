import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { getAdminSession } from "@/lib/admin-session";
import { requireAdmin } from "@/lib/admin-guard";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminConsole } from "@/components/admin/AdminConsole";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * The control suite entry point.
 *
 * With a valid signed `hub_admin_token` cookie and a live ADMIN row in
 * PostgreSQL, renders the console. Otherwise renders the standalone sign-in
 * screen — no learner session is ever required to reach admin login.
 */
export default async function AdminPanelPage() {
  const token = await getAdminSession();

  if (!token?.email) {
    // Peek at whether ADMIN_ACCESS_CODE is configured so the client can show
    // the second-factor field conditionally (no secret value leaks).
    const requiresCode = Boolean(
      (process.env.ADMIN_ACCESS_CODE ?? "").trim()
    );
    return <AdminLogin accessCodeRequired={requiresCode} />;
  }

  const admin = await requireAdmin();
  if (!admin) {
    // Token was valid but the account is gone/demoted — invalidate the cookie.
    const cookieStore = await cookies();
    cookieStore.delete("hub_admin_token");
    redirect("/admin-panel");
  }

  return <AdminConsole admin={{ id: admin.id, email: admin.email ?? null, name: admin.name, role: "ADMIN" }} />;
}
