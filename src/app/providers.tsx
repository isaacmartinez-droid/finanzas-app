"use client";

import { FinanceProvider } from "@/hooks/use-finance";
import { PreferencesProvider } from "@/hooks/use-preferences";
import { ShellProvider } from "@/hooks/use-shell";
import { ToastProvider } from "@/hooks/use-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PreferencesProvider>
      <FinanceProvider>
        <ToastProvider>
          <ShellProvider>{children}</ShellProvider>
        </ToastProvider>
      </FinanceProvider>
    </PreferencesProvider>
  );
}
