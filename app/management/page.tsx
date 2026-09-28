import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getStaffSession } from "@/lib/admin-session";
import { getUsersCollection } from "@/lib/db";
import { ManageLogin } from "@/components/manage/ManageLogin";
import { ManagementApp } from "@/components/manage/ManagementApp";

export const metadata: Metadata = {
  title: "Management · Language Hub",
  description: "Teacher & admin management portal — groups, assignments, submissions, attendance, materials and WhatsApp.",
};

export const dynamic = "force-dynamic";

/**
 * Dedicated teacher/admission portal. Students are served by /manage; staff
 * (ADMIN + TEACHER) land here and get the full management dashboard. Access is
 * granted via the separate staff cookie (like the admin panel), so the public
 * navbar never shows an admin identity after using this portal.
 */
export default async function ManagementPage() {
  const staff = await getStaffSession();
  if (staff?.email) {
    const users = await getUsersCollection();
    const user = await users.findOne(
      { email: staff.email.toLowerCase() },
      { projection: { role: 1 } }
    );
    const role = (user?.role as string | undefined) ?? "";
    if (role === "ADMIN" || role === "TEACHER") {
      return <ManagementApp />;
    }
  }

  // Not staff-verified: students go to their dashboard, everyone else sees
  // the staff login (which issues the separate staff cookie only).
  const session = await auth();
  if (
    session?.user?.role &&
    session.user.role !== "ADMIN" &&
    session.user.role !== "TEACHER"
  ) {
    redirect("/dashboard");
  }

  return <ManageLogin target="/management" />;
}