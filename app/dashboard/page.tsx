import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { UserDashboard } from "@/components/dashboard/UserDashboard";
import { StaleSession } from "@/components/dashboard/StaleSession";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard · Language Hub",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin-panel");

  // Source of truth for the profile photo is the DB, not the JWT (which is
  // only snapshotted at sign-in). Always pass the freshest stored image.
  let image: string | null = null;
  if (ObjectId.isValid(session.user.id)) {
    const db = await getDb();
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(session.user.id) }, { projection: { image: 1 } });
    if (!user) {
      // Stale session: the account was deleted. Sign the browser out.
      return <StaleSession />;
    }
    image = user.image ?? null;
  }

  return (
    <UserDashboard
      name={session.user.name ?? "Learner"}
      email={session.user.email ?? ""}
      image={image}
      userId={session.user.id}
    />
  );
}