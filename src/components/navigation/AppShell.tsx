"use client";

import { AccountMenuSheet } from "@/features/settings/AccountMenuSheet";
import { QuickAddSheet } from "@/features/quick-add/QuickAddSheet";
import { TransactionFormSheet } from "@/features/quick-add/TransactionFormSheet";
import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";
import { NavRail, Sidebar } from "./SideNavigation";

/**
 * <768   Header · scrollable content · bottom nav
 * 768+   72px rail · header · content
 * 1024+  220/72px sidebar · header · content (max 1360px, centered)
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-[80] rounded-[10px] bg-primary-solid px-4 py-3 font-semibold text-on-primary focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Saltar al contenido
      </a>
      <div className="flex min-h-dvh w-full">
        <Sidebar />
        <NavRail />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader />
          <main
            id="main"
            tabIndex={-1}
            className="pb-safe-nav mx-auto w-full min-w-0 max-w-[1360px] flex-1 px-[var(--page-x)] pt-2 outline-none md:pb-10 md:pt-6"
          >
            {children}
          </main>
        </div>
      </div>
      <BottomNav />
      <QuickAddSheet />
      <TransactionFormSheet />
      <AccountMenuSheet />
    </>
  );
}
