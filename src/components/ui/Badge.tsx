import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Tone } from "@/lib/status";

const tones: Record<Tone, string> = {
  neutral: "bg-neutral-bg text-neutral",
  positive: "bg-positive-bg text-positive",
  warning: "bg-warning-bg text-warning",
  risk: "bg-risk-bg text-risk",
  deficit: "bg-deficit-bg text-deficit",
  saving: "bg-saving-bg text-saving",
  info: "bg-info-bg text-info",
  outline: "border border-line-strong text-ink-2",
};

export interface BadgeProps {
  tone?: Tone;
  dot?: boolean;
  icon?: LucideIcon;
  size?: "sm" | "md";
  className?: string;
  children: React.ReactNode;
}

/** Status pill. Always pairs color with text (and optionally a dot/icon) — never color alone. */
export function Badge({ tone = "neutral", dot, icon: Icon, size = "sm", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full font-[650] leading-none",
        size === "sm" ? "h-[22px] px-2 text-[11px]" : "h-[26px] px-2.5 text-[12px]",
        tones[tone],
        className,
      )}
    >
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {Icon && <Icon aria-hidden size={12} strokeWidth={2} />}
      {children}
    </span>
  );
}
