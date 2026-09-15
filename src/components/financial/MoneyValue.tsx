import type { Currency } from "@/types/finance";
import { cn } from "@/lib/cn";
import { formatMaskedMoney, formatMoney, type Decimals, type SignMode } from "@/lib/format";

export type MoneyTone = "default" | "muted" | "positive" | "warning" | "risk" | "saving" | "info" | "inherit";

const toneClass: Record<MoneyTone, string> = {
  default: "text-ink",
  muted: "text-ink-2",
  positive: "text-positive",
  warning: "text-warning",
  risk: "text-risk",
  saving: "text-saving",
  info: "text-info",
  inherit: "",
};

export interface MoneyValueProps {
  amount: number;
  currency?: Currency;
  decimals?: Decimals;
  sign?: SignMode;
  /** Prefix "≈" for converted or estimated values. */
  approx?: boolean;
  tone?: MoneyTone;
  strike?: boolean;
  className?: string;
}

/**
 * The only way amounts are rendered. Renders both the real and the masked
 * value; `html[data-privacy=on]` decides which one is displayed, so hiding
 * amounts is global, instant and flash-free (spec §21).
 */
export function MoneyValue({
  amount,
  currency = "NIO",
  decimals = "auto",
  sign = "auto",
  approx,
  tone = "default",
  strike,
  className,
}: MoneyValueProps) {
  const prefix = approx ? "≈ " : "";
  return (
    <span className={cn("money", toneClass[tone], className)}>
      <span className={cn("money-real", strike && "line-through decoration-1")}>
        {prefix}
        {formatMoney(amount, currency, { decimals, sign })}
      </span>
      <span className="money-masked">
        <span aria-hidden>
          {prefix}
          {formatMaskedMoney(amount, currency, sign)}
        </span>
        <span className="sr-only">Monto oculto</span>
      </span>
    </span>
  );
}

/** Signed change: teal when it adds, neutral ink when it subtracts (red is reserved for risk). */
export function MoneyDelta({
  amount,
  currency = "NIO",
  decimals = "auto",
  className,
}: {
  amount: number;
  currency?: Currency;
  decimals?: Decimals;
  className?: string;
}) {
  return (
    <MoneyValue
      amount={amount}
      currency={currency}
      decimals={decimals}
      sign="always"
      tone={amount > 0 ? "positive" : "default"}
      className={className}
    />
  );
}
