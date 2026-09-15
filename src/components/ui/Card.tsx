import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

type CardPadding = "none" | "normal" | "hero";

const paddings: Record<CardPadding, string> = {
  none: "",
  normal: "p-3.5",
  hero: "p-4",
};

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  as?: "div" | "section" | "article" | "aside";
  padding?: CardPadding;
}

/** White surface, 1px border, 16px radius, whisper shadow (spec §10). */
export function Card({ as: Tag = "section", padding = "normal", className, ...props }: CardProps) {
  return (
    <Tag className={cn("min-w-0 rounded-card border border-line bg-surface shadow-card", paddings[padding], className)} {...props} />
  );
}

export interface SectionHeaderProps {
  title: string;
  id?: string;
  eyebrow?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  className?: string;
  as?: "h2" | "h3";
}

export function SectionHeader({ title, id, eyebrow, action, className, as: Heading = "h2" }: SectionHeaderProps) {
  const actionClass =
    "-my-2 -mr-2 inline-flex min-h-11 items-center gap-0.5 rounded-lg px-2 text-[13px] font-semibold text-primary hover:bg-primary-soft";
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-2">{eyebrow}</p>}
        <Heading id={id} className="truncate text-[16px] font-bold leading-6 text-ink">
          {title}
        </Heading>
      </div>
      {action &&
        (action.href ? (
          <Link href={action.href} className={actionClass}>
            {action.label}
            <ChevronRight aria-hidden size={16} strokeWidth={1.8} />
          </Link>
        ) : (
          <button type="button" onClick={action.onClick} className={actionClass}>
            {action.label}
            <ChevronRight aria-hidden size={16} strokeWidth={1.8} />
          </button>
        ))}
    </div>
  );
}

/** Small uppercase label used at the top of key cards ("PUEDES GASTAR HOY"). */
export function Eyebrow({
  children,
  className,
  id,
  as: Tag = "p",
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  as?: "p" | "h2" | "h3" | "span";
}) {
  return (
    <Tag id={id} className={cn("text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-2", className)}>
      {children}
    </Tag>
  );
}
