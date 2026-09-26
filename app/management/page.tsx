import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ManageLogin } from "@/components/manage/ManageLogin";
import { ManagementApp } from "@/components/manage/ManagementApp";

export const metadata: Metadata = {
  title: "Management · Language Hub",
  description: "Teacher & admin management portal — groups, assignments, submissions, attendance, materials and WhatsApp.",
};

export const dynamic = "force-dynamic";

/**
 * Dedicated teacher/admission portal. Students are served by /manage; staff
 * (ADMIN + TEACHER) land here and get the full management dashboard. Anyone
 * without a session sees the staff login rather than the generic student one.
 */
export default async function ManagementPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return <ManageLogin target="/management" />;
  }

  const role = session.user.role;
  // Students have no business in the teacher portal — send them home.
  if (role !== "ADMIN" && role !== "TEACHER") redirect("/dashboard");

  return <ManagementApp />;
}