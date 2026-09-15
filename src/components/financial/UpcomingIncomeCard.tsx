import { CalendarClock } from "lucide-react";
import type { ISODate, Transaction } from "@/types/finance";
import { Badge } from "@/components/ui/Badge";
import { Card, Eyebrow } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { daysBetween, formatDayMonth, pluralDays } from "@/lib/dates";
import { toNio } from "@/lib/format";
import { MoneyValue } from "./MoneyValue";

export interface UpcomingIncomeCardProps {
  event: Transaction;
  today: ISODate;
  exchangeRate: number;
  eyebrow?: string;
  className?: string;
}

/** Next expected income. Never presented as current balance (spec §30). */
export function UpcomingIncomeCard({ event, today, exchangeRate, eyebrow = "Próximo ingreso", className }: UpcomingIncomeCardProps) {
  const inDays = daysBetween(today, event.date);
  const net = event.amount;
  const isUsd = event.currency === "USD";
  return (
    <Card aria-labelledby={`next-${event.id}`} className={cn("flex flex-col", className)}>
      <div className="flex items-center justify-between gap-2">
        <Eyebrow>{eyebrow}</Eyebrow>
        <Badge tone="info" icon={CalendarClock}>
          Esperado
        </Badge>
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <h2 id={`next-${event.id}`} className="truncate text-[16px] font-bold leading-6 text-ink">
            {event.title}
          </h2>
          <p className="text-[13px] leading-5 text-ink-2">
            {formatDayMonth(event.date)} · {inDays === 0 ? "hoy" : `en ${pluralDays(inDays)}`}
          </p>
        </div>
      </div>

      <dl className="mt-3 space-y-1.5 text-[14px]">
        {event.breakdown?.map((line) => (
          <div key={line.label} className="flex items-center justify-between gap-3">
            <dt className="text-ink-2">{line.label}</dt>
            <dd>
              <MoneyValue amount={line.amount} currency={event.currency} tone={line.amount < 0 ? "default" : "muted"} />
            </dd>
          </div>
        ))}
        <div
          className={cn(
            "flex items-center justify-between gap-3",
            event.breakdown?.length && "border-t border-line pt-2",
          )}
        >
          <dt className="font-semibold text-ink">Neto esperado</dt>
          <dd className="text-right">
            <MoneyValue amount={net} currency={event.currency} className="text-[18px] font-bold" />
            {isUsd && (
              <span className="block text-[13px] text-ink-2">
                <MoneyValue amount={toNio(net, "USD", exchangeRate)} decimals={0} approx tone="inherit" />
              </span>
            )}
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-[13px] leading-5 text-ink-2">No suma a tu dinero libre hasta que lo recibas.</p>
    </Card>
  );
}
