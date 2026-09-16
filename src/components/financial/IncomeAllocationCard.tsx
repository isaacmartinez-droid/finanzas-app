import { ArrowDown, CircleCheck, PiggyBank, WalletCards } from "lucide-react";
import type { Transaction } from "@/types/finance";
import { Badge } from "@/components/ui/Badge";
import { Card, SectionHeader } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { formatDayMonth } from "@/lib/dates";
import { round2, toNio } from "@/lib/format";
import { MoneyValue } from "./MoneyValue";

export interface IncomeAllocationCardProps {
  income: Transaction;
  exchangeRate: number;
  /** Undefined means the current model has no automatic savings rule. */
  automaticSavings?: number;
  className?: string;
}

/** Explains what the current frontend model did with a received income. */
export function IncomeAllocationCard({
  income,
  exchangeRate,
  automaticSavings,
  className,
}: IncomeAllocationCardProps) {
  const received = round2(toNio(income.amount, income.currency, exchangeRate));
  const configured = automaticSavings !== undefined;
  const reserved = configured ? Math.max(0, automaticSavings) : 0;
  const remaining = round2(received - reserved);

  const rows = [
    { id: "received", label: "Ingreso recibido", icon: CircleCheck, amount: received },
    { id: "saving", label: "Ahorro automático", icon: PiggyBank, amount: configured ? -reserved : undefined },
    { id: "remaining", label: "Disponible para distribuir", icon: WalletCards, amount: remaining },
  ];

  return (
    <Card className={cn("flex flex-col", className)} aria-labelledby={`allocation-${income.id}`}>
      <SectionHeader
        id={`allocation-${income.id}`}
        title="Distribución del ingreso"
        eyebrow={`${income.title} recibido · ${formatDayMonth(income.date)}`}
      />
      <ol className="mt-3">
        {rows.map((row, index) => {
          const Icon = row.icon;
          return (
            <li key={row.id}>
              <div className="flex items-center gap-3 rounded-inner bg-subtle px-3 py-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-surface text-primary">
                  <Icon aria-hidden size={16} strokeWidth={1.8} />
                </span>
                <span className="min-w-0 flex-1 text-[13px] font-medium leading-5 text-ink-2">{row.label}</span>
                {row.amount === undefined ? (
                  <Badge tone="outline">No configurado</Badge>
                ) : (
                  <MoneyValue
                    amount={row.amount}
                    decimals={2}
                    tone={row.id === "saving" ? "saving" : "default"}
                    className="text-[14px] font-bold"
                  />
                )}
              </div>
              {index < rows.length - 1 && (
                <ArrowDown aria-hidden size={15} strokeWidth={1.8} className="mx-auto my-0.5 text-ink-3" />
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-[13px] leading-5 text-ink-2">
        {configured
          ? "Esta es la distribución resultante de la regla configurada."
          : "No hay una regla de ahorro automático en el modelo actual; por eso no se apartó dinero de este ingreso."}
      </p>
    </Card>
  );
}
