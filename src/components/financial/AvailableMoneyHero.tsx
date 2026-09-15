import type { Currency, FinancialStatus, ISODate } from "@/types/finance";
import { Card, Eyebrow } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { formatDayMonth, pluralDays } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { FinancialStatusBadge } from "./FinancialStatusBadge";
import { MoneyValue } from "./MoneyValue";

export interface AvailableMoneyHeroProps {
  amount: number;
  currency?: Currency;
  status: FinancialStatus;
  horizonLabel?: string;
  horizonDate?: ISODate;
  daysRemaining?: number;
  /** Replaces the horizon lines when the page already shows the horizon. */
  caption?: React.ReactNode;
  /** Missing money to keep every protection intact (only when status is risk/deficit). */
  shortfall?: number;
  eyebrow?: string;
  /** FinancialSummary goes here — inside the same card, never as four separate cards. */
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  headingId?: string;
}

/** "PUEDES GASTAR HOY · C$X" — the number the whole product is built around (spec §110). */
export function AvailableMoneyHero({
  amount,
  currency = "NIO",
  status,
  horizonLabel,
  horizonDate,
  daysRemaining,
  caption,
  shortfall = 0,
  eyebrow = "Puedes gastar hoy",
  children,
  footer,
  className,
  headingId = "hero-title",
}: AvailableMoneyHeroProps) {
  const chars = formatMoney(amount, currency).length;
  return (
    <Card padding="hero" aria-labelledby={headingId} className={cn("flex flex-col", className)}>
      <div className="flex items-center justify-between gap-3">
        <Eyebrow as="h2" id={headingId}>
          {eyebrow}
        </Eyebrow>
        <FinancialStatusBadge status={status} />
      </div>

      <div className="hero-amount-wrap mt-2">
        <p className="hero-amount text-ink" style={{ "--chars": chars } as React.CSSProperties}>
          <MoneyValue amount={amount} currency={currency} decimals={2} tone="inherit" />
        </p>
      </div>

      {shortfall > 0 && (
        <p className="mt-1 text-[14px] font-semibold leading-5 text-risk">
          Faltan <MoneyValue amount={shortfall} tone="inherit" decimals={2} /> para cubrir tus protecciones
        </p>
      )}

      {caption ? (
        <p className="mt-1.5 text-[14px] leading-5 text-ink-2">{caption}</p>
      ) : (
        horizonDate && (
          <p className="mt-1.5 text-[14px] leading-5 text-ink-2">
            {horizonLabel} · <span className="font-semibold text-ink">{formatDayMonth(horizonDate)}</span>
            {daysRemaining !== undefined && (
              <>
                <br />
                {pluralDays(daysRemaining)} restantes
              </>
            )}
          </p>
        )
      )}

      {children && <div className="mt-4">{children}</div>}
      {footer && <div className="mt-3">{footer}</div>}
    </Card>
  );
}
