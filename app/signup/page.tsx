import { Suspense } from "react";
import { AuthFlow } from "@/components/auth/AuthFlow";

export const metadata = {
  title: "Sign Up · Language Hub",
  description: "Create your Language Hub account and start learning today.",
};

export default function SignupPage() {
  return (
    <Suspense fallback={<div aria-hidden className="min-h-screen bg-[#eaf7f1]" />}>
      <AuthFlow initialMode="signup" />
    </Suspense>
  );
}
