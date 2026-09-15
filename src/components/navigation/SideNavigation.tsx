"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { usePreferences } from "@/hooks/use-preferences";
import { useShell } from "@/hooks/use-shell";
import { Logo } from "./Brand";
import { isActive, SIDEBAR_NAV } from "./nav-items";

/** Tablet (768–1023): 72px navigation rail (spec §71). */
export function NavRail() {
  const pathname = usePathname();
  const { openQuickAdd } = useShell();
  return (
    <aside className="sticky top-0 hidden h-dvh w-[72px] shrink-0 flex-col items-center border-r border-line bg-surface py-3 md:flex lg:hidden">
      <Link href="/" aria-label="Inicio" className="grid size-11 place-items-center rounded-[12px]">
        <Logo />
      </Link>
      <button
        type="button"
        onClick={openQuickAdd}
        aria-label="Registrar o simular"
        aria-haspopup="dialog"
        className="mt-3 grid size-12 place-items-center rounded-[14px] bg-primary-solid text-on-primary shadow-fab hover:bg-primary-solid-hover"
      >
        <Plus aria-hidden size={22} strokeWidth={2.2} />
      </button>
      <nav aria-label="Navegación principal" className="mt-4 w-full flex-1 overflow-y-auto scrollbar-none">
        <ul className="flex flex-col items-center gap-1 px-1">
          {SIDEBAR_NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href} className="w-full">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-[54px] w-full flex-col items-center justify-center gap-1 rounded-[12px] text-[11px] leading-3 transition-colors duration-150",
                    active ? "bg-primary-soft font-bold text-primary" : "font-medium text-ink-2 hover:bg-subtle hover:text-ink",
                  )}
                >
                  <Icon aria-hidden size={20} strokeWidth={active ? 2.1 : 1.8} />
                  <span className="max-w-full truncate text-[10.5px] tracking-[-0.01em]">{item.shortLabel ?? item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

/** Desktop (≥1024): 220px sidebar, collapsible to 72px (spec §72–73). */
export function Sidebar() {
  const pathname = usePathname();
  const { openQuickAdd } = useShell();
  const { sidebarCollapsed, toggleSidebar } = usePreferences();

  return (
    <aside className="sticky top-0 hidden h-dvh w-[220px] shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-200 ease-[var(--ease-standard)] lg:flex sidebar-collapsed:w-[72px]">
      <div className="flex h-16 items-center gap-2.5 px-[19px]">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 rounded-[12px]" aria-label="Inventario — Inicio">
          <Logo />
          <span className="min-w-0 sidebar-collapsed:hidden">
            <span className="block truncate text-[15px] font-bold leading-5 text-ink">Inventario</span>
            <span className="block truncate text-[12px] leading-4 text-ink-2">Finanzas personales</span>
          </span>
        </Link>
      </div>

      <div className="px-3 pt-2">
        <button
          type="button"
          onClick={openQuickAdd}
          aria-haspopup="dialog"
          title="Registrar o simular"
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-primary-solid px-3 text-[14px] font-semibold text-on-primary shadow-fab hover:bg-primary-solid-hover"
        >
          <Plus aria-hidden size={18} strokeWidth={2.2} />
          <span className="sidebar-collapsed:sr-only">Registrar</span>
        </button>
      </div>

      <nav aria-label="Navegación principal" className="mt-4 flex-1 overflow-y-auto px-3 scrollbar-none">
        <ul className="space-y-0.5">
          {SIDEBAR_NAV.map((item, i) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href} className={cn(i === 4 && "mt-3 border-t border-line pt-3")}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  title={item.label}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-[14px] transition-colors duration-150 sidebar-collapsed:justify-center sidebar-collapsed:px-0",
                    active ? "bg-primary-soft font-semibold text-primary" : "font-medium text-ink-2 hover:bg-subtle hover:text-ink",
                  )}
                >
                  <Icon aria-hidden size={18} strokeWidth={active ? 2.1 : 1.8} className="shrink-0" />
                  <span className="truncate sidebar-collapsed:sr-only">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-line p-3">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-expanded={!sidebarCollapsed}
          className="flex min-h-11 w-full items-center gap-3 rounded-[10px] px-3 text-[14px] font-medium text-ink-2 hover:bg-subtle hover:text-ink sidebar-collapsed:justify-center sidebar-collapsed:px-0"
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen aria-hidden size={18} strokeWidth={1.8} />
          ) : (
            <PanelLeftClose aria-hidden size={18} strokeWidth={1.8} />
          )}
          <span className="sidebar-collapsed:sr-only">{sidebarCollapsed ? "Expandir menú" : "Contraer menú"}</span>
        </button>
      </div>
    </aside>
  );
}
