"use client";

import { SessionProvider } from "next-auth/react";
import { StaleSessionGuard } from "@/components/auth/StaleSessionGuard";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <StaleSessionGuard />
      {children}
    </SessionProvider>
  );
}