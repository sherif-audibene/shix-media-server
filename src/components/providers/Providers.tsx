"use client";

import { MuiProvider } from "@/components/providers/MuiProvider";
import { TRPCReactProvider } from "@/trpc/react";

/** Aggregates all client-side context providers in one place. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TRPCReactProvider>
      <MuiProvider>{children}</MuiProvider>
    </TRPCReactProvider>
  );
}
