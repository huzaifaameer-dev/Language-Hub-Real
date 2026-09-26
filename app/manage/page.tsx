import { redirect } from "next/navigation";

import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function ManagePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = session.user.role;

  // /manage is the student portal. Staff go to the dedicated teacher portal.
  if (role === "ADMIN" || role === "TEACHER") redirect("/management");

  const { StudentPortal } = await import("@/components/manage/StudentPortal");
  return <StudentPortal userId={session.user.id} name={session.user.name ?? "Student"} />;
}