import Link from "next/link";
import { CircleAlert, CircleCheck, Info, ShieldAlert, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

/* ───────────────────────── Progress ───────────────────────── */

export interface ProgressProps {
  value: number;
  max: number;
  /** Optional second segment stacked after `value` (e.g. reserved but not yet transferred). */
  secondary?: number;
  label: string;
  valueText?: string;
  className?: string;
}

export function Progress({ value, max, secondary = 0, label, valueText, className }: ProgressProps) {
  const pct = (n: number) => `${Math.max(0, Math.min(100, (n / max) * 100))}%`;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
      aria-valuetext={valueText}
      className={cn("flex h-2 w-full overflow-hidden rounded-full bg-saving-bg", className)}
    >
      <div className="h-full rounded-full bg-saving transition-[width] duration-[250ms]" style={{ width: pct(value) }} />
      {secondary > 0 && (
        <div className="striped-saving -ml-1 h-full rounded-r-full pl-1" style={{ width: pct(secondary) }} />
      )}
    </div>
  );
}

/* ───────────────────────── Skeleton ───────────────────────── */

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton rounded-md", className)} />;
}

/** Wraps skeletons so assistive tech hears a single "Cargando…". */
export function LoadingRegion({ label = "Cargando…", children, className }: { label?: string; children: React.ReactNode; className?: string }) {
  return (
    <div aria-busy="true" className={className}>
      <span role="status" className="sr-only">
        {label}
      </span>
      {children}
    </div>
  );
}

/* ───────────────────────── Empty state ───────────────────────── */

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick?: () => void; href?: string };
  className?: string;
}

/** Explains what's missing and what to do next — never just "No data" (spec §67). */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center px-4 py-8 text-center", className)}>
      <span className="grid size-12 place-items-center rounded-full bg-primary-soft text-primary">
        <Icon aria-hidden size={22} strokeWidth={1.8} />
      </span>
      <p className="mt-3 text-[16px] font-bold text-ink">{title}</p>
      <p className="mt-1 max-w-[34ch] text-[14px] leading-5 text-ink-2">{description}</p>
      {action &&
        (action.href ? (
          <Link
            href={action.href}
            className="mt-4 inline-flex min-h-[46px] items-center rounded-[10px] bg-primary-solid px-4 text-[15px] font-semibold text-on-primary hover:bg-primary-solid-hover"
          >
            {action.label}
          </Link>
        ) : (
          <Button className="mt-4" onClick={action.onClick}>
            {action.label}
          </Button>
        ))}
    </div>
  );
}

/* ───────────────────────── Alert ───────────────────────── */

export type AlertTone = "positive" | "warning" | "risk" | "deficit" | "info" | "saving";

const alertTones: Record<AlertTone, { box: string; icon: LucideIcon; iconClass: string }> = {
  positive: { box: "bg-positive-bg border-positive/20", icon: CircleCheck, iconClass: "text-positive" },
  warning: { box: "bg-warning-bg border-warning/25", icon: TriangleAlert, iconClass: "text-warning" },
  risk: { box: "bg-risk-bg border-risk/25", icon: CircleAlert, iconClass: "text-risk" },
  deficit: { box: "bg-risk-bg border-risk/60", icon: ShieldAlert, iconClass: "text-risk" },
  info: { box: "bg-info-bg border-info/20", icon: Info, iconClass: "text-info" },
  saving: { box: "bg-saving-bg border-saving/20", icon: Info, iconClass: "text-saving" },
};

export interface AlertProps {
  tone: AlertTone;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  icon?: LucideIcon;
  role?: "alert" | "status";
  className?: string;
}

export function Alert({ tone, title, children, action, icon, role, className }: AlertProps) {
  const t = alertTones[tone];
  const Icon = icon ?? t.icon;
  return (
    <div role={role} className={cn("flex gap-3 rounded-card border p-3.5", t.box, className)}>
      <Icon aria-hidden size={18} strokeWidth={1.8} className={cn("mt-0.5 shrink-0", t.iconClass)} />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold leading-5 text-ink">{title}</p>
        {children && <div className="mt-1 text-[14px] leading-5 text-ink-2">{children}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}

/* ───────────────────────── Switch ───────────────────────── */

export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className="flex min-h-11 w-full items-center justify-between gap-4 py-2 text-left"
    >
      <span className="min-w-0">
        <span className="block text-[15px] font-semibold text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-[13px] leading-5 text-ink-2">{description}</span>}
      </span>
      <span
        aria-hidden
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-150",
          checked ? "bg-primary-solid" : "bg-line-strong",
        )}
      >
        <span
          className={cn(
            "absolute top-1 size-5 rounded-full bg-white shadow-card transition-[left] duration-150",
            checked ? "left-6" : "left-1",
          )}
        />
      </span>
    </button>
  );
}
