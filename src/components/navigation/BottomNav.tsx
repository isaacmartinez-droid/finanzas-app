"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { useShell } from "@/hooks/use-shell";
import { isActive, PRIMARY_NAV, type NavItem } from "./nav-items";

function Item({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-full min-w-0 flex-col items-center justify-center gap-1 px-0.5 text-center text-[11px] leading-[12px] transition-colors duration-150",
        active ? "font-bold text-primary" : "font-medium text-ink-2 hover:text-ink",
      )}
    >
      <Icon aria-hidden size={22} strokeWidth={active ? 2.1 : 1.8} />
      <span className="max-w-full">{item.label}</span>
    </Link>
  );
}

/**
 * Fixed bottom navigation — mobile only (spec §22–23).
 * The simulator is not a tab, so no item lights up while it's open.
 */
export function BottomNav() {
  const pathname = usePathname();
  const { openQuickAdd, quickAddOpen } = useShell();
  const [a, b, c, d] = PRIMARY_NAV;

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="mx-auto grid h-16 max-w-[560px] grid-cols-[1fr_1fr_64px_1fr_1fr]">
        <Item item={a} active={isActive(pathname, a.href)} />
        <Item item={b} active={isActive(pathname, b.href)} />
        <div className="grid place-items-center">
          <button
            type="button"
            onClick={openQuickAdd}
            aria-label="Registrar o simular"
            aria-haspopup="dialog"
            aria-expanded={quickAddOpen}
            className="grid size-[52px] place-items-center rounded-full bg-primary-solid text-on-primary shadow-fab transition-colors duration-150 hover:bg-primary-solid-hover active:bg-primary-solid-pressed"
          >
            <Plus aria-hidden size={24} strokeWidth={2.2} />
          </button>
        </div>
        <Item item={c} active={isActive(pathname, c.href)} />
        <Item item={d} active={isActive(pathname, d.href)} />
      </div>
    </nav>
  );
}
