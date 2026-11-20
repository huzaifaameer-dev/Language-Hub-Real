import { Suspense } from "react";
import { AuthFlow } from "@/components/auth/AuthFlow";

export const metadata = {
  title: "Sign In · Language Hub",
  description: "Sign in to continue your learning journey with Language Hub.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div aria-hidden className="min-h-screen bg-[#eaf7f1]" />}>
      <AuthFlow initialMode="signin" />
    </Suspense>
  );
}
