import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { StudentPortal } from "@/components/manage/StudentPortal";

export const metadata: Metadata = {
  title: "My Learning · Language Hub",
  description: "Your assignments, materials and attendance — Language Hub.",
};

export const dynamic = "force-dynamic";

export default async function MyLearningPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin-panel");
  if (session.user.role === "TEACHER") redirect("/management");

  return <StudentPortal userId={session.user.id} name={session.user.name ?? "Student"} />;
}