"use client";

import { SessionProvider } from "next-auth/react";
import { StaleSessionGuard } from "@/components/auth/StaleSessionGuard";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={30}>
      <StaleSessionGuard />
      {children}
    </SessionProvider>
  );
}