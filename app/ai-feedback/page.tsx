import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { FeedbackStudio } from "@/components/ai/FeedbackStudio";

export const metadata: Metadata = {
  title: "AI Feedback Studio · Language Hub",
};

export default async function AiFeedbackPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin-panel");

  return (
    <div className="relative overflow-hidden bg-[#eef1f9] text-ink">
      <div aria-hidden className="orb left-[-8%] top-[-6%] h-[42vh] w-[42vh] bg-fuchsia-400/25" />
      <div aria-hidden className="orb right-[-10%] top-[10%] h-[38vh] w-[38vh] bg-indigo-400/30" style={{ animationDelay: "-6s" }} />
      <div aria-hidden className="orb bottom-[-14%] left-[14%] h-[44vh] w-[44vh] bg-sky-400/20" style={{ animationDelay: "-12s" }} />
      <div className="relative z-10">
        <FeedbackStudio />
      </div>
    </div>
  );
}