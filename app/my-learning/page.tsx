import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** The separate student portal has been merged into the main dashboard. */
export default function MyLearningPage() {
  redirect("/dashboard");
}
