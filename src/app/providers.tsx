"use client";

import { FinanceProvider } from "@/hooks/use-finance";
import { AuthenticatedUserProvider, type AuthenticatedUser } from "@/hooks/use-authenticated-user";
import { PreferencesProvider } from "@/hooks/use-preferences";
import { ShellProvider } from "@/hooks/use-shell";
import { ToastProvider } from "@/hooks/use-toast";

export function Providers({ children, authenticatedUser }: { children: React.ReactNode; authenticatedUser: AuthenticatedUser | null }) {
  return (
    <AuthenticatedUserProvider user={authenticatedUser}>
      <PreferencesProvider>
        <FinanceProvider>
          <ToastProvider>
            <ShellProvider>{children}</ShellProvider>
          </ToastProvider>
        </FinanceProvider>
      </PreferencesProvider>
    </AuthenticatedUserProvider>
  );
}
