"use client";

import { usePathname } from "next/navigation";
import { formatWeekdayDayMonth } from "@/lib/dates";
import { useFinance } from "@/hooks/use-finance";
import { mockUser } from "@/mocks/user";
import { Logo } from "./Brand";
import { AccountButton, PrivacyToggle, ThemeToggle } from "./HeaderActions";
import { PAGE_TITLES } from "./nav-items";

/**
 * Mobile (<768): [Logo] Hola, Carlos / Página   [Eye] [Avatar] — 54px (spec §20).
 * Tablet/desktop: page title bar with date, privacy, theme and account.
 */
export function AppHeader() {
  const pathname = usePathname();
  const { state } = useFinance();
  const title = PAGE_TITLES[pathname] ?? "Inicio";

  return (
    <header className="pt-safe sticky top-0 z-30 border-b border-line/0 bg-bg/95 backdrop-blur-[6px] md:border-line/70">
      <div className="mx-auto flex h-[54px] w-full max-w-[1360px] items-center gap-2.5 px-[var(--page-x)] md:h-16">
        <Logo className="md:hidden" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] leading-4 text-ink-2 md:text-[13px]">Hola, {mockUser.firstName}</p>
          <h1 className="truncate text-[17px] font-bold leading-6 text-ink md:text-[20px] md:leading-7">{title}</h1>
        </div>
        <p className="hidden rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-medium text-ink-2 lg:block">
          {formatWeekdayDayMonth(state.today)} {state.today.slice(0, 4)}
        </p>
        <div className="-mr-1.5 flex items-center">
          <PrivacyToggle />
          <span className="hidden md:inline-flex">
            <ThemeToggle />
          </span>
          <AccountButton />
        </div>
      </div>
    </header>
  );
}
