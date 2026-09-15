import { forwardRef } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  icon: LucideIcon;
  /** Required: icon-only controls need an accessible name. */
  label: string;
  variant?: "ghost" | "outline";
  iconSize?: number;
}

/** 44×44 touch target (spec §64). */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon: Icon, label, variant = "ghost", iconSize = 18, className, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-grid size-11 shrink-0 place-items-center rounded-full text-ink-2 transition-colors duration-150 hover:bg-neutral-bg hover:text-ink",
        variant === "outline" && "border border-line bg-surface",
        className,
      )}
      {...props}
    >
      <Icon aria-hidden size={iconSize} strokeWidth={1.8} />
    </button>
  );
});
