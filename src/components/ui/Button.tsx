import Link from "next/link";
import { forwardRef } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "tertiary";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "relative inline-flex select-none items-center justify-center gap-2 rounded-[10px] font-semibold transition-colors duration-150 ease-[var(--ease-standard)] disabled:cursor-not-allowed";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-solid text-on-primary enabled:hover:bg-primary-solid-hover enabled:active:bg-primary-solid-pressed disabled:bg-neutral-bg disabled:text-ink-2",
  secondary:
    "border border-line bg-surface text-ink enabled:hover:bg-subtle enabled:active:bg-neutral-bg disabled:border-control-line disabled:bg-neutral-bg disabled:text-ink-2",
  tertiary:
    "text-primary enabled:hover:bg-primary-soft enabled:active:text-primary-pressed disabled:bg-neutral-bg disabled:text-ink-2",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-11 px-3 text-[14px]",
  md: "min-h-[46px] px-4 text-[15px]",
  lg: "min-h-12 px-5 text-[15px]",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}) {
  return cn(base, variants[variant], sizes[size], fullWidth && "w-full", className);
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  loadingLabel?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant,
    size,
    fullWidth,
    loading = false,
    loadingLabel = "Procesando…",
    disabled,
    className,
    type = "button",
    children,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    >
      <span className={cn("inline-flex items-center justify-center gap-2", loading && "invisible")}>{children}</span>
      {loading && (
        <span className="absolute inset-0 grid place-items-center" role="status">
          <LoaderCircle aria-hidden size={18} strokeWidth={2} className="animate-spin" />
          <span className="sr-only">{loadingLabel}</span>
        </span>
      )}
    </button>
  );
});

export interface ButtonLinkProps extends React.ComponentProps<typeof Link> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export function ButtonLink({ variant, size, fullWidth, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses({ variant, size, fullWidth, className })} {...props} />;
}
