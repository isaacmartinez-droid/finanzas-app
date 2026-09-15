import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
}

const itemClass =
  "flex min-h-[70px] min-w-0 flex-col items-center justify-center gap-1.5 rounded-[14px] border border-line bg-surface px-1 text-[13px] font-semibold text-ink shadow-card transition-colors duration-150 hover:border-line-strong hover:bg-subtle active:bg-neutral-bg";

/** 4 columns, 8px gap, 68–72px tall (spec §28). */
export function QuickActions({ actions, className }: { actions: QuickAction[]; className?: string }) {
  return (
    <nav aria-label="Acciones rápidas" className={className}>
      <ul className="grid grid-cols-4 gap-2">
        {actions.map(({ id, label, icon: Icon, href, onClick }) => {
          const content = (
            <>
              <span className="grid size-8 place-items-center rounded-full bg-primary-soft text-primary">
                <Icon aria-hidden size={18} strokeWidth={1.8} />
              </span>
              <span className="max-w-full truncate">{label}</span>
            </>
          );
          return (
            <li key={id} className="min-w-0">
              {href ? (
                <Link href={href} className={cn(itemClass, "w-full")}>
                  {content}
                </Link>
              ) : (
                <button type="button" onClick={onClick} className={cn(itemClass, "w-full")}>
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
